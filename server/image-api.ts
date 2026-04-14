import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { imageGenerator, BlogImageOptions, SocialMediaOptions, ImageGenerationOptions } from './image-generation';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Validation middleware
const validateImageGeneration = [
  body('width').optional().isInt({ min: 100, max: 2000 }).withMessage('Width must be between 100 and 2000 pixels'),
  body('height').optional().isInt({ min: 100, max: 2000 }).withMessage('Height must be between 100 and 2000 pixels'),
  body('quality').optional().isInt({ min: 1, max: 100 }).withMessage('Quality must be between 1 and 100'),
];

const validateBlogImage = [
  ...validateImageGeneration,
  body('title').isString().isLength({ min: 1, max: 200 }).withMessage('Title is required and must be less than 200 characters'),
  body('subtitle').optional().isString().isLength({ max: 300 }).withMessage('Subtitle must be less than 300 characters'),
  body('category').optional().isString().isLength({ max: 50 }).withMessage('Category must be less than 50 characters'),
  body('author').optional().isString().isLength({ max: 100 }).withMessage('Author must be less than 100 characters'),
  body('theme').optional().isIn(['dark', 'light', 'gradient']).withMessage('Theme must be dark, light, or gradient'),
  body('useAI').optional().isBoolean().withMessage('useAI must be a boolean'),
  body('prompt').optional().isString().isLength({ min: 1, max: 1000 }).withMessage('Prompt must be less than 1000 characters'),
  body('aiStyle').optional().isIn(['vivid', 'natural']).withMessage('AI style must be vivid or natural'),
];

const validateAIImage = [
  body('prompt').isString().isLength({ min: 1, max: 1000 }).withMessage('Prompt is required and must be less than 1000 characters'),
  body('size').optional().isIn(['1024x1024', '1792x1024', '1024x1792']).withMessage('Size must be 1024x1024, 1792x1024, or 1024x1792'),
  body('quality').optional().isIn(['standard', 'hd']).withMessage('Quality must be standard or hd'),
  body('style').optional().isIn(['vivid', 'natural']).withMessage('Style must be vivid or natural'),
];

const validateSocialImage = [
  ...validateImageGeneration,
  body('title').isString().isLength({ min: 1, max: 200 }).withMessage('Title is required and must be less than 200 characters'),
  body('description').optional().isString().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('platform').optional().isIn(['twitter', 'facebook', 'linkedin', 'instagram']).withMessage('Platform must be twitter, facebook, linkedin, or instagram'),
];

const validateTextImage = [
  ...validateImageGeneration,
  body('text').isString().isLength({ min: 1, max: 500 }).withMessage('Text is required and must be less than 500 characters'),
  body('fontSize').optional().isInt({ min: 12, max: 200 }).withMessage('Font size must be between 12 and 200'),
  body('fontColor').optional().isString().matches(/^#[0-9A-F]{6}$/i).withMessage('Font color must be a valid hex color'),
  body('backgroundColor').optional().isString().matches(/^#[0-9A-F]{6}$/i).withMessage('Background color must be a valid hex color'),
];

const validateQRCode = [
  body('data').isString().isLength({ min: 1, max: 2000 }).withMessage('Data is required and must be less than 2000 characters'),
  body('width').optional().isInt({ min: 64, max: 1024 }).withMessage('Width must be between 64 and 1024 pixels'),
  body('height').optional().isInt({ min: 64, max: 1024 }).withMessage('Height must be between 64 and 1024 pixels'),
];

// Handle validation errors
const handleValidationErrors = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Generate QR Code
router.post('/qr-code', validateQRCode, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { data, width, height, backgroundColor } = req.body;
    
    const options: ImageGenerationOptions = {
      width: width || 256,
      height: height || 256,
      backgroundColor: backgroundColor || '#FFFFFF'
    };

    const buffer = await imageGenerator.generateQRCode(data, options);
    
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': buffer.length,
      'Cache-Control': 'public, max-age=3600'
    });
    
    res.send(buffer);
  } catch (error) {
    console.error('QR Code generation error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Generate blog post featured image (with optional AI)
router.post('/blog-image', validateBlogImage, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const options = {
      title: req.body.title,
      subtitle: req.body.subtitle,
      category: req.body.category,
      author: req.body.author || 'Up Arrow Inc',
      date: req.body.date,
      theme: req.body.theme || 'gradient',
      width: req.body.width || 1200,
      height: req.body.height || 630,
      backgroundColor: req.body.backgroundColor,
      useAI: req.body.useAI || false,
      prompt: req.body.prompt,
      aiStyle: req.body.aiStyle || 'natural'
    };

    const buffer = await imageGenerator.generateBlogImageWithAI(options);
    
    // Save image to disk
    const timestamp = Date.now();
    const filename = `blog-featured-${timestamp}.png`;
    const filepath = path.join(__dirname, '../generated-images', filename);
    
    await fs.promises.writeFile(filepath, buffer);
    
    // Return URL instead of binary data
    const imageUrl = `/generated-images/${filename}`;
    res.json({ url: imageUrl, filename });
  } catch (error) {
    console.error('Blog image generation error:', error);
    res.status(500).json({ error: 'Failed to generate blog image' });
  }
});

// Generate social media image
router.post('/social-image', validateSocialImage, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const options: SocialMediaOptions = {
      title: req.body.title,
      description: req.body.description,
      platform: req.body.platform || 'twitter',
      width: req.body.width,
      height: req.body.height,
      backgroundColor: req.body.backgroundColor
    };

    const buffer = await imageGenerator.generateSocialImage(options);
    
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': buffer.length,
      'Cache-Control': 'public, max-age=3600'
    });
    
    res.send(buffer);
  } catch (error) {
    console.error('Social image generation error:', error);
    res.status(500).json({ error: 'Failed to generate social media image' });
  }
});

// Generate simple text image
router.post('/text-image', validateTextImage, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const options = {
      width: req.body.width || 800,
      height: req.body.height || 400,
      backgroundColor: req.body.backgroundColor || '#ffffff',
      fontSize: req.body.fontSize || 48,
      fontColor: req.body.fontColor || '#000000'
    };

    const buffer = await imageGenerator.generateTextImage(req.body.text, options);
    
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': buffer.length,
      'Cache-Control': 'public, max-age=3600'
    });
    
    res.send(buffer);
  } catch (error) {
    console.error('Text image generation error:', error);
    res.status(500).json({ error: 'Failed to generate text image' });
  }
});

// Generate Up Arrow Inc logo
router.get('/logo', async (req: Request, res: Response) => {
  try {
    const size = parseInt(req.query.size as string) || 100;
    const format = req.query.format as string || 'svg';
    
    if (size < 16 || size > 512) {
      return res.status(400).json({ error: 'Size must be between 16 and 512 pixels' });
    }

    if (format === 'svg') {
      const svg = imageGenerator.generateLogoSVG(size);
      res.set({
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400'
      });
      res.send(svg);
    } else {
      // Convert SVG to PNG using Sharp
      const svg = imageGenerator.generateLogoSVG(size);
      const sharp = await import('sharp');
      const buffer = await sharp.default(Buffer.from(svg))
        .png()
        .toBuffer();
      
      res.set({
        'Content-Type': 'image/png',
        'Content-Length': buffer.length,
        'Cache-Control': 'public, max-age=86400'
      });
      res.send(buffer);
    }
  } catch (error) {
    console.error('Logo generation error:', error);
    res.status(500).json({ error: 'Failed to generate logo' });
  }
});

// Get image generation capabilities
router.get('/capabilities', (req: Request, res: Response) => {
  res.json({
    types: [
      {
        name: 'QR Code',
        endpoint: '/api/images/qr-code',
        method: 'POST',
        description: 'Generate QR codes for URLs, text, or data',
        parameters: ['data', 'width?', 'height?', 'backgroundColor?']
      },
      {
        name: 'Blog Featured Image',
        endpoint: '/api/images/blog-image',
        method: 'POST',
        description: 'Generate featured images for blog posts',
        parameters: ['title', 'subtitle?', 'category?', 'author?', 'date?', 'theme?', 'width?', 'height?']
      },
      {
        name: 'Social Media Image',
        endpoint: '/api/images/social-image',
        method: 'POST',
        description: 'Generate optimized images for social media platforms',
        parameters: ['title', 'description?', 'platform?', 'width?', 'height?']
      },
      {
        name: 'Text Image',
        endpoint: '/api/images/text-image',
        method: 'POST',
        description: 'Generate simple text-based images',
        parameters: ['text', 'fontSize?', 'fontColor?', 'backgroundColor?', 'width?', 'height?']
      },
      {
        name: 'Logo',
        endpoint: '/api/images/logo',
        method: 'GET',
        description: 'Generate Up Arrow Inc logo in SVG or PNG format',
        parameters: ['size?', 'format?']
      }
    ],
    formats: ['png', 'jpg', 'webp', 'svg'],
    maxWidth: 2000,
    maxHeight: 2000,
    platforms: ['twitter', 'facebook', 'linkedin', 'instagram'],
    themes: ['dark', 'light', 'gradient']
  });
});

// Generate pure AI image
router.post('/ai-image', validateAIImage, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const options = {
      size: req.body.size || '1024x1024',
      quality: req.body.quality || 'standard',
      style: req.body.style || 'natural'
    };

    const buffer = await imageGenerator.generateAIImage(req.body.prompt, options);
    
    // Save image to disk
    const timestamp = Date.now();
    const filename = `ai-generated-${timestamp}.png`;
    const filepath = path.join(__dirname, '../generated-images', filename);
    
    await fs.promises.writeFile(filepath, buffer);
    
    // Return URL instead of binary data
    const imageUrl = `/generated-images/${filename}`;
    res.json({ url: imageUrl, filename });
  } catch (error) {
    console.error('AI image generation error:', error);
    res.status(500).json({ error: 'Failed to generate AI image: ' + (error as Error).message });
  }
});

export default router;