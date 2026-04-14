/**
 * MULTI-FACTOR AUTHENTICATION SERVICE
 * Comprehensive MFA implementation with Google Authenticator, SMS, and Email support
 */

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { db } from './db';
import { members } from '@shared/membership-schema';
import { eq } from 'drizzle-orm';

// Email configuration
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Temporary storage for pending MFA setups and verifications
const pendingMfaSetups = new Map<string, {
  memberId: number;
  secret: string;
  expires: Date;
}>();

const pendingVerifications = new Map<string, {
  memberId: number;
  code: string;
  method: 'email';
  expires: Date;
  purpose: 'login' | 'setup' | 'disable';
}>();

export class MFAService {
  
  /**
   * Generate backup codes for MFA
   */
  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`);
    }
    return codes;
  }

  /**
   * Setup Google Authenticator TOTP
   */
  static async setupAuthenticator(memberId: number): Promise<{
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
  }> {
    // Get member info
    const [member] = await db.select().from(members).where(eq(members.id, memberId));
    if (!member) {
      throw new Error('Member not found');
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `${member.firstName} ${member.lastName}`,
      issuer: 'Up Arrow Inc',
      length: 32,
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    // Store in pending setups (expires in 10 minutes)
    const setupId = crypto.randomUUID();
    pendingMfaSetups.set(setupId, {
      memberId,
      secret: secret.base32,
      expires: new Date(Date.now() + 10 * 60 * 1000),
    });

    return {
      secret: secret.base32,
      qrCodeUrl,
      backupCodes,
    };
  }

  /**
   * Verify and complete MFA setup
   */
  static async completeAuthenticatorSetup(memberId: number, token: string, backupCodes: string[]): Promise<boolean> {
    // Find pending setup
    const pendingSetup = Array.from(pendingMfaSetups.entries())
      .find(([_, setup]) => setup.memberId === memberId && setup.expires > new Date());

    if (!pendingSetup) {
      throw new Error('No pending MFA setup found or setup expired');
    }

    const [setupId, setup] = pendingSetup;

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: setup.secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps before/after
    });

    if (!verified) {
      return false;
    }

    // Hash backup codes
    const hashedBackupCodes = backupCodes.map(code => 
      crypto.createHash('sha256').update(code).digest('hex')
    );

    // Save to database
    await db.update(members)
      .set({
        mfaEnabled: true,
        mfaSecret: setup.secret,
        mfaBackupCodes: JSON.stringify(hashedBackupCodes),
        preferredMfaMethod: 'authenticator',
        updatedAt: new Date(),
      })
      .where(eq(members.id, memberId));

    // Clean up pending setup
    pendingMfaSetups.delete(setupId);

    return true;
  }

  /**
   * Send email verification code
   */
  static async sendEmailCode(memberId: number, purpose: 'login' | 'setup' | 'disable' = 'login'): Promise<boolean> {
    const [member] = await db.select().from(members).where(eq(members.id, memberId));
    if (!member) {
      throw new Error('Member not found');
    }

    // Generate 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();
    
    // Store verification code (expires in 5 minutes)
    const verificationId = crypto.randomUUID();
    pendingVerifications.set(verificationId, {
      memberId,
      code: crypto.createHash('sha256').update(code).digest('hex'),
      method: 'email',
      expires: new Date(Date.now() + 5 * 60 * 1000),
      purpose,
    });

    const purposeText = {
      login: 'sign in to your account',
      setup: 'set up multi-factor authentication',
      disable: 'disable multi-factor authentication',
    }[purpose];

    try {
      await emailTransporter.sendMail({
        from: process.env.FROM_EMAIL || 'security@uparrowinc.com',
        to: member.email,
        subject: 'Up Arrow Inc - Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Verification Code</h2>
            <p>Hello ${member.firstName},</p>
            <p>Your verification code to ${purposeText} is:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="font-size: 32px; letter-spacing: 8px; margin: 0; color: #333;">${code}</h1>
            </div>
            <p>This code will expire in 5 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
            <hr style="margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">Up Arrow Inc Security Team</p>
          </div>
        `,
      });

      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      pendingVerifications.delete(verificationId);
      return false;
    }
  }

  /**
   * Verify MFA token/code
   */
  static async verifyMFA(memberId: number, token: string, method?: 'authenticator' | 'email' | 'backup'): Promise<{
    success: boolean;
    remainingAttempts?: number;
    lockedUntil?: Date;
  }> {
    const [member] = await db.select().from(members).where(eq(members.id, memberId));
    if (!member) {
      throw new Error('Member not found');
    }

    // Check if account is locked
    if (member.mfaLockedUntil && member.mfaLockedUntil > new Date()) {
      return {
        success: false,
        lockedUntil: member.mfaLockedUntil,
      };
    }

    let verified = false;

    // Try different verification methods
    if (!method || method === 'authenticator') {
      if (member.mfaSecret) {
        verified = speakeasy.totp.verify({
          secret: member.mfaSecret,
          encoding: 'base32',
          token,
          window: 2,
        });
      }
    }

    if (!verified && (!method || method === 'backup')) {
      const backupCodesArr: string[] = JSON.parse(member.mfaBackupCodes || '[]');
      if (backupCodesArr.length > 0) {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const backupIndex = backupCodesArr.indexOf(hashedToken);
        if (backupIndex !== -1) {
          verified = true;
          
          // Remove used backup code
          const updatedBackupCodes = [...backupCodesArr];
          updatedBackupCodes.splice(backupIndex, 1);
          
          await db.update(members)
            .set({
              mfaBackupCodes: JSON.stringify(updatedBackupCodes),
              updatedAt: new Date(),
            })
            .where(eq(members.id, memberId));
        }
      }
    }

    if (!verified && method === 'email') {
      // Check pending verifications
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      const pendingVerification = Array.from(pendingVerifications.entries())
        .find(([_, verification]) => 
          verification.memberId === memberId && 
          verification.code === hashedToken &&
          verification.method === method &&
          verification.expires > new Date()
        );

      if (pendingVerification) {
        verified = true;
        pendingVerifications.delete(pendingVerification[0]);
      }
    }

    if (verified) {
      // Reset failed attempts and update last used
      await db.update(members)
        .set({
          failedMfaAttempts: 0,
          mfaLockedUntil: null,
          lastMfaUsed: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(members.id, memberId));

      return { success: true };
    } else {
      // Increment failed attempts
      const newFailedAttempts = (member.failedMfaAttempts || 0) + 1;
      const remainingAttempts = Math.max(0, 5 - newFailedAttempts);
      
      let lockedUntil: Date | null = null;
      if (newFailedAttempts >= 5) {
        // Lock for 30 minutes after 5 failed attempts
        lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
      }

      await db.update(members)
        .set({
          failedMfaAttempts: newFailedAttempts,
          mfaLockedUntil: lockedUntil,
          updatedAt: new Date(),
        })
        .where(eq(members.id, memberId));

      return {
        success: false,
        remainingAttempts,
        lockedUntil: lockedUntil || undefined,
      };
    }
  }

  /**
   * Disable MFA for a member
   */
  static async disableMFA(memberId: number): Promise<void> {
    await db.update(members)
      .set({
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: '[]',
        failedMfaAttempts: 0,
        mfaLockedUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(members.id, memberId));
  }

  /**
   * Check if member requires MFA
   */
  static async requiresMFA(memberId: number): Promise<boolean> {
    const [member] = await db.select().from(members).where(eq(members.id, memberId));
    return member?.mfaEnabled || false;
  }

  /**
   * Clean up expired pending verifications (run periodically)
   */
  static cleanupExpired(): void {
    const now = new Date();
    
    // Clean up expired MFA setups
    Array.from(pendingMfaSetups.entries()).forEach(([id, setup]) => {
      if (setup.expires <= now) {
        pendingMfaSetups.delete(id);
      }
    });

    // Clean up expired verifications
    Array.from(pendingVerifications.entries()).forEach(([id, verification]) => {
      if (verification.expires <= now) {
        pendingVerifications.delete(id);
      }
    });
  }
}

// Clean up expired entries every 5 minutes
setInterval(() => {
  MFAService.cleanupExpired();
}, 5 * 60 * 1000);