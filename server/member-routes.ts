/**
 * MEMBER PORTAL ROUTES
 * Handles member authentication, MFA, training access, ticketing, and billing
 */

import type { Express, Request, Response } from "express";
import bcrypt from 'bcrypt';
import { db } from './db';
import { members, supportTickets, invoices, courses, memberEnrollments, type Member } from '@shared/membership-schema';
import { eq, and, desc, count } from 'drizzle-orm';
import { MFAService } from './mfa-service';
import { passwordResetService } from './password-reset-service';

// Extend Express types
declare global {
  namespace Express {
    interface Request {
      member?: Member;
    }
    interface Session {
      memberId?: number;
      mfaVerified?: boolean;
    }
  }
}

// Member authentication middleware
async function authenticateMember(req: Request, res: Response, next: Function) {
  const sessionMemberId = (req.session as any)?.memberId;
  if (!sessionMemberId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const [member] = await db.select().from(members).where(eq(members.id, sessionMemberId));
    if (!member || !member.isApproved || member.membershipStatus !== 'active') {
      return res.status(403).json({ error: 'Account not authorized' });
    }

    req.member = member;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' });
  }
}

// MFA verification middleware
async function requireMFA(req: Request, res: Response, next: Function) {
  if (!req.member) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Check if MFA is enabled and verified for this session
  if (req.member.mfaEnabled && !(req.session as any)?.mfaVerified) {
    return res.status(403).json({ error: 'MFA verification required' });
  }

  next();
}

// Access control middleware
function requireAccess(accessType: 'training' | 'ticketing' | 'billing') {
  return (req: Request, res: Response, next: Function) => {
    if (!req.member) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const hasAccess = {
      training: req.member.hasTrainingAccess,
      ticketing: req.member.hasTicketingAccess,
      billing: req.member.hasBillingAccess,
    }[accessType];

    if (!hasAccess) {
      return res.status(403).json({ error: `${accessType} access not granted` });
    }

    next();
  };
}

export function registerMemberRoutes(app: Express) {
  
  // Member login
  app.post('/api/members/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const [member] = await db.select().from(members).where(eq(members.email, email));
      if (!member) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, member.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (!member.isApproved) {
        return res.status(403).json({ error: 'Account pending approval' });
      }

      if (member.membershipStatus !== 'active') {
        return res.status(403).json({ error: 'Account not active' });
      }

      // Set session
      (req.session as any).memberId = member.id;
      
      // Update last login
      await db.update(members)
        .set({ lastLoginAt: new Date() })
        .where(eq(members.id, member.id));

      res.json({
        success: true,
        memberId: member.id,
        requiresMFA: member.mfaEnabled,
        member: {
          id: member.id,
          email: member.email,
          firstName: member.firstName,
          lastName: member.lastName,
          membershipTier: member.membershipTier,
          hasTrainingAccess: member.hasTrainingAccess,
          hasTicketingAccess: member.hasTicketingAccess,
          hasBillingAccess: member.hasBillingAccess,
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Member logout
  app.post('/api/members/logout', (req: Request, res: Response) => {
    req.session?.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ success: true });
    });
  });

  // Get current member info
  app.get('/api/members/me', authenticateMember, (req: Request, res: Response) => {
    const member = req.member!;
    res.json({
      id: member.id,
      email: member.email,
      firstName: member.firstName,
      lastName: member.lastName,
      phone: member.phone,
      company: member.company,
      jobTitle: member.jobTitle,
      membershipTier: member.membershipTier,
      membershipStatus: member.membershipStatus,
      hasTrainingAccess: member.hasTrainingAccess,
      hasTicketingAccess: member.hasTicketingAccess,
      hasBillingAccess: member.hasBillingAccess,
      mfaEnabled: member.mfaEnabled,
      phoneVerified: member.phoneVerified,
      emailVerified: member.emailVerified,
    });
  });

  // MFA Routes
  app.post('/api/members/:id/mfa/setup-authenticator', authenticateMember, async (req: Request, res: Response) => {
    try {
      const memberId = parseInt(String(req.params.id));
      if (req.member!.id !== memberId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const setupData = await MFAService.setupAuthenticator(memberId);
      res.json(setupData);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/members/:id/mfa/verify-authenticator', authenticateMember, async (req: Request, res: Response) => {
    try {
      const memberId = parseInt(String(req.params.id));
      const { token, backupCodes } = req.body;

      if (req.member!.id !== memberId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const success = await MFAService.completeAuthenticatorSetup(memberId, token, backupCodes);
      res.json({ success });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/members/:id/mfa/send-email', authenticateMember, async (req: Request, res: Response) => {
    try {
      const memberId = parseInt(String(req.params.id));
      const { purpose } = req.body;

      if (req.member!.id !== memberId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const success = await MFAService.sendEmailCode(memberId, purpose);
      res.json({ success });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/members/:id/mfa/verify', authenticateMember, async (req: Request, res: Response) => {
    try {
      const memberId = parseInt(String(req.params.id));
      const { token, method } = req.body;

      if (req.member!.id !== memberId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const result = await MFAService.verifyMFA(memberId, token, method);
      
      if (result.success) {
        (req.session as any).mfaVerified = true;
      }

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/members/:id/mfa/disable', authenticateMember, requireMFA, async (req: Request, res: Response) => {
    try {
      const memberId = parseInt(String(req.params.id));

      if (req.member!.id !== memberId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await MFAService.disableMFA(memberId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Training Access Routes
  app.get('/api/members/training/courses', authenticateMember, requireMFA, requireAccess('training'), async (req: Request, res: Response) => {
    try {
      const memberCourses = await db
        .select({
          course: courses,
          enrollment: memberEnrollments,
        })
        .from(courses)
        .leftJoin(memberEnrollments, and(
          eq(memberEnrollments.courseId, courses.id),
          eq(memberEnrollments.memberId, req.member!.id)
        ))
        .where(eq(courses.isPublished, true));

      res.json(memberCourses);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch courses' });
    }
  });

  app.post('/api/members/training/enroll/:courseId', authenticateMember, requireMFA, requireAccess('training'), async (req: Request, res: Response) => {
    try {
      const courseId = parseInt(String(req.params.courseId));
      const memberId = req.member!.id;

      // Check if already enrolled
      const [existing] = await db
        .select()
        .from(memberEnrollments)
        .where(and(
          eq(memberEnrollments.memberId, memberId),
          eq(memberEnrollments.courseId, courseId)
        ));

      if (existing) {
        return res.status(400).json({ error: 'Already enrolled in this course' });
      }

      await db.insert(memberEnrollments).values({
        memberId,
        courseId,
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Enrollment failed' });
    }
  });

  // Ticketing System Routes
  app.get('/api/members/tickets', authenticateMember, requireMFA, requireAccess('ticketing'), async (req: Request, res: Response) => {
    try {
      const tickets = await db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.memberId, req.member!.id))
        .orderBy(desc(supportTickets.createdAt));

      res.json(tickets);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch tickets' });
    }
  });

  app.post('/api/members/tickets', authenticateMember, requireMFA, requireAccess('ticketing'), async (req: Request, res: Response) => {
    try {
      const { subject, description, category, priority } = req.body;
      const memberId = req.member!.id;

      // Generate ticket number
      const ticketNumber = `TK-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      const [ticket] = await db.insert(supportTickets).values({
        ticketNumber,
        memberId,
        subject,
        description,
        category: category || 'general',
        priority: priority || 'medium',
        status: 'open',
        userAgent: req.headers['user-agent'] || '',
        ipAddress: req.ip || '',
      }).returning();

      res.json(ticket);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create ticket' });
    }
  });

  // Billing and Invoice Routes
  app.get('/api/members/invoices', authenticateMember, requireMFA, requireAccess('billing'), async (req: Request, res: Response) => {
    try {
      const memberInvoices = await db
        .select()
        .from(invoices)
        .where(eq(invoices.memberId, req.member!.id))
        .orderBy(desc(invoices.createdAt));

      res.json(memberInvoices);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch invoices' });
    }
  });

  app.get('/api/members/invoices/:id', authenticateMember, requireMFA, requireAccess('billing'), async (req: Request, res: Response) => {
    try {
      const invoiceId = parseInt(String(req.params.id));
      
      const [invoice] = await db
        .select()
        .from(invoices)
        .where(and(
          eq(invoices.id, invoiceId),
          eq(invoices.memberId, req.member!.id)
        ));

      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      res.json(invoice);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch invoice' });
    }
  });

  // Member portal dashboard
  app.get('/api/members/dashboard', authenticateMember, requireMFA, async (req: Request, res: Response) => {
    try {
      const memberId = req.member!.id;

      // Get dashboard data
      const [ticketCountResult] = await db
        .select({ count: count() })
        .from(supportTickets)
        .where(eq(supportTickets.memberId, memberId));

      const [courseCountResult] = await db
        .select({ count: count() })
        .from(memberEnrollments)
        .where(eq(memberEnrollments.memberId, memberId));

      const recentInvoices = await db
        .select()
        .from(invoices)
        .where(eq(invoices.memberId, memberId))
        .orderBy(desc(invoices.createdAt))
        .limit(5);

      res.json({
        member: {
          firstName: req.member!.firstName,
          lastName: req.member!.lastName,
          membershipTier: req.member!.membershipTier,
          membershipStatus: req.member!.membershipStatus,
        },
        stats: {
          ticketCount: ticketCountResult?.count || 0,
          courseCount: courseCountResult?.count || 0,
        },
        recentInvoices: recentInvoices,
        accessPermissions: {
          training: req.member!.hasTrainingAccess,
          ticketing: req.member!.hasTicketingAccess,
          billing: req.member!.hasBillingAccess,
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  });

  // Password reset routes
  app.post('/api/members/password-reset/initiate', async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const result = await passwordResetService.initiatePasswordReset(email);
      res.json(result);
    } catch (error) {
      console.error('Password reset initiation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/members/password-reset/verify-mfa', async (req: Request, res: Response) => {
    try {
      const { memberId, token, method } = req.body;
      const result = await passwordResetService.verifyMFAForPasswordReset(memberId, token, method);
      res.json(result);
    } catch (error) {
      console.error('Password reset MFA verification error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/members/password-reset/complete', async (req: Request, res: Response) => {
    try {
      const { tokenId, token, newPassword } = req.body;
      const result = await passwordResetService.resetPassword(tokenId, token, newPassword);
      res.json(result);
    } catch (error) {
      console.error('Password reset completion error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}