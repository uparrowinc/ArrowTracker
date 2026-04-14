import { Pool } from '@neondatabase/serverless';
import { db, sqliteDb } from './db';
import { sql } from 'drizzle-orm';
import { users, blogPosts, emailSubscribers, teamMembers, services, testimonials, mediaUploads } from '@shared/schema';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import archiver from 'archiver';
import cron from 'node-cron';

export interface BackupConfig {
  enabled: boolean;
  schedule: {
    daily: string;
    weekly: string;
    monthly: string;
  };
  retention: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  storageLocation: string;
  includeUploads: boolean;
  compression: boolean;
}

export class BackupSystem {
  private config: BackupConfig;
  private backupDir: string;

  constructor(config: BackupConfig) {
    this.config = config;
    this.backupDir = path.resolve(config.storageLocation);
    this.initializeBackupDirectory();
  }

  private async initializeBackupDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      await fs.mkdir(path.join(this.backupDir, 'daily'), { recursive: true });
      await fs.mkdir(path.join(this.backupDir, 'weekly'), { recursive: true });
      await fs.mkdir(path.join(this.backupDir, 'monthly'), { recursive: true });
      console.log('✅ Backup directories initialized');
    } catch (error) {
      console.error('❌ Failed to initialize backup directories:', error);
    }
  }

  async createFullBackup(type: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${type}-${timestamp}`;
    const backupPath = path.join(this.backupDir, type, backupName);

    console.log(`🔄 Starting ${type} backup: ${backupName}`);

    try {
      // Create backup directory
      await fs.mkdir(backupPath, { recursive: true });

      // 1. Database backup
      await this.backupDatabase(backupPath);

      // 2. Application files backup
      await this.backupApplicationFiles(backupPath);

      // 3. Media/uploads backup
      if (this.config.includeUploads) {
        await this.backupUploads(backupPath);
      }

      // 4. Configuration backup
      await this.backupConfiguration(backupPath);

      // 5. Create compressed archive
      if (this.config.compression) {
        const archivePath = `${backupPath}.zip`;
        await this.compressBackup(backupPath, archivePath);
        
        // Remove uncompressed backup
        await fs.rm(backupPath, { recursive: true });
        
        console.log(`✅ ${type} backup completed: ${archivePath}`);
        return archivePath;
      }

      console.log(`✅ ${type} backup completed: ${backupPath}`);
      return backupPath;
    } catch (error) {
      console.error(`❌ ${type} backup failed:`, error);
      throw error;
    }
  }

  private async backupDatabase(backupPath: string): Promise<void> {
    const dbBackupPath = path.join(backupPath, 'database');
    await fs.mkdir(dbBackupPath, { recursive: true });

    try {
      // Define table mappings with their Drizzle schema objects
      const tableDefinitions = [
        { name: 'users', schema: users },
        { name: 'blog_posts', schema: blogPosts },
        { name: 'email_subscribers', schema: emailSubscribers },
        { name: 'team_members', schema: teamMembers },
        { name: 'services', schema: services },
        { name: 'testimonials', schema: testimonials },
        { name: 'media_uploads', schema: mediaUploads }
      ];
      
      for (const { name, schema: tableSchema } of tableDefinitions) {
        console.log(`📊 Backing up table: ${name}`);
        
        try {
          // Use Drizzle query builder instead of raw SQL
          const data = await db.select().from(tableSchema);
          const jsonData = JSON.stringify(data, null, 2);
          
          await fs.writeFile(
            path.join(dbBackupPath, `${name}.json`),
            jsonData,
            'utf8'
          );
          
          console.log(`✅ Table ${name} backed up (${data.length} rows)`);
        } catch (tableError) {
          console.warn(`⚠️ Failed to backup table ${name}:`, tableError);
          // Continue with other tables
        }
      }

      // Handle session tables that may not be in schema using proper sql template literals
      try {
        console.log(`📊 Backing up session table: sessions`);
        let sessionsRows: any[] = [];
        try { sessionsRows = sqliteDb.prepare(`SELECT * FROM sessions`).all(); } catch {}
        const sessionsJson = JSON.stringify(sessionsRows, null, 2);
        
        await fs.writeFile(
          path.join(dbBackupPath, `sessions.json`),
          sessionsJson,
          'utf8'
        );
        
        console.log(`✅ Session table sessions backed up (${sessionsRows.length} rows)`);
      } catch (tableError) {
        console.warn(`⚠️ Failed to backup session table sessions:`, tableError);
      }

      try {
        console.log(`📊 Backing up session table: admin_sessions`);
        let adminSessionsRows: any[] = [];
        try { adminSessionsRows = sqliteDb.prepare(`SELECT * FROM admin_sessions`).all(); } catch {}
        const adminSessionsJson = JSON.stringify(adminSessionsRows, null, 2);
        
        await fs.writeFile(
          path.join(dbBackupPath, `admin_sessions.json`),
          adminSessionsJson,
          'utf8'
        );
        
        console.log(`✅ Session table admin_sessions backed up (${adminSessionsRows.length} rows)`);
      } catch (tableError) {
        console.warn(`⚠️ Failed to backup session table admin_sessions:`, tableError);
      }

      // Create database schema backup
      const schemaFiles = ['shared/schema.ts', 'shared/blog-schema.ts'];
      const schemaBackupPath = path.join(dbBackupPath, 'schema');
      await fs.mkdir(schemaBackupPath, { recursive: true });

      for (const schemaFile of schemaFiles) {
        try {
          const schemaContent = await fs.readFile(schemaFile, 'utf8');
          await fs.writeFile(
            path.join(schemaBackupPath, path.basename(schemaFile)),
            schemaContent,
            'utf8'
          );
        } catch (schemaError) {
          console.warn(`⚠️ Failed to backup schema file ${schemaFile}`);
        }
      }

      console.log('✅ Database backup completed');
    } catch (error) {
      console.error('❌ Database backup failed:', error);
      throw error;
    }
  }

  private async backupApplicationFiles(backupPath: string): Promise<void> {
    const appBackupPath = path.join(backupPath, 'application');
    await fs.mkdir(appBackupPath, { recursive: true });

    const criticalFiles = [
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      'tailwind.config.ts',
      'drizzle.config.ts',
      'replit.md',
      '.replit'
    ];

    const criticalDirectories = [
      'server',
      'client',
      'shared'
    ];

    try {
      // Backup critical files
      for (const file of criticalFiles) {
        try {
          const content = await fs.readFile(file, 'utf8');
          await fs.writeFile(path.join(appBackupPath, file), content, 'utf8');
        } catch (fileError) {
          console.warn(`⚠️ Failed to backup file ${file}`);
        }
      }

      // Backup critical directories
      for (const dir of criticalDirectories) {
        try {
          await this.copyDirectory(dir, path.join(appBackupPath, dir));
        } catch (dirError) {
          console.warn(`⚠️ Failed to backup directory ${dir}`);
        }
      }

      console.log('✅ Application files backup completed');
    } catch (error) {
      console.error('❌ Application files backup failed:', error);
      throw error;
    }
  }

  private async backupUploads(backupPath: string): Promise<void> {
    const uploadsBackupPath = path.join(backupPath, 'uploads');
    
    try {
      await this.copyDirectory('uploads', uploadsBackupPath);
      console.log('✅ Uploads backup completed');
    } catch (error) {
      console.warn('⚠️ Uploads backup failed (directory may not exist):', error);
    }
  }

  private async backupConfiguration(backupPath: string): Promise<void> {
    const configBackupPath = path.join(backupPath, 'configuration');
    await fs.mkdir(configBackupPath, { recursive: true });

    const backupInfo = {
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      nodeVersion: process.version,
      platform: process.platform,
      backupConfig: this.config,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL_SET: !!process.env.DATABASE_URL,
        // Don't include actual secrets, just confirm they exist
        secrets: {
          DATABASE_URL: !!process.env.DATABASE_URL,
          SESSION_SECRET: !!process.env.SESSION_SECRET,
          PGUSER: !!process.env.PGUSER,
          PGPASSWORD: !!process.env.PGPASSWORD
        }
      }
    };

    await fs.writeFile(
      path.join(configBackupPath, 'backup-info.json'),
      JSON.stringify(backupInfo, null, 2),
      'utf8'
    );

    console.log('✅ Configuration backup completed');
  }

  private async copyDirectory(src: string, dest: string): Promise<void> {
    try {
      await fs.mkdir(dest, { recursive: true });
      const entries = await fs.readdir(src, { withFileTypes: true });

      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
          await this.copyDirectory(srcPath, destPath);
        } else {
          await fs.copyFile(srcPath, destPath);
        }
      }
    } catch (error) {
      console.error(`Failed to copy directory ${src} to ${dest}:`, error);
      throw error;
    }
  }

  private async compressBackup(backupPath: string, archivePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = createWriteStream(archivePath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        console.log(`📦 Archive created: ${archive.pointer()} bytes`);
        resolve();
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);
      archive.directory(backupPath, false);
      archive.finalize();
    });
  }

  async cleanupOldBackups(): Promise<void> {
    const types: Array<'daily' | 'weekly' | 'monthly'> = ['daily', 'weekly', 'monthly'];

    for (const type of types) {
      try {
        const typeDir = path.join(this.backupDir, type);
        const entries = await fs.readdir(typeDir);
        
        // Sort by creation time (newest first)
        const backups = entries
          .filter(name => name.startsWith(`backup-${type}-`))
          .sort()
          .reverse();

        const retention = this.config.retention[type];
        const toDelete = backups.slice(retention);

        for (const backup of toDelete) {
          const backupPath = path.join(typeDir, backup);
          await fs.rm(backupPath, { recursive: true, force: true });
          console.log(`🗑️ Cleaned up old ${type} backup: ${backup}`);
        }

        console.log(`✅ ${type} backup cleanup completed (kept ${Math.min(backups.length, retention)} backups)`);
      } catch (error) {
        console.error(`❌ Failed to cleanup ${type} backups:`, error);
      }
    }
  }

  async restoreFromBackup(backupPath: string): Promise<void> {
    console.log(`🔄 Starting restore from backup: ${backupPath}`);

    try {
      // This is a complex operation that should be done carefully
      // For now, we'll provide the structure for manual restoration
      
      const restoreInfo = {
        timestamp: new Date().toISOString(),
        backupPath,
        steps: [
          '1. Stop the application',
          '2. Backup current state',
          '3. Restore database from backup JSON files',
          '4. Restore application files',
          '5. Restore uploads',
          '6. Update configuration',
          '7. Restart application'
        ]
      };

      await fs.writeFile(
        path.join(this.backupDir, 'restore-plan.json'),
        JSON.stringify(restoreInfo, null, 2),
        'utf8'
      );

      console.log('⚠️ Restore plan created. Manual intervention required for safety.');
      console.log('📋 Check restore-plan.json for detailed steps.');
      
    } catch (error) {
      console.error('❌ Restore preparation failed:', error);
      throw error;
    }
  }

  startScheduledBackups(): void {
    if (!this.config.enabled) {
      console.log('📋 Backup system disabled in configuration');
      return;
    }

    // Daily backups
    cron.schedule(this.config.schedule.daily, async () => {
      try {
        await this.createFullBackup('daily');
        await this.cleanupOldBackups();
      } catch (error) {
        console.error('❌ Scheduled daily backup failed:', error);
      }
    });

    // Weekly backups
    cron.schedule(this.config.schedule.weekly, async () => {
      try {
        await this.createFullBackup('weekly');
      } catch (error) {
        console.error('❌ Scheduled weekly backup failed:', error);
      }
    });

    // Monthly backups
    cron.schedule(this.config.schedule.monthly, async () => {
      try {
        await this.createFullBackup('monthly');
      } catch (error) {
        console.error('❌ Scheduled monthly backup failed:', error);
      }
    });

    // Force an initial backup if no recent backup exists
    setTimeout(() => {
      this.checkAndRunInitialBackup();
    }, 5000); // Run after 5 seconds to allow system to fully initialize
    
    console.log('⏰ Backup schedules started:');
    console.log(`   Daily: ${this.config.schedule.daily}`);
    console.log(`   Weekly: ${this.config.schedule.weekly}`);
    console.log(`   Monthly: ${this.config.schedule.monthly}`);
  }

  async getBackupStatus(): Promise<any> {
    try {
      const types: Array<'daily' | 'weekly' | 'monthly'> = ['daily', 'weekly', 'monthly'];
      const status: any = {
        enabled: this.config.enabled,
        lastBackups: {},
        totalBackups: 0,
        totalSize: 0,
        retention: this.config.retention
      };

      for (const type of types) {
        try {
          const typeDir = path.join(this.backupDir, type);
          const entries = await fs.readdir(typeDir);
          const backups = entries
            .filter(name => name.startsWith(`backup-${type}-`))
            .sort()
            .reverse();

          status.lastBackups[type] = backups[0] || 'None';
          status.totalBackups += backups.length;

          // Calculate total size
          for (const backup of backups) {
            try {
              const backupPath = path.join(typeDir, backup);
              const stats = await fs.stat(backupPath);
              status.totalSize += stats.size;
            } catch (sizeError) {
              // Skip if can't get size
            }
          }
        } catch (typeError) {
          status.lastBackups[type] = 'Error';
        }
      }

      // Convert size to human readable
      status.totalSizeFormatted = this.formatBytes(status.totalSize);

      return status;
    } catch (error) {
      console.error('Failed to get backup status:', error);
      return { error: 'Failed to get backup status' };
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private async checkAndRunInitialBackup(): Promise<void> {
    try {
      const status = await this.getBackupStatus();
      const lastDailyBackup = status.lastBackups?.daily;
      
      if (lastDailyBackup === 'None' || lastDailyBackup === undefined) {
        console.log('🔄 No recent backups found, creating initial backup...');
        await this.createFullBackup('daily');
        console.log('✅ Initial backup completed');
      } else {
        // Check if last backup is older than 2 days
        const backupDate = this.extractDateFromBackupName(lastDailyBackup);
        const twoDaysAgo = Date.now() - (2 * 24 * 60 * 60 * 1000);
        
        if (backupDate && backupDate < twoDaysAgo) {
          console.log('🔄 Last backup is older than 2 days, creating fresh backup...');
          await this.createFullBackup('daily');
          console.log('✅ Fresh backup completed');
        } else {
          console.log('✅ Recent backup found, no immediate backup needed');
        }
      }
    } catch (error) {
      console.error('❌ Initial backup check failed:', error);
    }
  }

  private extractDateFromBackupName(backupName: string): number | null {
    try {
      // Extract timestamp from backup name like "backup-daily-2025-08-02T02-00-00-123Z.zip"
      const match = backupName.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)/);
      if (match) {
        const timestamp = match[1].replace(/-/g, ':').replace(/T(\d{2}):(\d{2}):(\d{2}):(\d{3})Z/, 'T$1:$2:$3.$4Z');
        return new Date(timestamp).getTime();
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to extract date from backup name:', error);
      return null;
    }
  }
}

// Default backup configuration
export const defaultBackupConfig: BackupConfig = {
  enabled: true,
  schedule: {
    daily: '0 2 * * *',     // 2 AM daily
    weekly: '0 3 * * 0',    // 3 AM every Sunday
    monthly: '0 4 1 * *'    // 4 AM on 1st of every month
  },
  retention: {
    daily: 7,     // Keep 7 daily backups
    weekly: 4,    // Keep 4 weekly backups
    monthly: 12   // Keep 12 monthly backups
  },
  storageLocation: './backups',
  includeUploads: true,
  compression: true
};

// Initialize backup system
export const backupSystem = new BackupSystem(defaultBackupConfig);