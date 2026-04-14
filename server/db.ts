import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";
import path from "path";
import fs from "fs";

// Support Railway volumes: DATABASE_URL can be a full path like /data/sqlite.db
// or a relative path like ./sqlite.db
const dbUrl = process.env.DATABASE_URL || './sqlite.db';
const dbPath = dbUrl.startsWith('/') ? dbUrl : path.resolve(dbUrl);

// Ensure the directory exists (important for Railway volume mounts)
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Schema version — increment this whenever the schema changes to force a fresh DB
const SCHEMA_VERSION = 6;

// Check if the existing DB has the correct schema version
// If not, delete it so it gets recreated fresh with all columns
if (fs.existsSync(dbPath)) {
  try {
    const checkDb = new Database(dbPath);
    let version = 0;
    try {
      const row = checkDb.prepare("SELECT value FROM _schema_meta WHERE key = 'version'").get() as any;
      version = row ? parseInt(row.value) : 0;
    } catch {
      version = 0; // table doesn't exist yet
    }
    checkDb.close();
    if (version < SCHEMA_VERSION) {
      console.log(`[DB] Schema version ${version} < ${SCHEMA_VERSION}, deleting stale database for fresh start...`);
      fs.unlinkSync(dbPath);
      // Also remove WAL files if they exist
      if (fs.existsSync(dbPath + '-wal')) fs.unlinkSync(dbPath + '-wal');
      if (fs.existsSync(dbPath + '-shm')) fs.unlinkSync(dbPath + '-shm');
    }
  } catch (e) {
    console.warn('[DB] Could not check schema version, proceeding:', e);
  }
}

const sqlite = new Database(dbPath);

// Enable WAL mode for better concurrent access
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });
export const sqliteDb = sqlite;
export const CURRENT_SCHEMA_VERSION = SCHEMA_VERSION;
