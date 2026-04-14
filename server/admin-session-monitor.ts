import { Request, Response } from 'express';

export interface ActiveAdminSession {
  sessionId: string;
  username: string;
  loginTime: Date;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  lastActivity: Date;
  isActive: boolean;
}

export class AdminSessionMonitor {
  private static instance: AdminSessionMonitor;
  private activeSessions: Map<string, ActiveAdminSession> = new Map();

  static getInstance(): AdminSessionMonitor {
    if (!AdminSessionMonitor.instance) {
      AdminSessionMonitor.instance = new AdminSessionMonitor();
    }
    return AdminSessionMonitor.instance;
  }

  // Track admin login
  async trackAdminLogin(sessionId: string, username: string, req: Request): Promise<void> {
    const session: ActiveAdminSession = {
      sessionId,
      username,
      loginTime: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      lastActivity: new Date(),
      isActive: true
    };

    this.activeSessions.set(sessionId, session);
    console.log(`🔐 Admin logged in: ${username} [${sessionId.slice(0, 8)}...] from ${session.ipAddress}`);
  }

  // Update last activity
  updateActivity(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
    }
  }

  // Remove session on logout
  removeSession(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      console.log(`🚪 Admin logged out: ${session.username} [${sessionId.slice(0, 8)}...]`);
      this.activeSessions.delete(sessionId);
    }
  }

  // Get all active admin sessions
  getActiveSessions(): ActiveAdminSession[] {
    const now = new Date();
    const active: ActiveAdminSession[] = [];
    
    this.activeSessions.forEach((session, sessionId) => {
      if (session.expiresAt > now) {
        active.push(session);
      } else {
        // Clean up expired sessions
        this.activeSessions.delete(sessionId);
      }
    });
    
    return active;
  }

  // Get sessions from database
  async getSessionsFromDatabase(): Promise<any[]> {
    try {
      // Import database connection
      const { sqliteDb } = await import('./db');
      
      const query = `
        SELECT * FROM sessions 
        ORDER BY expire DESC 
        LIMIT 20
      `;
      
      try {
        const rows = sqliteDb.prepare(query).all();
        return rows || [];
      } catch {
        return [];
      }
    } catch (error) {
      console.error('Error fetching sessions from database:', error);
      return [];
    }
  }

  // Enhanced admin session middleware
  enhanceAdminSession(req: any, res: Response, next: Function): void {
    if (req.session && req.session.authenticated) {
      // Track session activity
      if (req.sessionID) {
        this.updateActivity(req.sessionID);
        
        // Add admin-specific session values
        if (!req.session.adminLevel) {
          req.session.adminLevel = 'full'; // full, limited, read-only
          req.session.permissions = [
            'blog.create',
            'blog.edit', 
            'blog.delete',
            'media.upload',
            'analytics.view',
            'backup.create',
            'users.view'
          ];
          req.session.loginTimestamp = new Date().toISOString();
        }

        // Update last seen
        req.session.lastSeen = new Date().toISOString();
        
        // Track admin actions
        if (req.method !== 'GET') {
          console.log(`🔧 Admin action: ${req.session.user?.username || 'admin'} ${req.method} ${req.path}`);
        }
      }
    }
    next();
  }

  // API endpoint for admin session status
  async getAdminSessionStatus(req: Request, res: Response): Promise<void> {
    try {
      const activeSessions = this.getActiveSessions();
      const dbSessions = await this.getSessionsFromDatabase();
      
      const sessionData = {
        activeSessions: activeSessions.length,
        sessions: activeSessions.map(s => ({
          id: s.sessionId.slice(0, 8) + '...',
          username: s.username,
          loginTime: s.loginTime,
          lastActivity: s.lastActivity,
          ipAddress: s.ipAddress,
          timeActive: Math.floor((new Date().getTime() - s.loginTime.getTime()) / 1000 / 60), // minutes
        })),
        databaseSessions: dbSessions.length
      };

      res.json(sessionData);
    } catch (error) {
      console.error('Error getting admin session status:', error);
      res.status(500).json({ error: 'Failed to get session status' });
    }
  }
}

// Singleton instance
export const adminSessionMonitor = AdminSessionMonitor.getInstance();