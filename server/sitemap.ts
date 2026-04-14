import { Request, Response } from 'express';
import { storage } from './storage';
import fs from 'fs/promises';
import path from 'path';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export class SitemapService {
  private sitemapPath = path.join(process.cwd(), 'sitemap.xml');
  
  async generateSitemap(req: Request, res?: Response): Promise<string> {
    try {
      // Always use production domain for canonical URLs in sitemap
      const baseUrl = 'https://ai.uparrowinc.com';
      const sitemap = await this.buildSitemapXML(baseUrl);
      
      // Save to file for static serving
      await fs.writeFile(this.sitemapPath, sitemap, 'utf-8');
      
      if (res) {
        res.set({
          'Content-Type': 'application/xml; charset=UTF-8',
          'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
        });
        res.send(sitemap);
        return sitemap;
      }
      
      return sitemap;
    } catch (error) {
      console.error('Sitemap generation error:', error);
      if (res) {
        res.status(500).json({ error: 'Failed to generate sitemap' });
      }
      throw error;
    }
  }

  async serveSitemap(req: Request, res: Response): Promise<void> {
    try {
      // Always generate fresh sitemap to avoid caching issues
      await this.generateSitemap(req, res);
    } catch (error) {
      console.error('Sitemap serving error:', error);
      res.status(500).json({ error: 'Failed to serve sitemap' });
    }
  }

  private async buildSitemapXML(baseUrl: string): Promise<string> {
    const urls: SitemapUrl[] = [];
    const now = new Date().toISOString();

    // Main website pages
    const staticPages: SitemapUrl[] = [
      {
        loc: `${baseUrl}/`,
        lastmod: now,
        changefreq: 'weekly',
        priority: 1.0
      },
      {
        loc: `${baseUrl}/blog`,
        lastmod: now,
        changefreq: 'daily',
        priority: 0.9
      }
    ];

    urls.push(...staticPages);

    // Blog posts - directly query database to bypass any caching issues
    try {
      const { db } = await import('./db');
      const { blogPosts } = await import('../shared/blog-schema');
      const { eq } = await import('drizzle-orm');
      
      const publishedPosts = await db
        .select({
          id: blogPosts.id,
          title: blogPosts.title,
          slug: blogPosts.slug,
          publishedAt: blogPosts.publishedAt,
          updatedAt: blogPosts.updatedAt
        })
        .from(blogPosts)
        .where(eq(blogPosts.published, true));
        
      console.log(`Sitemap: Found ${publishedPosts.length} published blog posts directly from DB`);
      
      for (const post of publishedPosts) {
        // Keep original slug case, fix lastmod type issue
        const lastModified = post.publishedAt ? new Date(post.publishedAt).toISOString() : 
                            post.updatedAt ? new Date(post.updatedAt).toISOString() : 
                            now;
        urls.push({
          loc: `${baseUrl}/blog/${post.slug}`,
          lastmod: lastModified,
          changefreq: 'monthly',
          priority: 0.8
        });
      }
    } catch (error) {
      console.error('Error fetching blog posts for sitemap:', error);
    }

    // Auto-discover static files and pages
    await this.addStaticFiles(urls, baseUrl, now);

    // RSS Feed
    urls.push({
      loc: `${baseUrl}/api/rss`,
      lastmod: now,
      changefreq: 'daily',
      priority: 0.7
    });

    console.log(`Sitemap: Generated with ${urls.length} total URLs`);
    return this.buildXML(urls);
  }

  private buildXML(urls: SitemapUrl[]): string {
    const urlsXML = urls.map(url => {
      // Keep original URL case as requested by user
      let urlXML = `    <url>\n      <loc>${this.escapeXML(url.loc)}</loc>\n`;
      
      if (url.lastmod) {
        urlXML += `      <lastmod>${url.lastmod}</lastmod>\n`;
      }
      
      if (url.changefreq) {
        urlXML += `      <changefreq>${url.changefreq}</changefreq>\n`;
      }
      
      if (url.priority !== undefined) {
        urlXML += `      <priority>${url.priority.toFixed(1)}</priority>\n`;
      }
      
      urlXML += `    </url>`;
      return urlXML;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urlsXML}
</urlset>`;
  }

  private async addStaticFiles(urls: SitemapUrl[], baseUrl: string, now: string): Promise<void> {
    try {
      // Check for important static files that should be in sitemap
      const staticFilesToCheck = [
        'robots.txt',
        'favicon.ico'
        // Note: sitemap.xml excluded to avoid self-reference
      ];

      for (const fileName of staticFilesToCheck) {
        try {
          const filePath = path.join(process.cwd(), fileName);
          await fs.access(filePath);
          
          // File exists, add to sitemap with low priority
          urls.push({
            loc: `${baseUrl}/${fileName}`,
            lastmod: now,
            changefreq: 'monthly',
            priority: 0.1
          });
          
          console.log(`Sitemap: Added static file ${fileName}`);
        } catch {
          // File doesn't exist, skip silently
        }
      }

      // Auto-discover important directories that might contain indexable content
      // Exclude directories that shouldn't be in sitemap
      const excludedDirs = [
        'static-site',      // User requested exclusion
        'node_modules',
        '.git',
        'backups',
        'uploads',
        'attached_assets',
        'test',
        'server',
        'client'
      ];

      const importantDirs = [
        'generated-images'
      ];

      for (const dir of importantDirs) {
        if (excludedDirs.includes(dir)) continue;
        
        try {
          const dirPath = path.join(process.cwd(), dir);
          await fs.access(dirPath);
          
          // Check if directory has an index file
          const indexFiles = ['index.html', 'index.htm'];
          for (const indexFile of indexFiles) {
            try {
              await fs.access(path.join(dirPath, indexFile));
              urls.push({
                loc: `${baseUrl}/${dir}/`,
                lastmod: now,
                changefreq: 'weekly',
                priority: 0.5
              });
              console.log(`Sitemap: Added directory index ${dir}/`);
              break;
            } catch {
              // No index file, continue
            }
          }
        } catch {
          // Directory doesn't exist, skip
        }
      }

    } catch (error) {
      console.error('Error checking static files for sitemap:', error);
    }
  }

  private escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  async updateSitemapForNewPost(): Promise<void> {
    try {
      // Regenerate sitemap when new blog post is published
      const mockReq = {
        protocol: 'https',
        get: () => 'uparrowinc.com'
      } as any;
      
      await this.generateSitemap(mockReq);
      console.log('Sitemap updated for new blog post');
    } catch (error) {
      console.error('Failed to update sitemap for new post:', error);
    }
  }

  async weeklyUpdate(): Promise<void> {
    try {
      const mockReq = {
        protocol: 'https',
        get: () => 'uparrowinc.com'
      } as any;
      
      await this.generateSitemap(mockReq);
      console.log('Weekly sitemap update completed');
    } catch (error) {
      console.error('Weekly sitemap update failed:', error);
    }
  }

  async getSitemapStats(req: Request, res: Response): Promise<void> {
    try {
      const publishedPosts = await storage.getPublishedBlogPosts();
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      let lastUpdated = null;
      try {
        const stats = await fs.stat(this.sitemapPath);
        lastUpdated = stats.mtime.toISOString();
      } catch {
        // File doesn't exist
      }
      
      const stats = {
        sitemapUrl: `${baseUrl}/sitemap.xml`,
        totalUrls: 3 + publishedPosts.length + 1, // static pages + blog posts + RSS
        blogPosts: publishedPosts.length,
        lastUpdated,
        lastGenerated: new Date().toISOString()
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Sitemap stats error:', error);
      res.status(500).json({ error: 'Failed to get sitemap stats' });
    }
  }
}

export const sitemapService = new SitemapService();