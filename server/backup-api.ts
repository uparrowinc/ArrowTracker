import { Router } from 'express';
import { backupSystem } from './backup-system';
// Simple authentication middleware for backup operations
const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.session && req.session.authenticated && req.session.user?.username === 'admin') {
    return next();
  } else {
    return res.status(401).json({ message: 'Authentication required' });
  }
};

const router = Router();

// Get backup status
router.get('/status', isAuthenticated, async (req, res) => {
  try {
    const status = await backupSystem.getBackupStatus();
    res.json(status);
  } catch (error) {
    console.error('Backup status error:', error);
    res.status(500).json({ error: 'Failed to get backup status' });
  }
});

// Create manual backup
router.post('/create', isAuthenticated, async (req, res) => {
  try {
    const { type = 'daily' } = req.body;
    
    if (!['daily', 'weekly', 'monthly'].includes(type)) {
      return res.status(400).json({ error: 'Invalid backup type' });
    }

    const backupPath = await backupSystem.createFullBackup(type);
    
    res.json({
      success: true,
      message: `${type} backup created successfully`,
      backupPath,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Manual backup error:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// Cleanup old backups
router.post('/cleanup', isAuthenticated, async (req, res) => {
  try {
    await backupSystem.cleanupOldBackups();
    
    res.json({
      success: true,
      message: 'Old backups cleaned up successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Backup cleanup error:', error);
    res.status(500).json({ error: 'Failed to cleanup backups' });
  }
});

// Download backup
router.get('/download/:type/:filename', isAuthenticated, async (req, res) => {
  try {
    const type = String(req.params.type);
    const filename = String(req.params.filename);
    
    if (!['daily', 'weekly', 'monthly'].includes(type)) {
      return res.status(400).json({ error: 'Invalid backup type' });
    }

    const backupPath = `./backups/${type}/${filename}`;
    
    // Security: Ensure filename doesn't contain path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    res.download(backupPath, filename, (err) => {
      if (err) {
        console.error('Backup download error:', err);
        res.status(404).json({ error: 'Backup file not found' });
      }
    });
  } catch (error) {
    console.error('Backup download error:', error);
    res.status(500).json({ error: 'Failed to download backup' });
  }
});

export { router as backupRouter };