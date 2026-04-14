import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import multer from 'multer';

const stat = promisify(fs.stat);
const access = promisify(fs.access);

// Supported media formats
const SUPPORTED_VIDEO_FORMATS = ['.mp4', '.webm', '.ogg'];
const SUPPORTED_AUDIO_FORMATS = ['.mp3', '.mp4a', '.wav', '.ogg', '.aac', '.flac', '.m4a'];

// Media storage directory
const MEDIA_DIR = process.env.MEDIA_DIR || path.join(process.cwd(), 'uploads', 'media');

// File size limits (in bytes)
const MAX_AUDIO_SIZE = 100 * 1024 * 1024; // 100MB for audio files
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB for video files

interface StreamOptions {
  start?: number;
  end?: number;
  chunkSize?: number;
}

export class MediaStreamingService {
  constructor() {
    // Ensure media directory exists
    this.ensureMediaDirectory();
  }

  private async ensureMediaDirectory() {
    try {
      await access(MEDIA_DIR);
    } catch {
      await fs.promises.mkdir(MEDIA_DIR, { recursive: true });
    }
  }

  private isValidFormat(filename: string, supportedFormats: string[]): boolean {
    const ext = path.extname(filename).toLowerCase();
    return supportedFormats.includes(ext);
  }

  private sanitizeFilename(filename: string): string {
    // Remove any path traversal attempts
    return path.basename(filename);
  }

  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    
    const mimeTypes: { [key: string]: string } = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.ogg': 'video/ogg',
      '.mp3': 'audio/mpeg',
      '.mp4a': 'audio/mp4',
      '.wav': 'audio/wav',
      '.aac': 'audio/aac'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }

  async streamVideo(req: Request, res: Response): Promise<void> {
    try {
      const { file } = req.query;
      
      if (!file || typeof file !== 'string') {
        res.status(400).json({ error: 'File parameter required' });
        return;
      }

      const filename = this.sanitizeFilename(file);
      
      if (!this.isValidFormat(filename, SUPPORTED_VIDEO_FORMATS)) {
        res.status(400).json({ error: 'Unsupported video format' });
        return;
      }

      const filePath = path.join(MEDIA_DIR, 'videos', filename);
      
      // Check if file exists
      try {
        await access(filePath);
      } catch {
        res.status(404).json({ error: 'Video not found' });
        return;
      }

      await this.streamFile(filePath, req, res);
    } catch (error) {
      console.error('Video streaming error:', error);
      res.status(500).json({ error: 'Streaming failed' });
    }
  }

  async streamAudio(req: Request, res: Response): Promise<void> {
    try {
      const { file } = req.query;
      
      if (!file || typeof file !== 'string') {
        res.status(400).json({ error: 'File parameter required' });
        return;
      }

      const filename = this.sanitizeFilename(file);
      
      if (!this.isValidFormat(filename, SUPPORTED_AUDIO_FORMATS)) {
        res.status(400).json({ error: 'Unsupported audio format' });
        return;
      }

      const filePath = path.join(MEDIA_DIR, 'audio', filename);
      
      // Check if file exists
      try {
        await access(filePath);
      } catch {
        res.status(404).json({ error: 'Audio not found' });
        return;
      }

      await this.streamFile(filePath, req, res);
    } catch (error) {
      console.error('Audio streaming error:', error);
      res.status(500).json({ error: 'Streaming failed' });
    }
  }

  private async streamFile(filePath: string, req: Request, res: Response): Promise<void> {
    const stats = await stat(filePath);
    const fileSize = stats.size;
    const range = req.headers.range;

    const mimeType = this.getMimeType(filePath);
    
    // Set security headers for protected content
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Cache-Control', 'private, no-cache');
    
    if (range) {
      // Handle range requests for video/audio seeking
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      
      const stream = fs.createReadStream(filePath, { start, end });
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': mimeType,
      });
      
      stream.pipe(res);
    } else {
      // Stream entire file
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes',
      });
      
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    }
  }

  async uploadMedia(req: Request & { file?: Express.Multer.File }, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const file = req.file;
      const isVideo = this.isValidFormat(file.originalname, SUPPORTED_VIDEO_FORMATS);
      const isAudio = this.isValidFormat(file.originalname, SUPPORTED_AUDIO_FORMATS);
      
      if (!isVideo && !isAudio) {
        res.status(400).json({ error: 'Unsupported media format' });
        return;
      }

      const mediaType = isVideo ? 'videos' : 'audio';
      const uploadDir = path.join(MEDIA_DIR, mediaType);
      
      // Ensure upload directory exists
      await fs.promises.mkdir(uploadDir, { recursive: true });
      
      // Generate unique filename
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext);
      const filename = `${baseName}-${timestamp}${ext}`;
      const filePath = path.join(uploadDir, filename);
      
      // Save file
      await fs.promises.writeFile(filePath, file.buffer);
      
      // Return file info
      res.json({
        filename,
        originalName: file.originalname,
        size: file.size,
        type: mediaType,
        mimeType: this.getMimeType(filename),
        url: `/api/media/${mediaType}/stream?file=${encodeURIComponent(filename)}`
      });
      
    } catch (error) {
      console.error('Media upload error:', error);
      res.status(500).json({ error: 'Upload failed' });
    }
  }

  async listMedia(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.query; // 'videos' or 'audio'
      
      const mediaDirs = type ? [type.toString()] : ['videos', 'audio'];
      const mediaFiles: any[] = [];
      
      for (const mediaType of mediaDirs) {
        const mediaDir = path.join(MEDIA_DIR, mediaType);
        
        try {
          const files = await fs.promises.readdir(mediaDir);
          
          for (const file of files) {
            const filePath = path.join(mediaDir, file);
            const stats = await stat(filePath);
            
            mediaFiles.push({
              filename: file,
              type: mediaType,
              size: stats.size,
              modified: stats.mtime,
              mimeType: this.getMimeType(file),
              url: `/api/media/${mediaType}/stream?file=${encodeURIComponent(file)}`
            });
          }
        } catch {
          // Directory doesn't exist, skip
        }
      }
      
      res.json({ files: mediaFiles });
      
    } catch (error) {
      console.error('Media list error:', error);
      res.status(500).json({ error: 'Failed to list media' });
    }
  }

  async deleteMedia(req: Request, res: Response): Promise<void> {
    try {
      const type = String(req.params.type);
      const filename = String(req.params.filename);
      
      if (!type || !filename) {
        res.status(400).json({ error: 'Type and filename required' });
        return;
      }

      const sanitizedFilename = this.sanitizeFilename(String(filename));
      const filePath = path.join(MEDIA_DIR, String(type), sanitizedFilename);
      
      try {
        await fs.promises.unlink(filePath);
        res.json({ success: true, message: 'Media deleted' });
      } catch {
        res.status(404).json({ error: 'Media not found' });
      }
      
    } catch (error) {
      console.error('Media delete error:', error);
      res.status(500).json({ error: 'Delete failed' });
    }
  }
}

export const mediaStreamingService = new MediaStreamingService();