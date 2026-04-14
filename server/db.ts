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

const sqlite = new Database(dbPath);

// Enable WAL mode for better concurrent access
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });
export const sqliteDb = sqlite;
