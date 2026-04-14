import { db } from './db';
import { members } from '@shared/membership-schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { MFAService } from './mfa-service';

interface PasswordResetToken {
  id: string;
  memberId: number;
  token: string;
  expiresAt: Date;
  isUsed: boolean;
  mfaVerified: boolean;
  createdAt: Date;
}

// In-memory store for password reset tokens (in production, use Redis or database)
const resetTokens = new Map<string, PasswordResetToken>();

// Email transporter configuration
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export class PasswordResetService {
  
  // Generate secure random salt
  private generateSalt(rounds: number = 12): string {
    return bcrypt.genSaltSync(rounds);
  }

  // Hash password with salt
  private async hashPassword(password: string): Promise<string> {
    const salt = this.generateSalt(12);
    return bcrypt.hash(password, salt);
  }

  // Verify password against hash
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Generate secure reset token
  private generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Generate reset token ID
  private generateTokenId(): string {
    return crypto.randomUUID();
  }

  // Step 1: Initiate password reset (requires email verification)
  async initiatePasswordReset(email: string): Promise<{ success: boolean; message: string; requiresMFA?: boolean; memberId?: number }> {
    try {
      // Find member by email
      const [member] = await db.select()
        .from(members)
        .where(eq(members.email, email))
        .limit(1);

      if (!member) {
        // Don't reveal if email exists for security
        return { 
          success: true, 
          message: 'If the email exists, you will receive password reset instructions.' 
        };
      }

      // Check if member has MFA enabled
      if (member.mfaEnabled) {
        return {
          success: true,
          message: 'MFA verification required before password reset.',
          requiresMFA: true,
          memberId: member.id
        };
      }

      // Generate and store reset token
      const token = this.generateResetToken();
      const tokenId = this.generateTokenId();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      resetTokens.set(tokenId, {
        id: tokenId,
        memberId: member.id,
        token: token,
        expiresAt,
        isUsed: false,
        mfaVerified: !member.mfaEnabled, // True if no MFA required
        createdAt: new Date()
      });

      // Send reset email
      await this.sendPasswordResetEmail(member.email, member.firstName || 'Member', tokenId, token);

      return { 
        success: true, 
        message: 'Password reset instructions sent to your email.' 
      };

    } catch (error) {
      console.error('Password reset initiation failed:', error);
      return { 
        success: false, 
        message: 'Failed to initiate password reset. Please try again.' 
      };
    }
  }

  // Step 2: Verify MFA for password reset
  async verifyMFAForPasswordReset(memberId: number, token: string, method: 'totp' | 'sms' | 'email'): Promise<{ success: boolean; message: string; tokenId?: string }> {
    try {
      // Verify MFA
      const mfaMethod = method === 'totp' ? 'authenticator' : method === 'sms' ? 'email' : (method as 'email' | 'authenticator' | 'backup');
      const mfaResult = await MFAService.verifyMFA(memberId, token, mfaMethod);
      
      if (!mfaResult.success) {
        return { success: false, message: 'MFA verification failed' };
      }

      // Find member
      const [member] = await db.select()
        .from(members)
        .where(eq(members.id, memberId))
        .limit(1);

      if (!member) {
        return { success: false, message: 'Member not found.' };
      }

      // Generate and store reset token with MFA verification
      const resetToken = this.generateResetToken();
      const tokenId = this.generateTokenId();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      resetTokens.set(tokenId, {
        id: tokenId,
        memberId: member.id,
        token: resetToken,
        expiresAt,
        isUsed: false,
        mfaVerified: true,
        createdAt: new Date()
      });

      // Send reset email after MFA verification
      await this.sendPasswordResetEmail(member.email, member.firstName || 'Member', tokenId, resetToken);

      return { 
        success: true, 
        message: 'MFA verified. Password reset instructions sent to your email.',
        tokenId 
      };

    } catch (error) {
      console.error('MFA verification for password reset failed:', error);
      return { 
        success: false, 
        message: 'MFA verification failed. Please try again.' 
      };
    }
  }

  // Step 3: Validate reset token
  async validateResetToken(tokenId: string, token: string): Promise<{ valid: boolean; memberId?: number; message: string }> {
    try {
      const resetData = resetTokens.get(tokenId);

      if (!resetData) {
        return { valid: false, message: 'Invalid or expired reset token.' };
      }

      // Check if token matches
      if (resetData.token !== token) {
        return { valid: false, message: 'Invalid reset token.' };
      }

      // Check if token is expired
      if (new Date() > resetData.expiresAt) {
        resetTokens.delete(tokenId);
        return { valid: false, message: 'Reset token has expired.' };
      }

      // Check if token is already used
      if (resetData.isUsed) {
        return { valid: false, message: 'Reset token has already been used.' };
      }

      // Check if MFA was verified (for MFA-enabled accounts)
      if (!resetData.mfaVerified) {
        return { valid: false, message: 'MFA verification required.' };
      }

      return { 
        valid: true, 
        memberId: resetData.memberId, 
        message: 'Reset token is valid.' 
      };

    } catch (error) {
      console.error('Token validation failed:', error);
      return { valid: false, message: 'Token validation failed.' };
    }
  }

  // Step 4: Reset password with new secure hash
  async resetPassword(tokenId: string, token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      // Validate token first
      const validation = await this.validateResetToken(tokenId, token);
      
      if (!validation.valid || !validation.memberId) {
        return { success: false, message: validation.message };
      }

      // Password strength validation
      if (!this.validatePasswordStrength(newPassword)) {
        return { 
          success: false, 
          message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character.' 
        };
      }

      // Hash new password with secure salt
      const hashedPassword = await this.hashPassword(newPassword);

      // Update member password
      await db.update(members)
        .set({ 
          password: hashedPassword,
          updatedAt: new Date()
        })
        .where(eq(members.id, validation.memberId));

      // Mark token as used
      const resetData = resetTokens.get(tokenId);
      if (resetData) {
        resetData.isUsed = true;
        resetTokens.set(tokenId, resetData);
      }

      // Send confirmation email
      const [member] = await db.select()
        .from(members)
        .where(eq(members.id, validation.memberId))
        .limit(1);

      if (member) {
        await this.sendPasswordChangeConfirmationEmail(member.email, member.firstName || 'Member');
      }

      return { 
        success: true, 
        message: 'Password has been successfully reset.' 
      };

    } catch (error) {
      console.error('Password reset failed:', error);
      return { 
        success: false, 
        message: 'Failed to reset password. Please try again.' 
      };
    }
  }

  // Password strength validation
  private validatePasswordStrength(password: string): boolean {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  }

  // Send password reset email
  private async sendPasswordResetEmail(email: string, firstName: string, tokenId: string, token: string): Promise<void> {
    const resetUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/reset-password?tokenId=${tokenId}&token=${token}`;
    
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@uparrowinc.com',
      to: email,
      subject: 'Password Reset Request - Up Arrow Inc',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            .security-notice { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello ${firstName},</p>
              
              <p>We received a request to reset your password for your Up Arrow Inc member account.</p>
              
              <div class="security-notice">
                <strong>🔒 Security Notice:</strong> This request was processed after MFA verification to ensure account security.
              </div>
              
              <p>Click the button below to reset your password:</p>
              
              <a href="${resetUrl}" class="button">Reset Password</a>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 3px;">${resetUrl}</p>
              
              <p><strong>This link will expire in 15 minutes</strong> for security reasons.</p>
              
              <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
              
              <p>Best regards,<br>Up Arrow Inc Security Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>© ${new Date().getFullYear()} Up Arrow Inc. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await emailTransporter.sendMail(mailOptions);
  }

  // Send password change confirmation email
  private async sendPasswordChangeConfirmationEmail(email: string, firstName: string): Promise<void> {
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@uparrowinc.com',
      to: email,
      subject: 'Password Successfully Changed - Up Arrow Inc',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #51cf66 0%, #40c057 100%); color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            .success-notice { background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Password Successfully Changed</h1>
            </div>
            <div class="content">
              <p>Hello ${firstName},</p>
              
              <div class="success-notice">
                <strong>Your password has been successfully changed</strong> at ${new Date().toLocaleString()}.
              </div>
              
              <p>Your Up Arrow Inc member account password has been updated with enhanced security:</p>
              
              <ul>
                <li>🔐 Encrypted with bcrypt and random salt</li>
                <li>🛡️ MFA verification completed</li>
                <li>🔒 Secure one-way hashing applied</li>
              </ul>
              
              <p>If you did not make this change, please contact our support team immediately.</p>
              
              <p>For your security, we recommend:</p>
              <ul>
                <li>Using a unique password for this account</li>
                <li>Enabling MFA if not already active</li>
                <li>Regularly updating your password</li>
              </ul>
              
              <p>Best regards,<br>Up Arrow Inc Security Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>© ${new Date().getFullYear()} Up Arrow Inc. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await emailTransporter.sendMail(mailOptions);
  }

  // Clean expired tokens (call periodically)
  cleanExpiredTokens(): void {
    const now = new Date();
    for (const [tokenId, resetData] of Array.from(resetTokens.entries())) {
      if (now > resetData.expiresAt || resetData.isUsed) {
        resetTokens.delete(tokenId);
      }
    }
  }

  // Get reset token statistics
  getTokenStats(): { total: number; active: number; expired: number; used: number } {
    const now = new Date();
    let active = 0, expired = 0, used = 0;

    for (const resetData of Array.from(resetTokens.values())) {
      if (resetData.isUsed) {
        used++;
      } else if (now > resetData.expiresAt) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total: resetTokens.size,
      active,
      expired,
      used
    };
  }
}

export const passwordResetService = new PasswordResetService();