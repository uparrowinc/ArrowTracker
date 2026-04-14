import cron from 'node-cron';
import { SitemapService } from './sitemap';
import { RSSService } from './rss';
import fs from 'fs/promises';
import path from 'path';

export class SEOScheduler {
  private isRunning = false;
  private sitemapService: SitemapService;
  private rssService: RSSService;

  constructor() {
    this.sitemapService = new SitemapService();
    this.rssService = new RSSService();
  }

  start() {
    if (this.isRunning) {
      console.log('SEO scheduler already running');
      return;
    }

    console.log('🔍 Starting SEO scheduler...');
    
    // Weekly sitemap regeneration (Sundays at 3:00 AM)
    cron.schedule('0 3 * * 0', async () => {
      await this.regenerateSitemap();
    });

    // Daily RSS feed cache warming (Daily at 2:30 AM)
    cron.schedule('30 2 * * *', async () => {
      await this.warmRSSCache();
    });

    // Monthly comprehensive SEO check (1st of month at 4:30 AM)
    cron.schedule('30 4 1 * *', async () => {
      await this.comprehensiveSEOCheck();
    });

    this.isRunning = true;
    console.log('✅ SEO scheduler started with tasks:');
    console.log('   📄 Sitemap regeneration: Sundays at 3:00 AM');
    console.log('   📡 RSS cache warming: Daily at 2:30 AM');
    console.log('   🔍 SEO health check: Monthly on 1st at 4:30 AM');
  }

  private async regenerateSitemap(): Promise<void> {
    try {
      console.log('📄 Starting scheduled sitemap regeneration...');
      
      // Generate fresh sitemap using mock request object
      const mockReq = {} as any;
      const sitemap = await this.sitemapService.generateSitemap(mockReq);
      
      // Save to file
      const sitemapPath = path.join(process.cwd(), 'sitemap.xml');
      await fs.writeFile(sitemapPath, sitemap, 'utf-8');
      
      console.log('✅ Sitemap regenerated successfully');
      
      // Log sitemap stats
      const urlCount = (sitemap.match(/<url>/g) || []).length;
      console.log(`📊 Sitemap contains ${urlCount} URLs`);
      
    } catch (error) {
      console.error('❌ Scheduled sitemap regeneration failed:', error);
    }
  }

  private async warmRSSCache(): Promise<void> {
    try {
      console.log('📡 Starting RSS feed cache warming...');
      
      // Pregenerate RSS feed to warm any caches
      const { blogStorage } = await import('./blog-storage');
      const posts = await blogStorage.getAllPosts(true);
      const baseUrl = 'https://ai.uparrowinc.com';
      const selfHref = `${baseUrl}/api/rss`;
      
      const rssXML = this.rssService['buildRSSXML'](posts, baseUrl, selfHref);
      
      console.log(`✅ RSS feed cache warmed - ${posts.length} posts included`);
      
      // Optional: Save RSS to static file for CDN serving
      const rssPath = path.join(process.cwd(), 'rss.xml');
      await fs.writeFile(rssPath, rssXML, 'utf-8');
      console.log('📄 Static RSS file updated for CDN serving');
      
    } catch (error) {
      console.error('❌ RSS cache warming failed:', error);
    }
  }

  private async comprehensiveSEOCheck(): Promise<void> {
    try {
      console.log('🔍 Starting monthly SEO health check...');
      
      const { blogStorage } = await import('./blog-storage');
      const posts = await blogStorage.getAllPosts(true);
      
      // Check for SEO issues
      const seoReport = {
        timestamp: new Date().toISOString(),
        totalPosts: posts.length,
        postsWithoutExcerpts: posts.filter(p => !p.excerpt).length,
        postsWithoutTags: posts.filter(p => !p.tags).length,
        averageTitleLength: posts.reduce((sum, p) => sum + p.title.length, 0) / posts.length,
        slugsNeedingAttention: posts.filter(p => p.slug.includes('_') || p.slug.includes(' ')).map(p => p.slug)
      };
      
      console.log('📊 SEO Health Report:');
      console.log(`   Total published posts: ${seoReport.totalPosts}`);
      console.log(`   Posts missing excerpts: ${seoReport.postsWithoutExcerpts}`);
      console.log(`   Posts missing tags: ${seoReport.postsWithoutTags}`);
      console.log(`   Average title length: ${Math.round(seoReport.averageTitleLength)} chars`);
      
      if (seoReport.slugsNeedingAttention.length > 0) {
        console.log(`   ⚠️ Slugs needing attention: ${seoReport.slugsNeedingAttention.join(', ')}`);
      }
      
      // Save report
      const reportPath = path.join(process.cwd(), 'seo-health-report.json');
      await fs.writeFile(reportPath, JSON.stringify(seoReport, null, 2), 'utf-8');
      
      console.log('✅ SEO health check completed - report saved');
      
    } catch (error) {
      console.error('❌ SEO health check failed:', error);
    }
  }

  // Manual trigger methods for testing
  async manualSitemapRegen(): Promise<void> {
    console.log('🔧 Manual sitemap regeneration triggered');
    await this.regenerateSitemap();
  }

  async manualRSSWarm(): Promise<void> {
    console.log('🔧 Manual RSS cache warming triggered');
    await this.warmRSSCache();
  }

  async manualSEOCheck(): Promise<void> {
    console.log('🔧 Manual SEO check triggered');
    await this.comprehensiveSEOCheck();
  }
}

export const seoScheduler = new SEOScheduler();