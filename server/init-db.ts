/**
 * init-db.ts
 * Auto-creates all SQLite tables on first run (idempotent — safe to run every startup).
 * Called from server/index.ts before the Express app starts.
 */
import { sqliteDb } from "./db.js";

export function initializeDatabase() {
  sqliteDb.exec(`
    -- Core tables
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT,
      slug TEXT UNIQUE NOT NULL,
      features TEXT,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      company TEXT,
      role TEXT,
      content TEXT NOT NULL,
      rating INTEGER DEFAULT 5,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      bio TEXT,
      image_url TEXT,
      linkedin_url TEXT,
      twitter_url TEXT,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS case_studies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      client TEXT NOT NULL,
      industry TEXT,
      challenge TEXT,
      solution TEXT,
      results TEXT,
      metrics TEXT,
      image_url TEXT,
      slug TEXT UNIQUE NOT NULL,
      is_published INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS contact_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT,
      service TEXT,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'new',
      created_at INTEGER DEFAULT (unixepoch())
    );

    -- Blog tables
    CREATE TABLE IF NOT EXISTS blog_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      content TEXT NOT NULL,
      excerpt TEXT,
      author TEXT DEFAULT 'Admin',
      category TEXT DEFAULT 'General',
      tags TEXT,
      featured_image TEXT,
      is_published INTEGER DEFAULT 0,
      is_featured INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      read_time INTEGER DEFAULT 5,
      audio_url TEXT,
      audio_title TEXT,
      post_type TEXT DEFAULT 'article',
      reading_time INTEGER DEFAULT 5,
      meta_title TEXT,
      meta_description TEXT,
      published_at INTEGER,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS blog_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      color TEXT DEFAULT '#3B82F6',
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS blog_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL REFERENCES blog_posts(id),
      author_name TEXT NOT NULL,
      author_email TEXT NOT NULL,
      content TEXT NOT NULL,
      is_approved INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch())
    );

    -- Ticketing / Kanban tables
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'active',
      prefix TEXT UNIQUE NOT NULL,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_number TEXT UNIQUE NOT NULL,
      project_id INTEGER REFERENCES projects(id),
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'backlog',
      priority TEXT DEFAULT 'medium',
      type TEXT DEFAULT 'task',
      assignee_id INTEGER,
      reporter_id INTEGER,
      story_points INTEGER DEFAULT 0,
      estimated_hours REAL DEFAULT 0,
      logged_hours REAL DEFAULT 0,
      due_date INTEGER,
      labels TEXT,
      attachments TEXT,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS ticket_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL REFERENCES tickets(id),
      author_id INTEGER,
      content TEXT NOT NULL,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS ticket_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL REFERENCES tickets(id),
      changed_by INTEGER,
      field_changed TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS sprints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES projects(id),
      name TEXT NOT NULL,
      goal TEXT,
      status TEXT DEFAULT 'planning',
      start_date INTEGER,
      end_date INTEGER,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS sprint_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sprint_id INTEGER NOT NULL REFERENCES sprints(id),
      ticket_id INTEGER NOT NULL REFERENCES tickets(id),
      added_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS ticketing_team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT DEFAULT 'developer',
      avatar_url TEXT,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );

    -- Membership tables
    CREATE TABLE IF NOT EXISTS membership_tiers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      price REAL DEFAULT 0,
      billing_period TEXT DEFAULT 'monthly',
      features TEXT,
      max_courses INTEGER DEFAULT 0,
      support_level TEXT DEFAULT 'basic',
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT,
      avatar_url TEXT,
      membership_tier TEXT DEFAULT 'basic',
      membership_tier_id INTEGER REFERENCES membership_tiers(id),
      membership_status TEXT DEFAULT 'pending',
      membership_start_date INTEGER,
      membership_end_date INTEGER,
      is_email_verified INTEGER DEFAULT 0,
      email_verification_token TEXT,
      password_reset_token TEXT,
      password_reset_expires INTEGER,
      mfa_enabled INTEGER DEFAULT 0,
      mfa_secret TEXT,
      mfa_backup_codes TEXT,
      last_login_at INTEGER,
      login_attempts INTEGER DEFAULT 0,
      locked_until INTEGER,
      approved_by INTEGER,
      approved_at INTEGER,
      notes TEXT,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      short_description TEXT,
      thumbnail_url TEXT,
      instructor TEXT DEFAULT 'Admin',
      duration_hours REAL DEFAULT 0,
      difficulty TEXT DEFAULT 'beginner',
      category TEXT,
      tags TEXT,
      is_published INTEGER DEFAULT 0,
      is_featured INTEGER DEFAULT 0,
      price REAL DEFAULT 0,
      membership_tier_required TEXT DEFAULT 'basic',
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS course_modules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL REFERENCES courses(id),
      title TEXT NOT NULL,
      description TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS course_lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      module_id INTEGER NOT NULL REFERENCES course_modules(id),
      title TEXT NOT NULL,
      content TEXT,
      video_url TEXT,
      duration_minutes INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      is_free_preview INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS member_enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL REFERENCES members(id),
      course_id INTEGER NOT NULL REFERENCES courses(id),
      enrolled_at INTEGER DEFAULT (unixepoch()),
      completed_at INTEGER,
      progress_percentage REAL DEFAULT 0,
      last_accessed_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS lesson_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL REFERENCES members(id),
      lesson_id INTEGER NOT NULL REFERENCES course_lessons(id),
      is_completed INTEGER DEFAULT 0,
      completed_at INTEGER,
      time_spent_seconds INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS support_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_number TEXT UNIQUE NOT NULL,
      member_id INTEGER NOT NULL REFERENCES members(id),
      subject TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'open',
      priority TEXT DEFAULT 'medium',
      category TEXT DEFAULT 'general',
      assigned_to TEXT,
      assigned_at INTEGER,
      resolved_at INTEGER,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS ticket_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL REFERENCES support_tickets(id),
      sender_type TEXT NOT NULL,
      sender_id INTEGER,
      message TEXT NOT NULL,
      attachments TEXT,
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      member_id INTEGER NOT NULL REFERENCES members(id),
      status TEXT DEFAULT 'draft',
      subtotal REAL DEFAULT 0,
      tax_rate REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      total REAL DEFAULT 0,
      currency TEXT DEFAULT 'USD',
      due_date INTEGER,
      paid_at INTEGER,
      payment_method TEXT,
      stripe_payment_intent_id TEXT,
      notes TEXT,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL REFERENCES invoices(id),
      description TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      course_id INTEGER REFERENCES courses(id),
      membership_tier_id INTEGER REFERENCES membership_tiers(id)
    );

    CREATE TABLE IF NOT EXISTS member_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT UNIQUE NOT NULL,
      member_id INTEGER NOT NULL REFERENCES members(id),
      ip_address TEXT,
      user_agent TEXT,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (unixepoch()),
      last_accessed_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL REFERENCES members(id),
      course_id INTEGER NOT NULL REFERENCES courses(id),
      certificate_number TEXT UNIQUE NOT NULL,
      issued_at INTEGER DEFAULT (unixepoch()),
      pdf_path TEXT,
      verification_code TEXT UNIQUE
    );

    -- Atlassian integration
    CREATE TABLE IF NOT EXISTS atlassian_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_url TEXT NOT NULL,
      project_key TEXT NOT NULL,
      api_token_encrypted TEXT NOT NULL,
      user_email TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      last_sync_at INTEGER,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS time_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL REFERENCES tickets(id),
      team_member_id INTEGER REFERENCES ticketing_team_members(id),
      hours_spent REAL NOT NULL,
      description TEXT,
      logged_date INTEGER DEFAULT (unixepoch()),
      created_at INTEGER DEFAULT (unixepoch())
    );
  `);

  // Run migrations to add columns that may be missing from older databases
  const migrations = [
    `ALTER TABLE blog_posts ADD COLUMN audio_url TEXT`,
    `ALTER TABLE blog_posts ADD COLUMN audio_title TEXT`,
    `ALTER TABLE blog_posts ADD COLUMN post_type TEXT DEFAULT 'article'`,
    `ALTER TABLE blog_posts ADD COLUMN reading_time INTEGER DEFAULT 5`,
  ];
  for (const migration of migrations) {
    try {
      sqliteDb.exec(migration);
    } catch (e: any) {
      // Column already exists — safe to ignore
      if (!e.message?.includes('duplicate column name')) {
        console.warn(`Migration skipped: ${e.message}`);
      }
    }
  }

  console.log("✅ Database tables initialized");
}
