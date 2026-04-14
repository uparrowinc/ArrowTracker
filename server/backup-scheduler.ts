import { backupSystem } from './backup-system';

class BackupSchedulerService {
  startScheduledBackups(): void {
    console.log('🚀 Starting backup scheduler...');
    backupSystem.startScheduledBackups();
    console.log('✅ Backup scheduler initialized');
  }

  async createManualBackup(type: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<string> {
    console.log(`🔄 Creating manual ${type} backup...`);
    return await backupSystem.createFullBackup(type);
  }

  async getBackupStatus(): Promise<any> {
    return await backupSystem.getBackupStatus();
  }

  async cleanupOldBackups(): Promise<void> {
    console.log('🧹 Cleaning up old backups...');
    await backupSystem.cleanupOldBackups();
    console.log('✅ Backup cleanup completed');
  }
}

export const backupScheduler = new BackupSchedulerService();