/**
 * ADVANCED SECURITY MODULE
 * Enterprise-grade security with WAF, IDS, IP reputation, and honeypot capabilities
 */

import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { db, sqliteDb } from './db';
import { sql } from 'drizzle-orm';

// Security events logging
interface SecurityEvent {
  timestamp: Date;
  ip: string;
  userAgent: string;
  eventType: 'ATTACK_ATTEMPT' | 'SUSPICIOUS_ACTIVITY' | 'RATE_LIMIT_HIT' | 'HONEYPOT_TRIGGER' | 'MALICIOUS_PAYLOAD';
  details: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  blocked: boolean;
}

// IP reputation cache (in production, this would use Redis or external service)
const ipReputationCache = new Map<string, { reputation: number; lastChecked: Date; blocked: boolean }>();
const suspiciousIPs = new Set<string>();
const blockedIPs = new Set<string>();

// Known malicious patterns (WAF-like functionality)
const ATTACK_PATTERNS = {
  SQL_INJECTION: [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec)\b.*\b(from|where|into|values)\b)/i,
    /(--|\/\*|\*\/|;|'|"|`)/g,
    /(\boptions\s*\(\s*@@version\s*\))/i,
    /(\bor\s+1\s*=\s*1)/i,
    /(\bunion\s+(all\s+)?select)/i
  ],
  XSS_INJECTION: [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>/gi,
    /vbscript:/gi,
    /data:\s*text\/html/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi
  ],
  COMMAND_INJECTION: [
    /(\||&|;|`|\$\(|\$\{)/g,
    /\b(wget|curl|nc|netcat|cat|ls|ps|id|whoami|uname)\b/gi,
    /\.\.\//g,
    /\/etc\/passwd/gi,
    /\/bin\/(bash|sh|csh|zsh)/gi
  ],
  PATH_TRAVERSAL: [
    /\.\.\//g,
    /\.\.\\/g,
    /\/etc\//gi,
    /\/proc\//gi,
    /\/var\//gi,
    /\/usr\//gi,
    /\/tmp\//gi
  ],
  NOSQL_INJECTION: [
    /\$where/gi,
    /\$ne/gi,
    /\$gt/gi,
    /\$lt/gi,
    /\$regex/gi,
    /\$or/gi,
    /\$and/gi
  ]
};

// Suspicious user agents (bot detection)
const SUSPICIOUS_USER_AGENTS = [
  /sqlmap/i,
  /nikto/i,
  /nessus/i,
  /burp/i,
  /acunetix/i,
  /qualys/i,
  /rapid7/i,
  /metasploit/i,
  /nmap/i,
  /masscan/i,
  /gobuster/i,
  /dirb/i,
  /dirbuster/i,
  /wpscan/i,
  /havij/i,
  /pangolin/i,
  /python-requests/i,
  /curl/i,
  /wget/i
];

// Log security events (in production, send to SIEM)
async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  try {
    console.log(`🚨 SECURITY EVENT [${event.severity}]: ${event.eventType} from ${event.ip}`);
    console.log(`📋 Details: ${event.details}`);
    console.log(`🛡️ Blocked: ${event.blocked}`);
    
    // In production, you would send this to a security information and event management (SIEM) system
    // await sendToSIEM(event);
    
    // Store in database for analysis
    try {
      sqliteDb.prepare(`
        INSERT OR IGNORE INTO security_events (timestamp, ip, user_agent, event_type, details, severity, blocked)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(event.timestamp.toISOString(), event.ip, event.userAgent, event.eventType, event.details, event.severity, event.blocked ? 1 : 0);
    } catch { /* table may not exist */ }
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

// IP Reputation Service (simulated - in production use real threat intelligence feeds)
class IPReputationService {
  static async checkReputation(ip: string): Promise<{ reputation: number; blocked: boolean; reason?: string }> {
    // Skip localhost and private IPs
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
      return { reputation: 100, blocked: false };
    }

    // Check cache first
    const cached = ipReputationCache.get(ip);
    if (cached && (Date.now() - cached.lastChecked.getTime()) < 3600000) { // 1 hour cache
      return { reputation: cached.reputation, blocked: cached.blocked };
    }

    // Simulate reputation check (in production, use services like VirusTotal, AbuseIPDB, etc.)
    let reputation = 50; // Neutral reputation
    let blocked = false;
    let reason = '';

    // Check against known bad patterns
    if (suspiciousIPs.has(ip)) {
      reputation = 20;
      reason = 'Previously flagged for suspicious activity';
    }

    if (blockedIPs.has(ip)) {
      reputation = 0;
      blocked = true;
      reason = 'IP in block list';
    }

    // Simulate checking against threat intelligence feeds
    // In production, integrate with:
    // - VirusTotal API
    // - AbuseIPDB
    // - Spamhaus
    // - MaxMind GeoIP2
    // - AWS GuardDuty
    // - CloudFlare Threat Intelligence

    const result = { reputation, blocked, reason };
    ipReputationCache.set(ip, { 
      reputation, 
      blocked, 
      lastChecked: new Date() 
    });

    return result;
  }

  static markSuspicious(ip: string): void {
    suspiciousIPs.add(ip);
    ipReputationCache.delete(ip); // Force recheck
  }

  static blockIP(ip: string): void {
    blockedIPs.add(ip);
    ipReputationCache.delete(ip); // Force recheck
  }
}

// Web Application Firewall (WAF) functionality
export class WebApplicationFirewall {
  static detectAttack(input: string, inputType: string = 'general'): { isAttack: boolean; attackType?: string; confidence: number } {
    // Skip detection for legitimate browser headers and common patterns
    if (inputType === 'header') {
      // These are legitimate browser headers that contain SQL-like patterns
      const legitimatePatterns = [
        /^"[^"]*"$/, // Quoted browser identifiers like "Chromium";v="131"
        /v="\d+/, // Version identifiers
        /sec-ch-ua/, // Chrome security headers
        /text\/html,application\/xhtml\+xml/, // Accept headers
        /gzip, deflate/, // Encoding headers
        /Mozilla\/\d+\.\d+/, // User agent patterns
        /Chrome\/\d+/, // Chrome version patterns
        /Safari\/\d+/, // Safari version patterns
        /en-US,en;q=/, // Language preferences
      ];
      
      for (const pattern of legitimatePatterns) {
        if (pattern.test(input)) {
          return { isAttack: false, attackType: '', confidence: 0 };
        }
      }
    }

    let maxConfidence = 0;
    let detectedAttackType = '';

    for (const [attackType, patterns] of Object.entries(ATTACK_PATTERNS)) {
      for (const pattern of patterns) {
        const matches = input.match(pattern);
        if (matches) {
          let confidence = Math.min(100, matches.length * 25 + (input.length > 1000 ? 25 : 0));
          
          // Reduce confidence for headers since they often contain false positives
          if (inputType === 'header') {
            confidence = Math.max(0, confidence - 30);
          }
          
          if (confidence > maxConfidence) {
            maxConfidence = confidence;
            detectedAttackType = attackType;
          }
        }
      }
    }

    return {
      isAttack: maxConfidence >= 70, // Increased threshold to reduce false positives
      attackType: detectedAttackType,
      confidence: maxConfidence
    };
  }

  static async analyzeRequest(req: Request): Promise<{ threat: boolean; score: number; reasons: string[] }> {
    const reasons: string[] = [];
    let score = 0;

    // Check User-Agent
    const userAgent = req.headers['user-agent'] || '';
    for (const pattern of SUSPICIOUS_USER_AGENTS) {
      if (pattern.test(userAgent)) {
        score += 30;
        reasons.push(`Suspicious user agent: ${userAgent}`);
        break;
      }
    }

    // Check request body for attacks
    if (req.body) {
      const bodyStr = JSON.stringify(req.body);
      const attackAnalysis = this.detectAttack(bodyStr, 'body');
      if (attackAnalysis.isAttack) {
        score += attackAnalysis.confidence;
        reasons.push(`${attackAnalysis.attackType} attack detected in request body`);
      }
    }

    // Check URL for attacks
    const urlAnalysis = this.detectAttack(req.url, 'url');
    if (urlAnalysis.isAttack) {
      score += urlAnalysis.confidence;
      reasons.push(`${urlAnalysis.attackType} attack detected in URL`);
    }

    // Check headers for attacks (skip standard browser headers)
    const skipHeaders = new Set([
      'accept', 'accept-encoding', 'accept-language', 'user-agent', 
      'sec-ch-ua', 'sec-ch-ua-mobile', 'sec-ch-ua-platform', 'sec-fetch-dest',
      'sec-fetch-mode', 'sec-fetch-site', 'cache-control', 'pragma',
      'connection', 'host', 'referer', 'origin', 'content-type'
    ]);

    for (const [headerName, headerValue] of Object.entries(req.headers)) {
      if (typeof headerValue === 'string' && !skipHeaders.has(headerName.toLowerCase())) {
        const headerAnalysis = this.detectAttack(headerValue, 'header');
        if (headerAnalysis.isAttack) {
          score += headerAnalysis.confidence;
          reasons.push(`${headerAnalysis.attackType} attack detected in ${headerName} header`);
        }
      }
    }

    // Suspicious request patterns
    if (req.url.includes('..')) {
      score += 40;
      reasons.push('Path traversal attempt detected');
    }

    if (req.url.length > 2000) {
      score += 20;
      reasons.push('Abnormally long URL');
    }

    return {
      threat: score >= 80, // Increased threshold to reduce false positives
      score,
      reasons
    };
  }
}

// Intrusion Detection System (IDS) functionality
export class IntrusionDetectionSystem {
  private static requestCounts = new Map<string, { count: number; firstSeen: Date; lastSeen: Date }>();
  private static failedAttempts = new Map<string, { count: number; lastAttempt: Date }>();

  static analyzeTraffic(req: Request): { suspicious: boolean; reasons: string[] } {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const reasons: string[] = [];
    let suspicious = false;

    // Track request frequency
    const now = new Date();
    const existing = this.requestCounts.get(ip);
    
    if (existing) {
      existing.count++;
      existing.lastSeen = now;
      
      // More than 100 requests per minute is suspicious
      const timeDiff = now.getTime() - existing.firstSeen.getTime();
      if (timeDiff < 60000 && existing.count > 100) {
        suspicious = true;
        reasons.push('High request frequency detected');
      }
    } else {
      this.requestCounts.set(ip, { count: 1, firstSeen: now, lastSeen: now });
    }

    // Check for rapid-fire requests (potential bot)
    if (existing && (now.getTime() - existing.lastSeen.getTime()) < 100) {
      suspicious = true;
      reasons.push('Rapid sequential requests detected');
    }

    // Pattern analysis
    if (req.url.includes('/admin') && !req.session?.authenticated) {
      suspicious = true;
      reasons.push('Unauthorized admin access attempt');
    }

    if (req.url.includes('/.env') || req.url.includes('/config')) {
      suspicious = true;
      reasons.push('Configuration file access attempt');
    }

    // Clean up old entries (prevent memory leak)
    if (Math.random() < 0.01) { // 1% chance to clean up
      const cutoff = now.getTime() - 3600000; // 1 hour ago
      for (const [ip, data] of Array.from(this.requestCounts.entries())) {
        if (data.lastSeen.getTime() < cutoff) {
          this.requestCounts.delete(ip);
        }
      }
    }

    return { suspicious, reasons };
  }

  static recordFailedLogin(ip: string): void {
    const existing = this.failedAttempts.get(ip);
    const now = new Date();

    if (existing) {
      existing.count++;
      existing.lastAttempt = now;
    } else {
      this.failedAttempts.set(ip, { count: 1, lastAttempt: now });
    }

    // Block IP after 5 failed attempts
    if (existing && existing.count >= 5) {
      IPReputationService.blockIP(ip);
    }
  }
}

// Honeypot functionality
export class HoneyPot {
  static readonly HONEYPOT_ENDPOINTS = [
    '/admin.php',
    '/wp-admin/',
    '/administrator/',
    '/phpMyAdmin/',
    '/.env',
    '/config.php',
    '/database.php',
    '/backup.sql',
    '/robots.txt', // Monitor for suspicious bot behavior
  ];

  static isHoneypotEndpoint(url: string): boolean {
    return this.HONEYPOT_ENDPOINTS.some(endpoint => url.includes(endpoint));
  }

  static async handleHoneypotTrigger(req: Request, res: Response): Promise<void> {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || '';

    // Log the honeypot trigger
    await logSecurityEvent({
      timestamp: new Date(),
      ip,
      userAgent,
      eventType: 'HONEYPOT_TRIGGER',
      details: `Attempted access to honeypot endpoint: ${req.url}`,
      severity: 'HIGH',
      blocked: true
    });

    // Mark IP as suspicious
    IPReputationService.markSuspicious(ip);

    // Return fake content to waste attacker's time
    const fakeResponses = [
      '<h1>Index of /</h1><p>Nothing here</p>',
      '<?php echo "Access denied"; ?>',
      'Error 404: File not found',
      '<!-- Fake admin panel --><html><body><h1>Admin Login</h1></body></html>'
    ];

    const fakeResponse = fakeResponses[Math.floor(Math.random() * fakeResponses.length)];
    res.status(200).send(fakeResponse);
  }
}

// Advanced Security Middleware
export function advancedSecurityMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip ALL advanced security checks in development mode
    if (process.env.NODE_ENV === 'development') {
      return next();
    }

    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || '';

    try {
      // 1. Check if this is a honeypot endpoint
      if (HoneyPot.isHoneypotEndpoint(req.url)) {
        return await HoneyPot.handleHoneypotTrigger(req, res);
      }

      // 2. IP Reputation Check
      const reputation = await IPReputationService.checkReputation(ip);
      if (reputation.blocked) {
        await logSecurityEvent({
          timestamp: new Date(),
          ip,
          userAgent,
          eventType: 'ATTACK_ATTEMPT',
          details: `Blocked IP attempted access: ${reputation.reason}`,
          severity: 'HIGH',
          blocked: true
        });
        return res.status(403).json({ error: 'Access denied' });
      }

      // 3. WAF Analysis
      const wafAnalysis = await WebApplicationFirewall.analyzeRequest(req);
      if (wafAnalysis.threat) {
        await logSecurityEvent({
          timestamp: new Date(),
          ip,
          userAgent,
          eventType: 'MALICIOUS_PAYLOAD',
          details: `WAF detected threats: ${wafAnalysis.reasons.join(', ')}`,
          severity: wafAnalysis.score > 80 ? 'CRITICAL' : 'HIGH',
          blocked: true
        });

        // Block high-confidence attacks
        if (wafAnalysis.score > 80) {
          IPReputationService.blockIP(ip);
        } else {
          IPReputationService.markSuspicious(ip);
        }

        return res.status(403).json({ error: 'Request blocked by security policy' });
      }

      // 4. IDS Analysis
      const idsAnalysis = IntrusionDetectionSystem.analyzeTraffic(req);
      if (idsAnalysis.suspicious) {
        await logSecurityEvent({
          timestamp: new Date(),
          ip,
          userAgent,
          eventType: 'SUSPICIOUS_ACTIVITY',
          details: `IDS detected suspicious patterns: ${idsAnalysis.reasons.join(', ')}`,
          severity: 'MEDIUM',
          blocked: false
        });

        IPReputationService.markSuspicious(ip);
      }

      // 5. Rate limiting based on reputation
      if (reputation.reputation < 30) {
        // Stricter rate limits for suspicious IPs
        const suspiciousRateLimit = rateLimit({
          windowMs: 15 * 60 * 1000, // 15 minutes
          max: 10, // Very strict limit
          message: { error: 'Rate limit exceeded for suspicious IP' },
          standardHeaders: true,
          legacyHeaders: false,
        });
        return suspiciousRateLimit(req, res, next);
      }

      next();
    } catch (error) {
      console.error('Advanced security middleware error:', error);
      next(); // Continue on error to avoid breaking the app
    }
  };
}

// Create security database table
export async function initializeSecurityTables(): Promise<void> {
  try {
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS security_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        ip TEXT NOT NULL,
        user_agent TEXT,
        event_type TEXT NOT NULL,
        details TEXT NOT NULL,
        severity TEXT NOT NULL,
        blocked INTEGER NOT NULL
      )
    `);

    sqliteDb.exec(`
      CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON security_events(timestamp);
    `);

    sqliteDb.exec(`
      CREATE INDEX IF NOT EXISTS idx_security_events_ip ON security_events(ip);
    `);

    console.log('✅ Security tables initialized');
  } catch (error) {
    console.error('❌ Failed to initialize security tables:', error);
  }
}

// Export security classes for monitoring dashboard
export { IPReputationService };