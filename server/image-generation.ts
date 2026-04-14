import sharp from 'sharp';
import QRCode from 'qrcode';
import fs from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';

export interface ImageGenerationOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
  format?: 'png' | 'jpg' | 'webp' | 'svg';
  quality?: number;
}

export interface TextOverlayOptions {
  text: string;
  x: number;
  y: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

export interface BlogImageOptions extends ImageGenerationOptions {
  title: string;
  subtitle?: string;
  category?: string;
  author?: string;
  date?: string;
  theme?: 'dark' | 'light' | 'gradient';
}

export interface SocialMediaOptions extends ImageGenerationOptions {
  title: string;
  description?: string;
  logo?: string;
  platform?: 'twitter' | 'facebook' | 'linkedin' | 'instagram';
}

export class ImageGenerator {
  private readonly outputDir: string;
  private _openai: OpenAI | null = null;

  constructor(outputDir: string = './uploads/generated') {
    this.outputDir = outputDir;
    this.ensureOutputDirectory();
  }

  private get openai(): OpenAI {
    if (!this._openai) {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not set — AI image generation is unavailable');
      }
      this._openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return this._openai;
  }

  private async ensureOutputDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create output directory:', error);
    }
  }

  // Generate QR Code
  async generateQRCode(data: string, options: ImageGenerationOptions = {}): Promise<Buffer> {
    const qrOptions = {
      width: options.width || 256,
      height: options.height || 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: options.backgroundColor || '#FFFFFF'
      }
    };

    return await QRCode.toBuffer(data, qrOptions);
  }

  // Generate blog post featured image using SVG + Sharp
  async generateBlogImage(options: BlogImageOptions): Promise<Buffer> {
    const width = options.width || 1200;
    const height = options.height || 630;
    
    // Create SVG content
    let backgroundColor = '#ffffff';
    let textColor = '#333333';
    let subtitleColor = '#666666';
    
    if (options.theme === 'gradient') {
      backgroundColor = 'url(#gradient)';
      textColor = '#ffffff';
      subtitleColor = '#e5e7eb';
    } else if (options.theme === 'dark') {
      backgroundColor = '#1a1a1a';
      textColor = '#ffffff';
      subtitleColor = '#cccccc';
    } else if (options.backgroundColor) {
      backgroundColor = options.backgroundColor;
    }

    // Word wrapping estimation for SVG (simplified)
    const words = options.title.split(' ');
    const maxCharsPerLine = Math.floor(width / 30); // Rough estimation
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const testLine = currentLine + ' ' + words[i];
      if (testLine.length > maxCharsPerLine && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);

    const titleFontSize = Math.min(width / 15, 60);
    const lineHeight = titleFontSize * 1.2;
    const totalTextHeight = lines.length * lineHeight;
    const startY = (height - totalTextHeight) / 2;

    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="${backgroundColor}"/>
  
  <!-- Category badge -->`;
  
    if (options.category) {
      const badgeY = 50;
      const badgeWidth = options.category.length * 12 + 40;
      const badgeX = (width - badgeWidth) / 2;
      
      svg += `
  <rect x="${badgeX}" y="${badgeY - 15}" width="${badgeWidth}" height="30" fill="#4CAF50" rx="15"/>
  <text x="${width/2}" y="${badgeY + 5}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${titleFontSize * 0.4}" font-weight="bold" fill="#ffffff">${options.category}</text>`;
    }

    // Title lines
    lines.forEach((line, index) => {
      const y = startY + (index * lineHeight);
      svg += `
  <text x="${width/2}" y="${y}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${titleFontSize}" font-weight="bold" fill="${textColor}">${this.escapeXml(line)}</text>`;
    });

    // Subtitle
    if (options.subtitle) {
      const subtitleY = startY + (lines.length * lineHeight) + 30;
      svg += `
  <text x="${width/2}" y="${subtitleY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${titleFontSize * 0.6}" fill="${subtitleColor}">${this.escapeXml(options.subtitle)}</text>`;
    }

    // Author and date
    if (options.author || options.date) {
      const bottomY = height - 30;
      if (options.author && options.date) {
        svg += `
  <text x="40" y="${bottomY}" font-family="Arial, sans-serif" font-size="${titleFontSize * 0.4}" fill="${subtitleColor}">By ${this.escapeXml(options.author)}</text>
  <text x="${width - 40}" y="${bottomY}" text-anchor="end" font-family="Arial, sans-serif" font-size="${titleFontSize * 0.4}" fill="${subtitleColor}">${this.escapeXml(options.date || '')}</text>`;
      } else if (options.author) {
        svg += `
  <text x="${width/2}" y="${bottomY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${titleFontSize * 0.4}" fill="${subtitleColor}">By ${this.escapeXml(options.author)}</text>`;
      } else if (options.date) {
        svg += `
  <text x="${width/2}" y="${bottomY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${titleFontSize * 0.4}" fill="${subtitleColor}">${this.escapeXml(options.date)}</text>`;
      }
    }

    svg += `
</svg>`;

    // Convert SVG to PNG using Sharp
    return await sharp(Buffer.from(svg))
      .png()
      .toBuffer();
  }

  // Generate social media image using SVG + Sharp
  async generateSocialImage(options: SocialMediaOptions): Promise<Buffer> {
    const platforms = {
      twitter: { width: 1200, height: 675 },
      facebook: { width: 1200, height: 630 },
      linkedin: { width: 1200, height: 627 },
      instagram: { width: 1080, height: 1080 }
    };

    const platform = platforms[options.platform || 'twitter'];
    const width = options.width || platform.width;
    const height = options.height || platform.height;

    // Word wrapping for title
    const words = options.title.split(' ');
    const maxCharsPerLine = Math.floor(width / 25);
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const testLine = currentLine + ' ' + words[i];
      if (testLine.length > maxCharsPerLine && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);

    const titleSize = Math.min(width / 12, 64);
    const lineHeight = titleSize * 1.2;
    const totalHeight = lines.length * lineHeight;
    const startY = (height - totalHeight) / 2;

    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="socialGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4338ca;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#socialGradient)"/>
  
  <!-- Up Arrow Inc branding -->
  <text x="40" y="50" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#ffffff">up arrow inc</text>`;

    // Title lines
    lines.forEach((line, index) => {
      const y = startY + (index * lineHeight);
      svg += `
  <text x="${width/2}" y="${y}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${titleSize}" font-weight="bold" fill="#ffffff">${this.escapeXml(line)}</text>`;
    });

    // Description
    if (options.description) {
      const descY = startY + (lines.length * lineHeight) + 40;
      svg += `
  <text x="${width/2}" y="${descY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${titleSize * 0.5}" fill="#e5e7eb">${this.escapeXml(options.description)}</text>`;
    }

    svg += `
</svg>`;

    return await sharp(Buffer.from(svg))
      .png()
      .toBuffer();
  }

  // Generate simple text image using SVG + Sharp
  async generateTextImage(
    text: string, 
    options: ImageGenerationOptions & { fontSize?: number; fontColor?: string }
  ): Promise<Buffer> {
    const width = options.width || 800;
    const height = options.height || 400;
    const fontSize = options.fontSize || 48;
    const fontColor = options.fontColor || '#000000';
    const backgroundColor = options.backgroundColor || '#ffffff';

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${backgroundColor}"/>
  <text x="${width/2}" y="${height/2}" text-anchor="middle" dominant-baseline="middle" 
        font-family="Arial, sans-serif" font-size="${fontSize}" fill="${fontColor}">
    ${this.escapeXml(text)}
  </text>
</svg>`;

    return await sharp(Buffer.from(svg))
      .png()
      .toBuffer();
  }

  // Helper method to escape XML characters
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Create SVG programmatically
  generateSVG(content: string, width: number = 400, height: number = 300): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  ${content}
</svg>`;
  }

  // Generate Up Arrow Inc logo as SVG
  generateLogoSVG(size: number = 100): string {
    const arrowSVG = `
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#4338ca;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle cx="${size/2}" cy="${size/2}" r="${size/2-2}" fill="url(#gradient)" stroke="#ffffff" stroke-width="2"/>
      <path d="M ${size*0.3} ${size*0.7} L ${size*0.5} ${size*0.3} L ${size*0.7} ${size*0.7} M ${size*0.5} ${size*0.7} L ${size*0.5} ${size*0.3}" 
            stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    `;
    
    return this.generateSVG(arrowSVG, size, size);
  }

  // Save image to file
  async saveImage(buffer: Buffer, filename: string): Promise<string> {
    const filepath = path.join(this.outputDir, filename);
    await fs.writeFile(filepath, buffer);
    return filepath;
  }

  // Get image as base64
  imageToBase64(buffer: Buffer, format: string = 'png'): string {
    return `data:image/${format};base64,${buffer.toString('base64')}`;
  }

  // Generate AI image using DALL-E
  async generateAIImage(prompt: string, options: {
    size?: '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'standard' | 'hd';
    style?: 'vivid' | 'natural';
  } = {}): Promise<Buffer> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured');
      }

      const response = await this.openai.images.generate({
        model: "dall-e-3", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        prompt: prompt,
        n: 1,
        size: options.size || "1024x1024",
        quality: options.quality || "standard",
        style: options.style || "natural"
      });

      const imageUrl = response.data?.[0]?.url;
      if (!imageUrl) {
        throw new Error('No image URL received from OpenAI');
      }

      // Download the image from OpenAI
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error('Failed to download generated image');
      }

      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      return imageBuffer;
    } catch (error) {
      console.error('DALL-E image generation error:', error);
      throw error;
    }
  }

  // Enhanced blog image with AI option
  async generateBlogImageWithAI(options: BlogImageOptions & { 
    useAI?: boolean; 
    prompt?: string;
    aiStyle?: 'vivid' | 'natural';
  }): Promise<Buffer> {
    if (options.useAI && options.prompt) {
      // Generate AI image first
      const aiImage = await this.generateAIImage(options.prompt, {
        size: '1792x1024',
        quality: 'hd',
        style: options.aiStyle || 'natural'
      });

      // Add title overlay to AI image
      const width = 1792;
      const height = 1024;
      
      // Create title overlay SVG
      const titleSVG = this.createTitleOverlay(options.title, options.category, width, height);
      const overlayBuffer = await sharp(Buffer.from(titleSVG)).png().toBuffer();

      // Composite AI image with title overlay
      return await sharp(aiImage)
        .composite([{ input: overlayBuffer, top: 0, left: 0 }])
        .resize(options.width || 1200, options.height || 630)
        .png()
        .toBuffer();
    } else {
      // Fallback to original blog image generation
      return this.generateBlogImage(options);
    }
  }

  private createTitleOverlay(title: string, category?: string, width: number = 1792, height: number = 1024): string {
    const titleFontSize = Math.min(width / 12, 80);
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="overlay" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(0,0,0,0.7);stop-opacity:1" />
      <stop offset="50%" style="stop-color:rgba(0,0,0,0.3);stop-opacity:1" />
      <stop offset="100%" style="stop-color:rgba(0,0,0,0.8);stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Dark overlay for text readability -->
  <rect width="${width}" height="${height}" fill="url(#overlay)"/>
  
  ${category ? `
  <!-- Category badge -->
  <rect x="50" y="50" width="${category.length * 12 + 40}" height="40" fill="#4CAF50" rx="20"/>
  <text x="${50 + (category.length * 12 + 40) / 2}" y="75" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff">${this.escapeXml(category)}</text>
  ` : ''}
  
  <!-- Title -->
  <text x="50" y="${height - 100}" font-family="Arial, sans-serif" font-size="${titleFontSize}" font-weight="bold" fill="#ffffff" text-shadow="2px 2px 4px rgba(0,0,0,0.8)">${this.escapeXml(title)}</text>
  
  <!-- Brand -->
  <text x="${width - 50}" y="${height - 30}" text-anchor="end" font-family="Arial, sans-serif" font-size="16" fill="#e5e7eb">By Up Arrow Inc</text>
</svg>`;
  }
}

export const imageGenerator = new ImageGenerator();