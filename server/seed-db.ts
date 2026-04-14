// Seed database with initial data from JSON file
// Uses all authoritative Drizzle export data — every field, every table
import { sqliteDb } from "./db.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function seedDatabase() {
  console.log("🌱 Checking seed data...");

  try {
    const seedPath = join(__dirname, "seed-data.json");
    const seedData = JSON.parse(readFileSync(seedPath, "utf-8"));

    const toMs = (v: any): number | null => {
      if (!v) return null;
      if (typeof v === 'number') return v;
      try { return new Date(v).getTime(); } catch { return null; }
    };

    // ── 1. BLOG CATEGORIES ──────────────────────────────────────────────────
    const insertCat = sqliteDb.prepare(`
      INSERT OR IGNORE INTO blog_categories
        (id, name, slug, description, color, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    let catCount = 0;
    for (const c of (seedData.categories || [])) {
      const result = insertCat.run(
        c.id,
        c.name,
        c.slug,
        c.description || '',
        c.color || '#3B82F6',
        toMs(c.created_at) || Date.now()
      );
      if (result.changes > 0) catCount++;
    }
    if (catCount > 0) console.log(`  ✅ Seeded ${catCount} blog categories`);

    // ── 2. BLOG POSTS ────────────────────────────────────────────────────────
    const insertPost = sqliteDb.prepare(`
      INSERT OR IGNORE INTO blog_posts
        (id, title, slug, excerpt, content, featured_image, author,
         published, published_at, created_at, updated_at,
         tags, meta_description, reading_time, seo_title, canonical_url,
         audio_url, audio_duration, audio_title, post_type,
         scheduled_for, category, subcategory)
      VALUES
        (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);
    let postCount = 0;
    for (const p of (seedData.posts || [])) {
      const result = insertPost.run(
        p.id,
        p.title,
        p.slug,
        p.excerpt || '',
        p.content || '',
        p.featured_image || '',
        p.author || 'Up Arrow Inc',
        p.published ?? 1,
        toMs(p.published_at),
        toMs(p.created_at) || Date.now(),
        toMs(p.updated_at) || Date.now(),
        p.tags || '',
        p.meta_description || '',
        p.reading_time || '5 min read',
        p.seo_title || null,
        p.canonical_url || null,
        p.audio_url || '',
        p.audio_duration || '',
        p.audio_title || '',
        p.post_type || 'article',
        toMs(p.scheduled_for),
        p.category || '',
        p.subcategory || ''
      );
      if (result.changes > 0) postCount++;
    }
    if (postCount > 0) console.log(`  ✅ Seeded ${postCount} blog posts`);

    // ── 3. MEMBERS ───────────────────────────────────────────────────────────
    const insertMember = sqliteDb.prepare(`
      INSERT OR IGNORE INTO members
        (id, email, first_name, last_name, password, phone, company,
         membership_tier, membership_status, is_approved,
         has_training_access, has_ticketing_access, has_billing_access,
         mfa_enabled, mfa_secret, mfa_method,
         created_at, updated_at,
         profile_image, job_title,
         membership_start_date, membership_end_date,
         stripe_customer_id, stripe_subscription_id, paypal_customer_id,
         last_login_at, preferred_mfa_method,
         phone_verified, email_verified,
         failed_mfa_attempts)
      VALUES
        (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);
    let memberCount = 0;
    for (const m of (seedData.members || [])) {
      try {
        const result = insertMember.run(
          m.id,
          m.email,
          m.first_name || '',
          m.last_name || '',
          m.password || '',
          m.phone || '',
          m.company || '',
          m.membership_tier || 'free',
          m.membership_status || 'active',
          m.is_approved ?? 1,
          m.has_training_access ?? 0,
          m.has_ticketing_access ?? 0,
          m.has_billing_access ?? 0,
          m.mfa_enabled ?? 0,
          m.mfa_secret || null,
          m.mfa_method || 'totp',
          toMs(m.created_at) || Date.now(),
          toMs(m.updated_at) || Date.now(),
          m.profile_image || null,
          m.job_title || null,
          toMs(m.membership_start_date),
          toMs(m.membership_end_date),
          m.stripe_customer_id || null,
          m.stripe_subscription_id || null,
          m.paypal_customer_id || null,
          toMs(m.last_login_at),
          m.preferred_mfa_method || 'totp',
          m.phone_verified ?? 0,
          m.email_verified ?? 0,
          m.failed_mfa_attempts ?? 0
        );
        if (result.changes > 0) memberCount++;
      } catch (e: any) {
        console.warn(`  ⚠️  Member insert failed for ${m.email}: ${e.message}`);
      }
    }
    if (memberCount > 0) console.log(`  ✅ Seeded ${memberCount} members`);

    // ── 4. SECURITY EVENTS ───────────────────────────────────────────────────
    const secTableInfo = sqliteDb.prepare("PRAGMA table_info(security_events)").all() as any[];
    if (secTableInfo.length > 0) {
      const insertSecEvent = sqliteDb.prepare(`
        INSERT OR IGNORE INTO security_events
          (id, timestamp, ip, user_agent, event_type, details, severity, blocked)
        VALUES (?,?,?,?,?,?,?,?)
      `);
      let secCount = 0;
      for (const e of (seedData.security_events || [])) {
        try {
          const result = insertSecEvent.run(
            e.id,
            toMs(e.timestamp) || Date.now(),
            e.ip || '',
            e.user_agent || '',
            e.event_type || '',
            typeof e.details === 'object' ? JSON.stringify(e.details) : (e.details || ''),
            e.severity || 'low',
            e.blocked ? 1 : 0
          );
          if (result.changes > 0) secCount++;
        } catch (_) { /* ignore duplicate/schema errors */ }
      }
      if (secCount > 0) console.log(`  ✅ Seeded ${secCount} security events`);
    }

    // ── 5. SESSIONS ──────────────────────────────────────────────────────────
    const sessTableInfo = sqliteDb.prepare("PRAGMA table_info(sessions)").all() as any[];
    if (sessTableInfo.length > 0) {
      const insertSession = sqliteDb.prepare(`
        INSERT OR IGNORE INTO sessions (sid, sess, expire)
        VALUES (?,?,?)
      `);
      let sessCount = 0;
      for (const s of (seedData.sessions || [])) {
        try {
          const result = insertSession.run(
            s.sid,
            typeof s.sess === 'object' ? JSON.stringify(s.sess) : (s.sess || '{}'),
            s.expire || null
          );
          if (result.changes > 0) sessCount++;
        } catch (_) { /* ignore */ }
      }
      if (sessCount > 0) console.log(`  ✅ Seeded ${sessCount} sessions`);
    }

    console.log("✅ Seed complete");
  } catch (err: any) {
    console.error("❌ Seed error:", err.message);
  }
}
