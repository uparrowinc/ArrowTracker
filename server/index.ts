import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./init-db";
import { seedDatabase } from "./seed-db";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('trust proxy', 1);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

  // Serve static site at /static-preview
  app.use("/static-preview", express.static("static-site"));
  
  // Serve static assets including RSS logo
  app.use("/static-site", express.static("static-site"));
  
  // Serve uai-logo.png from root
  app.get('/uai-logo.png', (req, res) => {
    res.sendFile(path.resolve('uai-logo.png'));
  });
  
  // Serve generated images
  app.use("/generated-images", express.static("generated-images"));
  
  // Serve attached assets (for user uploaded images and audio files)
  // CRITICAL: Must be BEFORE authentication middleware to serve audio files publicly
  app.use("/attached_assets", express.static("attached_assets", {
    setHeaders: (res, path) => {
      // Ensure proper MIME types for audio files
      if (path.endsWith('.mp3')) {
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Accept-Ranges', 'bytes');
      }
      if (path.endsWith('.wav')) {
        res.setHeader('Content-Type', 'audio/wav');
        res.setHeader('Accept-Ranges', 'bytes');
      }
      if (path.endsWith('.mp4')) {
        res.setHeader('Content-Type', 'audio/mp4');
        res.setHeader('Accept-Ranges', 'bytes');
      }
      
      // CACHE-BUSTING: Force no-cache for audio files to fix mobile spinning issues
      if (path.endsWith('.mp3') || path.endsWith('.wav') || path.endsWith('.mp4') || path.endsWith('.mp4a')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
      
      // Add CORS headers for cross-origin audio requests
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Range, Accept-Encoding');
    }
  }));

// Export createApp function for testing
export async function createApp() {
  const server = await registerRoutes(app);
  
  // Serve clean static version
  app.get('/clean-static', (req, res) => {
    res.sendFile(path.join(__dirname, '../static-site/clean.html'));
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else if (process.env.NODE_ENV !== "test") {
    serveStatic(app);
  }

  return server;
}

// Initialize backup system on startup
async function initializeServices() {
  try {
    // Import and start backup scheduler
    const { backupScheduler } = await import("./backup-scheduler");
    backupScheduler.startScheduledBackups();
    
    // Import and start post scheduler (already exists)
    const { postScheduler } = await import("./post-scheduler");
    
    // Import and start SEO scheduler
    const { seoScheduler } = await import("./seo-scheduler");
    seoScheduler.start();
    
    console.log('✅ All services initialized successfully');
  } catch (error) {
    console.error('❌ Service initialization failed:', error);
  }
}

// Start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  (async () => {
    // Auto-create all tables on startup (idempotent — safe every run)
    initializeDatabase();
    // Seed initial data if database is empty
    seedDatabase();
    const server = await createApp();
    
    // Use Railway's injected PORT env var, fallback to 3000
    const port = parseInt(process.env.PORT || "3000", 10);
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, async () => {
      log(`serving on port ${port}`);
      await initializeServices();
    });
  })();
}

export default app;
