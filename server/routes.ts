import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import path from "path";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { BlogStorage } from "./blog-storage";
import { contactFormSchema } from "@shared/schema";
import { rssService } from "./rss";
import { sitemapService } from "./sitemap";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { sendContactNotification } from "./email-service";
import session from 'express-session';
import SqliteStore from 'better-sqlite3-session-store';
import Database from 'better-sqlite3';
import { dataExporter } from "./data-export";
import { backupScheduler } from "./backup-scheduler";
import { backupRouter } from "./backup-api";
import { backupSystem } from "./backup-system";
import { adminSessionMonitor } from "./admin-session-monitor";
import { registerMemberRoutes } from "./member-routes";
import { simpleCategoryService } from "./simple-category-service";
import { db } from "./db";
import { sql } from "drizzle-orm";

// Session types handled in security.ts

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === 'production' ? undefined : 'KlopperX10');
const SESSION_SECRET: string = process.env.SESSION_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'dev-session-secret-change-in-production');

if (!ADMIN_PASSWORD) {
  console.error('❌ ADMIN_PASSWORD environment variable is required in production');
  process.exit(1);
}
if (!SESSION_SECRET) {
  console.error('❌ SESSION_SECRET environment variable is required in production');
  process.exit(1);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize blog storage
  const blogStorage = new BlogStorage();
  
  // Setup SQLite session storage
  const SqliteSessionStore = SqliteStore(session);
  const sessionDb = new Database('./sessions.db');
  const sessionStore = new SqliteSessionStore({
    client: sessionDb,
    expired: {
      clear: true,
      intervalMs: 900000 // 15 minutes
    }
  });
  console.log('✅ Using SQLite for session storage');

  app.use(session({
    store: sessionStore,
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset expiry on activity
    cookie: {
      secure: false, // Set to false for Replit deployment compatibility
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for better persistence
      sameSite: 'lax' // Better compatibility for deployed environments
    }
  }));

  // Import and setup security middleware AFTER session
  const { setupSecurity, blogPostValidation, emailValidation, handleValidationErrors, strictRateLimit, secureBlogContentProcessing, safeUserDisplay } = await import("./security");
  setupSecurity(app);
  
  // Initialize advanced security systems in production only (DISABLED FOR DEPLOYMENT COMPATIBILITY)
  if (false && process.env.NODE_ENV === 'production') {
    const { advancedSecurityMiddleware, initializeSecurityTables } = await import("./advanced-security");
    await initializeSecurityTables();
    app.use(advancedSecurityMiddleware());
    console.log('✅ Advanced security enabled for production');
  } else {
    console.log('⚠️ Advanced security disabled for deployment compatibility');
  }
  
  // Member portal routes (before authentication requirements)
  registerMemberRoutes(app);
  
  // Add admin session monitoring middleware
  app.use((req, res, next) => {
    adminSessionMonitor.enhanceAdminSession(req, res, next);
  });
  
  // CSRF token endpoint for frontend
  app.get('/api/csrf-token', (req: Request, res: Response) => {
    res.json({ token: res.locals.csrfToken });
  });

  // Authentication middleware using session
  const isAuthenticated = (req: any, res: Response, next: NextFunction) => {
    if (req.session && req.session.authenticated) {
      return next();
    }
    return res.status(401).json({ message: 'Authentication required' });
  };

  // Blog admin authentication middleware
  const isBlogAdminAuthenticated = (req: any, res: Response, next: NextFunction) => {
    if (req.session && req.session.blogAdminAuthenticated) {
      return next();
    }
    return res.status(401).json({ message: 'Blog admin authentication required' });
  };

  // Blog admin session check endpoint
  app.get('/api/blog/admin/session', (req: any, res: Response) => {
    if (req.session && req.session.blogAdminAuthenticated) {
      res.json({ 
        authenticated: true, 
        user: req.session.blogAdminUser || { username: 'admin', role: 'blog-admin' }
      });
    } else {
      res.status(401).json({ authenticated: false });
    }
  });
  
  // Media streaming routes
  const { mediaStreamingService } = await import("./media-streaming");
  
  // Protected video streaming
  app.get('/api/media/video/stream', isAuthenticated, (req: Request, res: Response) => {
    mediaStreamingService.streamVideo(req, res);
  });
  
  // Protected audio streaming  
  app.get('/api/media/audio/stream', isAuthenticated, (req: Request, res: Response) => {
    mediaStreamingService.streamAudio(req, res);
  });
  
  // Configure multer for media uploads
  const multer = (await import('multer')).default;
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
  });

  // MOVE session middleware to AFTER CORS and security setup but BEFORE routes
  
  // Media upload endpoint
  app.post('/api/media/upload', isAuthenticated, strictRateLimit, upload.single('media'), (req: Request, res: Response) => {
    mediaStreamingService.uploadMedia(req, res);
  });
  
  // List media files
  app.get('/api/media', isAuthenticated, (req: Request, res: Response) => {
    mediaStreamingService.listMedia(req, res);
  });
  
  // Delete media
  app.delete('/api/media/:type/:filename', isAuthenticated, strictRateLimit, (req: Request, res: Response) => {
    mediaStreamingService.deleteMedia(req, res);
  });

  // Duplicate session middleware removed - already set up above

  // REMOVED: Front-door password authentication for public access

  // ColdFusion file routes - BEFORE static middleware to override MIME types
  app.get('/ColdFusion/:filename.cfm', (req, res) => {
    const filename = String(req.params.filename);
    
    // For index.cfm, serve the working HTML version
    if (filename === 'index') {
      const htmlPath = path.join(process.cwd(), 'ColdFusion', 'index-working.html');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.sendFile(htmlPath, (err) => {
        if (err) {
          // Fallback to original .cfm file
          const cfmPath = path.join(process.cwd(), 'ColdFusion', `${filename}.cfm`);
          res.sendFile(cfmPath);
        }
      });
    } else {
      // For other .cfm files, serve as-is
      const cfmPath = path.join(process.cwd(), 'ColdFusion', `${filename}.cfm`);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.sendFile(cfmPath, (err) => {
        if (err) {
          res.status(404).send('ColdFusion file not found');
        }
      });
    }
  });
  
  // ColdFusion static file serving for other assets (CSS, JS, images)
  app.use('/ColdFusion', express.static(path.join(process.cwd(), 'ColdFusion')));
  
  // REMOVED: Front-door authentication for public access and Google Cloud compatibility

  // Health check endpoint for Google Cloud
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Login routes
  app.get('/login', (req: Request, res: Response) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>up arrow inc - login</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            overflow: hidden;
            position: relative;
          }
          
          body::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.08) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.08) 0%, transparent 50%),
                        radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.05) 0%, transparent 50%);
            animation: pulse 4s ease-in-out infinite alternate;
          }
          
          @keyframes pulse {
            0% { opacity: 0.5; }
            100% { opacity: 1; }
          }
          
          .login-container {
            background: rgba(15, 15, 15, 0.95);
            backdrop-filter: blur(20px);
            padding: 4rem 3rem;
            border: 1px solid rgba(255, 255, 255, 0.08);
            width: 100%;
            max-width: 420px;
            position: relative;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
          }
          
          .login-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
          }
          
          h1 {
            text-align: center;
            margin-bottom: 3rem;
            font-weight: 700;
            font-size: 2.5rem;
            letter-spacing: 3px;
            color: rgba(255, 255, 255, 0.95);
            text-transform: none;
            position: relative;
          }
          
          h1::after {
            content: '';
            position: absolute;
            bottom: -1rem;
            left: 50%;
            transform: translateX(-50%);
            width: 40px;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          }
          
          form {
            display: flex;
            flex-direction: column;
            gap: 2rem;
          }
          
          .input-group {
            position: relative;
          }
          
          input {
            width: 100%;
            padding: 1.5rem 1.5rem 1rem 1.5rem;
            border: 1px solid rgba(0, 0, 0, 0.08);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.9);
            color: #1a1a1a;
            font-size: 16px;
            font-weight: 300;
            letter-spacing: 0.5px;
            transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
            backdrop-filter: blur(10px);
          }
          
          input:focus {
            outline: none;
            border-color: rgba(120, 119, 198, 0.3);
            background: rgba(255, 255, 255, 1);
            box-shadow: 0 4px 20px rgba(120, 119, 198, 0.1);
            transform: translateY(-1px);
          }
          
          input::placeholder {
            color: rgba(0, 0, 0, 0.4);
            font-weight: 300;
            letter-spacing: 0.5px;
          }
          
          input:focus + .input-line::after {
            transform: scaleX(1);
          }
          
          .input-line {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 1px;
            overflow: hidden;
          }
          
          .input-line::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 1px;
            background: linear-gradient(90deg, rgba(120, 119, 198, 0.8), rgba(255, 119, 198, 0.8));
            transform: scaleX(0);
            transform-origin: left;
            transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
          }
          
          button {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            color: #ffffff;
            border: 1px solid rgba(255, 255, 255, 0.15);
            padding: 1.25rem 2rem;
            font-weight: 600;
            letter-spacing: 2px;
            cursor: pointer;
            text-transform: uppercase;
            font-size: 13px;
            margin-top: 1rem;
            position: relative;
            overflow: hidden;
            border-radius: 8px;
            transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
          }
          
          button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
            transition: left 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
          }
          
          button:hover {
            background: linear-gradient(135deg, #2d2d2d 0%, #404040 100%);
            border-color: rgba(255, 255, 255, 0.25);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.5);
          }
          
          button:hover::before {
            left: 100%;
          }
          
          button:active {
            transform: translateY(-1px);
            box-shadow: 0 4px 15px rgba(249, 115, 22, 0.6);
          }
          
          .error {
            color: rgba(255, 120, 120, 0.9);
            margin-bottom: 1rem;
            text-align: center;
            font-size: 14px;
            font-weight: 300;
            letter-spacing: 0.5px;
            animation: fadeIn 0.5s ease-out;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @media (max-width: 480px) {
            .login-container {
              padding: 3rem 2rem;
              margin: 1rem;
            }
            
            h1 {
              font-size: 2rem;
              letter-spacing: 2px;
            }
          }
        </style>
      </head>
      <body>
        <div class="login-container">
          <h1>up arrow inc</h1>
          ${req.query.error ? '<p class="error">Access denied. Please try again.</p>' : ''}
          <form action="/login" method="POST">
            <div class="input-group">
              <input type="password" name="password" placeholder="Enter Password" required autofocus>
              <div class="input-line"></div>
            </div>
            <button type="submit">Enter</button>
          </form>
        </div>
      </body>
      </html>
    `);
  });

  app.post('/login', (req: any, res: Response) => {
    const { password } = req.body;
    
    // Enhanced security: Check password and add rate limiting
    if (password === ADMIN_PASSWORD) {
      // Set session authentication
      req.session.authenticated = true;
      req.session.user = { username: 'admin' };
      
      // Track admin login
      adminSessionMonitor.trackAdminLogin(req.sessionID, 'admin', req);
      
      return res.redirect('/');
    }
    
    // Log failed login attempt
    console.log(`🚨 Failed web login attempt: IP=${req.ip}, User-Agent=${req.headers['user-agent']}`);
    
    // Redirect back to login with error
    return res.redirect('/login?error=1');
  });

  // API login endpoint for main site access - NO SECURITY MIDDLEWARE
  app.post('/api/login', (req: any, res: Response) => {
    try {
      const { username, password } = req.body;
      
      // Validate request body
      if (!username || !password) {
        console.error('❌ Missing username or password in request body');
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      // Check both username and password for security
      if (username === 'admin' && password === ADMIN_PASSWORD) {
        // Initialize session if needed (production compatibility)
        if (!req.session) {
          console.error('❌ Session not available - initializing for production');
          // Continue without session for production environments
        }
        
        // Set session authentication (with production fallback)
        if (req.session) {
          req.session.authenticated = true;
          req.session.user = { username: 'admin' };
          // Also set blog admin authentication for single sign-on
          req.session.blogAdminAuthenticated = true;
          req.session.blogAdminUser = { username: 'admin' };
        }
        
        // Track admin login (with error handling)
        try {
          if (adminSessionMonitor && req.sessionID) {
            adminSessionMonitor.trackAdminLogin(req.sessionID, 'admin', req);
          }
        } catch (trackError) {
          console.warn('⚠️ Admin tracking failed:', trackError);
          // Continue with login - tracking failure shouldn't break login
        }
        
        // Save session with production fallback
        const completeLogin = () => {
          console.log('🔐 Admin logged in: admin from ' + (req.ip || 'unknown'));
          return res.status(200).json({ 
            message: 'Login successful', 
            authenticated: true,
            user: { username: 'admin' }
          });
        };
        
        if (req.session && typeof req.session.save === 'function') {
          req.session.save((err: any) => {
            if (err) {
              console.error('❌ Session save error:', err);
              // Continue anyway for production compatibility
              console.log('⚠️ Proceeding with login despite session save error');
            }
            return completeLogin();
          });
        } else {
          // Direct response for production environments with session issues
          return completeLogin();
        }
      } else {
        // Log failed login attempt
        console.log(`🚨 Failed login attempt: username="${username}", IP=${req.ip}, User-Agent=${req.headers['user-agent']}`);
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    } catch (error: any) {
      console.error('❌ Login endpoint error:', error);
      return res.status(500).json({ 
        message: 'Login system error', 
        error: process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error',
        environment: process.env.NODE_ENV
      });
    }
  });

  // Separate blog admin login endpoint
  app.post('/api/blog/admin/login', (req: any, res: Response) => {
    const { username, password } = req.body;
    
    // Check blog admin credentials
    if (username === 'admin' && password === ADMIN_PASSWORD) {
      // Set blog admin session
      req.session.blogAdminAuthenticated = true;
      req.session.blogAdminUser = { username: 'admin' };
      
      // Track admin login
      adminSessionMonitor.trackAdminLogin(req.sessionID, 'blog-admin', req);
      
      // Save session explicitly
      req.session.save((err: any) => {
        if (err) {
          console.error('Blog admin session save error:', err);
          return res.status(500).json({ message: 'Session save failed' });
        }
        return res.status(200).json({ 
          message: 'Blog admin login successful', 
          authenticated: true,
          user: { username: 'admin', role: 'blog-admin' }
        });
      });
    } else {
      // Log failed login attempt
      console.log(`🚨 Failed blog admin login: username="${username}", IP=${req.ip}, User-Agent=${req.headers['user-agent']}`);
      return res.status(401).json({ message: 'Invalid blog admin credentials' });
    }
  });

  // Security monitoring endpoints (disabled - advanced security not active with SQLite)
  app.get('/api/security/events', isAuthenticated, async (req: Request, res: Response) => {
    // Return empty array since advanced security is disabled
    res.json([]);
  });

  app.get('/api/security/stats', isAuthenticated, async (req: Request, res: Response) => {
    // Return zero stats since advanced security is disabled
    res.json({
      totalEvents: 0,
      blockedAttacks: 0,
      suspiciousIPs: 0,
      honeypotTriggers: 0,
      rateLimitHits: 0
    });
  });

  // API logout endpoint
  app.post('/api/logout', (req: any, res: Response) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.clearCookie('connect.sid');
      return res.status(200).json({ message: 'Logout successful' });
    });
  });

  // Session status endpoint
  app.get('/api/session', (req: any, res: Response) => {
    if (req.session && req.session.authenticated && req.session.user?.username === 'admin') {
      return res.status(200).json({ 
        authenticated: true, 
        user: { username: 'admin' }
      });
    } else {
      return res.status(401).json({ authenticated: false });
    }
  });

  // Serve static site without authentication
  app.use('/static-site', express.static('static-site'));
  
  // Serve favicon.ico at root for RSS readers (NetNewsWire requirement)
  app.get('/favicon.ico', (req: Request, res: Response) => {
    res.sendFile(path.join(process.cwd(), 'favicon.ico'), {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
      }
    });
  });
  
  // Route for clean static version
  app.get('/static-preview', (req: Request, res: Response) => {
    res.redirect('/static-site/clean.html');
  });
  // API Routes - All prefixed with /api
  app.get("/api/services", async (req: Request, res: Response) => {
    try {
      const services = await storage.getAllServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Error fetching services" });
    }
  });

  app.get("/api/testimonials", async (req: Request, res: Response) => {
    try {
      const testimonials = await storage.getAllTestimonials();
      res.json(testimonials);
    } catch (error) {
      res.status(500).json({ message: "Error fetching testimonials" });
    }
  });

  app.get("/api/team-members", async (req: Request, res: Response) => {
    try {
      const teamMembers = await storage.getAllTeamMembers();
      res.json(teamMembers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching team members" });
    }
  });

  app.post("/api/contact", strictRateLimit, async (req: Request, res: Response) => {
    try {
      // Validate the form data
      const formData = contactFormSchema.parse(req.body);
      
      // Capture client IP address (handles proxies)
      const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
                        req.socket.remoteAddress || 
                        'unknown';
      
      // Store the contact form submission in database with IP
      const submission = await storage.createContactSubmission(formData, ipAddress);
      
      // Send email notification (non-blocking - API returns success even if email fails)
      const notificationEmail = process.env.CONTACT_NOTIFICATION_EMAIL || 'contact@uparrowinc.com';
      sendContactNotification(formData, notificationEmail)
        .then(emailSent => {
          storage.updateContactSubmissionEmailStatus(submission.id, emailSent);
        })
        .catch(err => {
          console.error('Email notification failed:', err);
        });
      
      res.status(200).json({ message: "Message sent successfully" });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ 
          message: "Validation error", 
          errors: validationError.details
        });
      } else {
        res.status(500).json({ message: "Error processing your request" });
      }
    }
  });

  // Data Export API Routes
  app.get("/api/export/json", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const filePath = await dataExporter.exportToJSON();
      res.download(filePath, `database-export-${new Date().toISOString().split('T')[0]}.json`);
    } catch (error: any) {
      res.status(500).json({ message: "Export failed", error: error.message });
    }
  });

  app.get("/api/export/csv", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const files = await dataExporter.exportToCSV();
      // For multiple CSV files, we'll zip them (you might want to add a zip library)
      res.json({ 
        message: "CSV export completed", 
        files: files.map(f => f.replace(process.cwd(), ''))
      });
    } catch (error: any) {
      res.status(500).json({ message: "CSV export failed", error: error.message });
    }
  });

  app.get("/api/export/sql", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const filePath = await dataExporter.exportToSQL();
      res.download(filePath, `database-dump-${new Date().toISOString().split('T')[0]}.sql`);
    } catch (error: any) {
      res.status(500).json({ message: "SQL export failed", error: error.message });
    }
  });

  // Manual backup trigger
  app.post("/api/backup/manual", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const manifest = await backupSystem.createFullBackup();
      res.json({ message: "Manual backup completed", manifest });
    } catch (error: any) {
      res.status(500).json({ message: "Manual backup failed", error: error.message });
    }
  });

  // Database status and statistics
  app.get("/api/database/status", async (req: Request, res: Response) => {
    try {
      res.json({
        status: "connected",
        timestamp: new Date().toISOString(),
        storage: "in-memory"
      });
    } catch (error: any) {
      res.status(500).json({ message: "Database status check failed", error: error.message });
    }
  });

  // RSS feed endpoints (public)
  app.get('/api/rss', (req: Request, res: Response) => {
    rssService.generateRSSFeed(req, res);
  });

  // Standard RSS feed route that many readers expect
  app.get("/rss.xml", (req: Request, res: Response) => {
    rssService.generateRSSFeed(req, res);
  });

  // Alternative feed routes for compatibility
  // RSS feed routes - multiple common endpoints
  app.get("/rss", (req: Request, res: Response) => {
    rssService.generateRSSFeed(req, res);
  });

  app.get("/feed", (req: Request, res: Response) => {
    rssService.generateRSSFeed(req, res);
  });

  app.get("/feed.xml", (req: Request, res: Response) => {
    rssService.generateRSSFeed(req, res);
  });
  
  app.get('/api/rss/metadata', (req: Request, res: Response) => {
    rssService.getRSSMetadata(req, res);
  });

  // SEO scheduler endpoints (blog admin only)
  app.post('/api/admin/seo/sitemap-regen', isBlogAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const { seoScheduler } = await import("./seo-scheduler");
      await seoScheduler.manualSitemapRegen();
      res.json({ message: "Sitemap regenerated successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Sitemap regeneration failed", error: error.message });
    }
  });

  app.post('/api/admin/seo/rss-warm', isBlogAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const { seoScheduler } = await import("./seo-scheduler");
      await seoScheduler.manualRSSWarm();
      res.json({ message: "RSS cache warmed successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "RSS cache warming failed", error: error.message });
    }
  });

  app.post('/api/admin/seo/health-check', isBlogAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const { seoScheduler } = await import("./seo-scheduler");
      await seoScheduler.manualSEOCheck();
      res.json({ message: "SEO health check completed successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "SEO health check failed", error: error.message });
    }
  });

  // Robots.txt endpoint (public)
  app.get('/robots.txt', (req: Request, res: Response) => {
    const robotsTxt = `# Robots.txt for ai.uparrowinc.com
# Allow all search engines to crawl the site

User-agent: *
Allow: /

# Sitemap location
Sitemap: https://ai.uparrowinc.com/sitemap.xml

# RSS Feed locations
Sitemap: https://ai.uparrowinc.com/api/rss
Sitemap: https://ai.uparrowinc.com/feed

# Allow major search engines full access
User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Crawl-delay: 1

User-agent: Slurp
Allow: /
Crawl-delay: 1

User-agent: DuckDuckBot
Allow: /
Crawl-delay: 1

# Block bad bots
User-agent: AhrefsBot
Disallow: /

User-agent: SemrushBot
Disallow: /

User-agent: MJ12bot
Disallow: /

User-agent: DotBot
Disallow: /

# Prevent crawling of admin areas
User-agent: *
Disallow: /admin
Disallow: /api/admin
Disallow: /api/auth
Disallow: /api/backup
Disallow: /login

# Prevent crawling of development/test files
User-agent: *
Disallow: /*.test.js
Disallow: /*.spec.js
Disallow: /test/
Disallow: /tests/
`;
    
    res.set('Content-Type', 'text/plain');
    res.send(robotsTxt);
  });

  // Sitemap endpoints (public)
  app.get('/sitemap.xml', (req: Request, res: Response) => {
    sitemapService.serveSitemap(req, res);
  });
  
  app.get('/api/sitemap/stats', (req: Request, res: Response) => {
    sitemapService.getSitemapStats(req, res);
  });
  
  app.post('/api/sitemap/generate', isAuthenticated, (req: Request, res: Response) => {
    sitemapService.generateSitemap(req, res);
  });

  // Blog Categories API
  app.get("/api/blog/categories", async (req: Request, res: Response) => {
    try {
      // Get predefined categories from simple category service
      const predefinedCategories = simpleCategoryService.getAllCategories();
      const posts = await blogStorage.getAllPosts();
      const publishedPosts = posts.filter(post => post.published);
      
      // Calculate post counts for each category
      const categoriesWithStats = predefinedCategories.map(category => {
        const categoryPosts = publishedPosts.filter(post => post.category === category.slug);
        
        // Get post counts for predefined subcategories
        const subcategoriesWithStats = category.subcategories.map(subcategory => {
          const subPosts = categoryPosts.filter(post => post.subcategory === subcategory.slug);
          return {
            ...subcategory,
            postCount: subPosts.length
          };
        });
        
        return {
          ...category,
          postCount: categoryPosts.length,
          subcategories: subcategoriesWithStats
        };
      });
      
      res.json(categoriesWithStats);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: "Error fetching categories" });
    }
  });

  // Update categories (authenticated endpoint)
  app.put("/api/blog/categories", isBlogAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const categoryData = req.body;
      const result = await simpleCategoryService.updateCategory(categoryData);
      res.json(result);
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ message: "Error updating category" });
    }
  });

  // Create new category (authenticated endpoint)
  app.post("/api/blog/categories", isBlogAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const categoryData = req.body;
      const result = await simpleCategoryService.createCategory(categoryData);
      res.json(result);
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({ message: "Error creating category" });
    }
  });

  // Blog API Routes
  app.get("/api/blog/posts", async (req: Request, res: Response) => {
    try {
      const published = req.query.published === 'false' ? false : true; // Default to published only
      const category = req.query.category as string;
      const subcategory = req.query.subcategory as string;
      
      let posts = await blogStorage.getAllPosts();
      
      // Apply published filter
      if (published) {
        posts = posts.filter(post => post.published);
      }
      
      // Filter by category/subcategory using database fields
      if (category || subcategory) {
        posts = posts.filter(post => {
          if (subcategory) {
            return post.subcategory === subcategory;
          }
          if (category) {
            return post.category === category;
          }
          return false;
        });
      }
      
      res.json(posts);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      res.status(500).json({ message: "Error fetching blog posts" });
    }
  });

  app.get("/api/blog/posts/:slug", async (req: Request, res: Response) => {
    try {
      const post = await blogStorage.getPostBySlug(String(req.params.slug));
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error('Error fetching blog post by slug:', error);
      res.status(500).json({ message: "Error fetching blog post" });
    }
  });

  app.post("/api/blog/posts", isBlogAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      // Triple-layer security for blog content:
      // Layer 1: HTML encoding (encodeForHTML) - makes attacks harmless
      // Layer 2: Attack pattern blocking
      // Layer 3: Script removal
      if (req.body.content) {
        req.body.content = secureBlogContentProcessing(req.body.content);
      }
      if (req.body.title) {
        req.body.title = safeUserDisplay(req.body.title, 200);
      }
      if (req.body.excerpt) {
        req.body.excerpt = safeUserDisplay(req.body.excerpt, 500);
      }
      
      const post = await blogStorage.createPost(req.body);
      
      // Update sitemap if post is published
      if (post.published) {
        sitemapService.updateSitemapForNewPost().catch(err => 
          console.error('Failed to update sitemap after post creation:', err)
        );
      }
      
      res.status(201).json(post);
    } catch (error) {
      console.error('Blog post creation error:', error);
      res.status(500).json({ message: "Error creating blog post", details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.put("/api/blog/posts/:id", isBlogAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      
      // Decode HTML entities in featuredImage URL
      if (req.body.featuredImage) {
        req.body.featuredImage = req.body.featuredImage
          .replace(/&#x2F;/g, '/')
          .replace(/&#x([0-9A-Fa-f]+);/g, (match: string, hex: string) => 
            String.fromCharCode(parseInt(hex, 16))
          )
          .replace(/&#(\d+);/g, (match: string, dec: string) => 
            String.fromCharCode(parseInt(dec, 10))
          );
      }
      
      // Triple-layer security for blog content updates:
      // Layer 1: HTML encoding (encodeForHTML) - makes attacks harmless  
      // Layer 2: Attack pattern blocking
      // Layer 3: Script removal
      if (req.body.content) {
        req.body.content = secureBlogContentProcessing(req.body.content);
      }
      if (req.body.title) {
        req.body.title = safeUserDisplay(req.body.title, 200);
      }
      if (req.body.excerpt) {
        req.body.excerpt = safeUserDisplay(req.body.excerpt, 500);
      }
      
      const post = await blogStorage.updatePost(id, req.body);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Update sitemap if post is published
      if (post.published) {
        sitemapService.updateSitemapForNewPost().catch(err => 
          console.error('Failed to update sitemap after post update:', err)
        );
      }
      
      res.json(post);
    } catch (error) {
      console.error('Blog post update error:', error);
      res.status(500).json({ message: "Error updating blog post", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.delete("/api/blog/posts/:id", isBlogAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const deleted = await blogStorage.deletePost(id);
      if (!deleted) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting blog post" });
    }
  });

  app.get("/api/blog/search", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 3) {
        return res.json([]);
      }
      
      console.log(`🔍 Search query: "${query}"`);
      const posts = await blogStorage.searchPosts(query);
      console.log(`🔍 Search results: ${posts.length} posts found`);
      res.json(posts);
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ message: "Error searching blog posts", error: String(error) });
    }
  });

  // Email subscriber routes
  app.post("/api/blog/subscribe", async (req: Request, res: Response) => {
    try {
      const subscriber = await storage.addEmailSubscriber(req.body);
      res.status(201).json(subscriber);
    } catch (error) {
      res.status(500).json({ message: "Error subscribing to newsletter" });
    }
  });

  app.get("/api/blog/subscribers", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const subscribers = await storage.getAllEmailSubscribers();
      res.json(subscribers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching subscribers" });
    }
  });

  // Newsletter sending route (requires SendGrid integration)
  app.post("/api/blog/newsletter/:postId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const postId = parseInt(String(req.params.postId));
      const post = await storage.getBlogPost(postId.toString());
      const subscribers = await storage.getAllEmailSubscribers();
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Note: SendGrid integration would go here
      // For now, just return success
      res.json({ 
        message: `Newsletter would be sent to ${subscribers.length} subscribers`,
        post: post.title 
      });
    } catch (error) {
      res.status(500).json({ message: "Error sending newsletter" });
    }
  });

  // Media upload routes
  app.post("/api/blog/media", async (req: Request, res: Response) => {
    try {
      const media = await storage.uploadMedia(req.body);
      res.status(201).json(media);
    } catch (error) {
      res.status(500).json({ message: "Error uploading media" });
    }
  });

  app.get("/api/blog/media", async (req: Request, res: Response) => {
    try {
      const media = await storage.getAllMedia();
      res.json(media);
    } catch (error) {
      res.status(500).json({ message: "Error fetching media" });
    }
  });

  // Backup system routes
  app.use('/api/backup', backupRouter);

  // Image generation routes (QR codes, blog images, social images, logo, AI images)
  const imageRouter = await import('./image-api');
  app.use('/api/images', imageRouter.default);

  // Bulk import endpoints
  app.post("/api/blog/bulk-import", isBlogAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const { bulkImportService } = await import('./bulk-import');
      const posts = req.body.posts;
      
      if (!Array.isArray(posts)) {
        return res.status(400).json({ message: "Posts must be an array" });
      }
      
      const result = await bulkImportService.importPosts(posts);
      res.json(result);
    } catch (error) {
      console.error('Bulk import error:', error);
      res.status(500).json({ message: "Error importing posts" });
    }
  });

  app.get("/api/blog/sample-posts/:count", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const count = parseInt(String(req.params.count)) || 10;
      const { bulkImportService } = await import('./bulk-import');
      const samplePosts = bulkImportService.generateSamplePosts(count);
      res.json(samplePosts);
    } catch (error) {
      console.error('Sample posts error:', error);
      res.status(500).json({ message: "Error generating sample posts" });
    }
  });

  // Scheduling endpoints
  app.get("/api/blog/scheduled", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { postScheduler } = await import('./post-scheduler');
      const scheduledPosts = await postScheduler.getScheduledPosts();
      res.json(scheduledPosts);
    } catch (error) {
      console.error('Scheduled posts error:', error);
      res.status(500).json({ message: "Error fetching scheduled posts" });
    }
  });

  app.post("/api/blog/schedule/:id", isBlogAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const { scheduledFor } = req.body;
      
      if (!scheduledFor) {
        return res.status(400).json({ message: "scheduledFor date is required" });
      }
      
      const { postScheduler } = await import('./post-scheduler');
      const post = await postScheduler.reschedulePost(id, new Date(scheduledFor));
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      res.json(post);
    } catch (error) {
      console.error('Schedule post error:', error);
      res.status(500).json({ message: "Error scheduling post" });
    }
  });

  app.delete("/api/blog/schedule/:id", isBlogAdminAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const { postScheduler } = await import('./post-scheduler');
      const post = await postScheduler.cancelScheduledPost(id);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      res.json({ message: "Schedule cancelled", post });
    } catch (error) {
      console.error('Cancel schedule error:', error);
      res.status(500).json({ message: "Error cancelling schedule" });
    }
  });

  app.get("/api/blog/stats", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { postScheduler } = await import('./post-scheduler');
      const stats = await postScheduler.getSchedulingStats();
      res.json(stats);
    } catch (error) {
      console.error('Blog stats error:', error);
      res.status(500).json({ message: "Error fetching blog stats" });
    }
  });

  // Admin session monitoring API endpoint
  app.get('/api/admin/sessions', isAuthenticated, async (req: Request, res: Response) => {
    await adminSessionMonitor.getAdminSessionStatus(req, res);
  });

  // ColdFusion static files already served above before authentication
  
  // Legacy ColdFusion URL redirects for SEO preservation
  app.get('/ecommerce/pci-compliance.cfm', (req, res) => {
    res.redirect(301, '/blog/post/pci-compliance-for-e-commerce-complete-security-guide-2025');
  });
  
  app.get('/ecommerce/ssl-certificates.cfm', (req, res) => {
    res.redirect(301, '/blog/post/ssl-certificates-secure-transactions');
  });
  
  app.get('/ecommerce/payment-gateway-security.cfm', (req, res) => {
    res.redirect(301, '/blog/post/payment-gateway-security-best-practices');
  });
  
  app.get('/consulting/digital-transformation.cfm', (req, res) => {
    res.redirect(301, '/blog/post/digital-transformation-consulting');
  });
  
  app.get('/consulting/cloud-migration.cfm', (req, res) => {
    res.redirect(301, '/blog/post/cloud-migration-strategies-2025');
  });
  
  app.get('/development/custom-web-applications.cfm', (req, res) => {
    res.redirect(301, '/blog/post/custom-web-application-development');
  });

  const httpServer = createServer(app);
  
  // Start the post scheduler
  const { postScheduler } = await import('./post-scheduler');
  postScheduler.start();
  
  return httpServer;
}
