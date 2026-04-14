import { Request, Response } from 'express';
import { blogStorage } from './blog-storage';

interface RSSBlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  author: string | null;
  publishedAt: Date | null;
  tags: string | null;
}

export class RSSService {
  async generateRSSFeed(req: Request, res: Response): Promise<void> {
    try {
      const posts = await blogStorage.getAllPosts(true);
      // Always use production domain for RSS feed links
      const baseUrl = 'https://ai.uparrowinc.com';
      // Generate self-reference URL that matches the actual request URL
      const selfHref = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      const rssXML = this.buildRSSXML(posts, baseUrl, selfHref);

      res.set({
        'Content-Type': 'application/rss+xml; charset=UTF-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=300'
      });

      res.send(rssXML);
    } catch (error) {
      console.error('RSS generation error:', error);
      res.status(500).json({ error: 'Failed to generate RSS feed' });
    }
  }

  private buildRSSXML(posts: RSSBlogPost[], baseUrl: string, selfHref?: string): string {
    const now = new Date().toUTCString();
    const latestPost = posts[0];
    const lastBuildDate = latestPost?.publishedAt 
      ? new Date(latestPost.publishedAt).toUTCString() 
      : now;

    const iconUrl = `${baseUrl}/uai-logo.png`;

    const channelItems = posts.map(post => this.buildRSSItem(post, baseUrl)).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>uAI by Up Arrow Inc - Technology Insights &amp; Business Strategy</title>
    <link>${baseUrl}</link>
    <description>Latest insights on technology consulting, AI integration, and business growth strategies from Up Arrow Inc's uAI intelligence hub.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <pubDate>${now}</pubDate>
    <ttl>60</ttl>
    <atom:link href="${baseUrl}/api/rss" rel="self" type="application/rss+xml" />

    <image>
      <url>${iconUrl}</url>
      <title>uAI by Up Arrow Inc - Technology Insights &amp; Business Strategy</title>
      <link>${baseUrl}</link>
      <width>144</width>
      <height>144</height>
      <description>uAI by Up Arrow Inc - Technology Intelligence Hub</description>
    </image>

    <itunes:image href="${iconUrl}" />
    <itunes:author>Up Arrow Inc</itunes:author>
    <itunes:owner>
      <itunes:name>Up Arrow Inc</itunes:name>
      <itunes:email>info@uparrowinc.com</itunes:email>
    </itunes:owner>
    <itunes:explicit>false</itunes:explicit>
    <itunes:category text="Technology" />

    <generator>Up Arrow Inc Blog System</generator>
    <webMaster>info@uparrowinc.com (Up Arrow Inc)</webMaster>
    <managingEditor>info@uparrowinc.com (Up Arrow Inc)</managingEditor>
    <category>Technology</category>
    <category>Business Strategy</category>
    <category>AI Integration</category>
    <category>Consulting</category>

${channelItems}
  </channel>
</rss>`;
  }

  private buildRSSItem(post: RSSBlogPost, baseUrl: string): string {
    // Keep original slug case for canonical URLs (don't force lowercase)
    const postUrl = `${baseUrl}/blog/${post.slug}`;
    const pubDate = post.publishedAt 
      ? new Date(post.publishedAt).toUTCString() 
      : new Date().toUTCString();

    const cleanContent = this.sanitizeContentForRSS(post.content);
    const description = post.excerpt || cleanContent.substring(0, 300) + '...';

    const categories = post.tags 
      ? post.tags.split(',').map(tag => `      <category><![CDATA[${tag.trim()}]]></category>`).join('\n')
      : '';

    // Look for audio pattern in raw content first
    const audioMatch = post.content.match(/\[audio:([^\]]+)\]/);
    let enclosureTag = '';
    let itunesElements = '';

    if (audioMatch) {
      let audioUrl = audioMatch[1];
      
      // First, remove all HTML tags completely
      audioUrl = audioUrl.replace(/<[^>]*>/g, '');
      
      // Decode HTML entities
      audioUrl = audioUrl
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#39;/g, "'");
      
      // Remove any query parameters after the filename
      if (audioUrl.includes('&')) {
        audioUrl = audioUrl.split('&')[0];
      }
      
      // Clean the filename - replace spaces and special chars
      const filename = audioUrl.split('/').pop() || audioUrl;
      const cleanFilename = filename
        .replace(/\s+/g, '_')  // Replace spaces with underscores
        .replace(/'/g, '')     // Remove apostrophes
        .replace(/[^\w\-_.]/g, '_'); // Replace other special chars with underscores
      
      // Construct the full URL based on where audio files are stored
      let finalAudioUrl = '';
      if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) {
        // It's already a full URL, just use the cleaned filename
        const urlParts = audioUrl.split('/');
        urlParts[urlParts.length - 1] = encodeURIComponent(cleanFilename);
        finalAudioUrl = urlParts.join('/');
      } else if (audioUrl.startsWith('/')) {
        // Relative path - construct full URL
        finalAudioUrl = `${baseUrl}/uploads/media/${encodeURIComponent(cleanFilename)}`;
      } else {
        // Just a filename - assume it's in uploads/media
        finalAudioUrl = `${baseUrl}/uploads/media/${encodeURIComponent(cleanFilename)}`;
      }
      
      // Ensure URL is properly escaped for XML
      enclosureTag = `      <enclosure url="${this.escapeXml(finalAudioUrl)}" length="25000000" type="audio/mpeg" />`;
      itunesElements = `      <itunes:duration>00:25:00</itunes:duration>
      <itunes:summary><![CDATA[${description}]]></itunes:summary>`;
    }

    return `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <description><![CDATA[${description}]]></description>
      <content:encoded><![CDATA[${cleanContent}]]></content:encoded>
      <pubDate>${pubDate}</pubDate>
      <author>info@uparrowinc.com (${post.author || 'Up Arrow Inc'})</author>
${categories}
${enclosureTag}
${itunesElements}
    </item>`;
  }

  private isValidUrl(urlString: string): boolean {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private sanitizeContentForRSS(content: string): string {
    let htmlContent = content;

    // First, clean up non-breaking spaces and other problematic characters
    htmlContent = htmlContent
      .replace(/\u00A0/g, ' ')  // Replace non-breaking spaces with regular spaces
      .replace(/\u2028/g, '\n')  // Replace line separator with newline
      .replace(/\u2029/g, '\n')  // Replace paragraph separator with newline
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters

    // Will be applied at the end after all processing
    let needsHtmlFixing = true;

    // IMPORTANT: Process audio/video/media tags BEFORE markdown conversion to preserve underscores
    // Store them as placeholders to avoid markdown processing damaging the URLs
    const mediaReplacements: Array<{ pattern: RegExp; replacement: (match: string, url: string) => string }> = [
      {
        pattern: /\[audio:([^\]]+)\]/g,
        replacement: (match, url) => {
          // Clean the URL - remove HTML tags and decode entities
          let cleanUrl = url
            .replace(/<[^>]*>/g, '')  // Remove HTML tags
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
            .replace(/&#39;/g, "'");
          
          // Remove query parameters
          if (cleanUrl.includes('&')) {
            cleanUrl = cleanUrl.split('&')[0];
          }
          
          // Get the filename from the URL (it already has underscores from database)
          const filename = cleanUrl.split('/').pop() || cleanUrl;
          // Keep the filename as-is since it's already properly formatted in the database
          const cleanFilename = filename;
          
          // Construct proper URL
          const baseUrl = 'https://ai.uparrowinc.com';
          const audioUrl = cleanUrl.startsWith('http') ? cleanUrl : `${baseUrl}/uploads/media/${cleanFilename}`;
          
          return `<p><a href="${audioUrl}">🎵 Listen to Audio</a></p>`;
        }
      },
      {
        pattern: /\[video:([^\]]+)\]/g,
        replacement: (match, url) => `<p><a href="${url}">🎥 Watch Video</a></p>`
      },
      {
        pattern: /\[youtube:([^\]]+)\]/g,
        replacement: (match, id) => `<p><a href="https://youtube.com/watch?v=${id}">📺 YouTube</a></p>`
      },
      {
        pattern: /\[rumble:([^\]]+)\]/g,
        replacement: (match, id) => `<p><a href="https://rumble.com/${id}">📹 Rumble</a></p>`
      }
    ];

    // Replace all media tags with placeholders
    const placeholders: { placeholder: string; html: string }[] = [];
    mediaReplacements.forEach(({ pattern, replacement }) => {
      htmlContent = htmlContent.replace(pattern, (match, url) => {
        const html = replacement(match, url);
        // Use a placeholder format that won't be damaged by markdown processing
        const placeholder = `%%MEDIAPH${placeholders.length}%%`;
        placeholders.push({ placeholder, html });
        return placeholder;
      });
    });

    // Convert markdown to HTML
    htmlContent = htmlContent
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Skip italic conversion for RSS - just remove the markdown syntax
      .replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '$1')  // Remove single asterisks
      .replace(/(?<!_)_([^_\n]+?)_(?!_)/g, '$1')  // Remove single underscores
      .replace(/!\[([^\]]*)\]\(([^\)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;" />')
      .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/^---+$/gm, '<hr />')
      .replace(/^===+$/gm, '<hr />');

    const lines = htmlContent.split('\n');
    const processedLines: string[] = [];
    let inUl = false, inOl = false;

    for (const line of lines) {
      const trim = line.trim();

      if (/^[•\-\*]\s+/.test(trim)) {
        if (!inUl) {
          if (inOl) { processedLines.push('</ol>'); inOl = false; }
          processedLines.push('<ul>');
          inUl = true;
        }
        processedLines.push(`<li>${trim.replace(/^[•\-\*]\s+/, '')}</li>`);
      } else if (/^\d+\.\s+/.test(trim)) {
        if (!inOl) {
          if (inUl) { processedLines.push('</ul>'); inUl = false; }
          processedLines.push('<ol>');
          inOl = true;
        }
        processedLines.push(`<li>${trim.replace(/^\d+\.\s+/, '')}</li>`);
      } else {
        if (inUl) { processedLines.push('</ul>'); inUl = false; }
        if (inOl) { processedLines.push('</ol>'); inOl = false; }
        processedLines.push(line);
      }
    }
    if (inUl) processedLines.push('</ul>');
    if (inOl) processedLines.push('</ol>');

    htmlContent = processedLines.join('\n');

    htmlContent = htmlContent
      .replace(/```[\s\S]*?```/g, '<pre><code>[Technical Code Example]</code></pre>')
      .replace(/`([^`\n]+)`/g, '<code>$1</code>');

    // Restore media placeholders after all markdown processing
    placeholders.forEach(({ placeholder, html }) => {
      htmlContent = htmlContent.replace(placeholder, html);
    });

    // Fix orphaned text between heading tags
    htmlContent = htmlContent.replace(
      /(<\/h[1-6]>)\s*\n?([^<\s][^<]*?)(?=\s*<h[1-6]>)/gi,
      (match, closingTag, orphanedText) => {
        const trimmed = orphanedText.trim();
        if (trimmed && !trimmed.startsWith('<')) {
          return `${closingTag}\n<p>${trimmed}</p>`;
        }
        return match;
      }
    );
    
    // Fix nested and unclosed paragraph tags
    htmlContent = htmlContent
      .replace(/<p>([^<]*)<p>/g, '<p>$1</p><p>')  // Fix unclosed P before new P
      .replace(/<\/p>\s*<\/p>/g, '</p>')  // Remove double closing tags
      .replace(/<p>\s*<p>/g, '<p>');  // Remove double opening tags
    
    const blocks = htmlContent.split('\n\n').map(section => {
      const trimmed = section.trim();
      if (!trimmed) return '';
      if (/^<(h[1-6]|ul|ol|pre|hr|img|p)\b/.test(trimmed)) return trimmed;
      return `<p>${trimmed.replace(/\n/g, ' ')}</p>`;
    });

    let finalContent = blocks.join('\n')
      .replace(/<p><\/p>/g, '')
      .replace(/<p>(<h[1-6].*?<\/h[1-6]>)<\/p>/g, '$1')
      .replace(/<p>(<ul>.*?<\/ul>)<\/p>/g, '$1')
      .replace(/<p>([^<]*?)\s*<ul>/g, '<p>$1</p><ul>') // Fix text followed by list 
      .replace(/<\/ul>\s*<\/p>/g, '</ul>')
      .replace(/<p>(<ol>.*?<\/ol>)<\/p>/g, '$1')
      .replace(/<p>([^<]*?)\s*<ol>/g, '<p>$1</p><ol>') // Fix text followed by ordered list
      .replace(/<\/ol>\s*<\/p>/g, '</ol>')
      .replace(/<p>(<hr\s*\/?>)<\/p>/g, '$1')
      .replace(/<p>(<img[^>]*>)<\/p>/g, '$1')
      .replace(/<br\s*\/?>\s*<\/li>/g, '</li>')
      .replace(/<li>\s*<br\s*\/?>/g, '<li>')
      .replace(/<ul>\s*<br\s*\/?>/g, '<ul>')
      .replace(/<br\s*\/?>\s*<\/ul>/g, '</ul>')
      .replace(/<ol>\s*<br\s*\/?>/g, '<ol>')
      .replace(/<br\s*\/?>\s*<\/ol>/g, '</ol>');

    // Fix HTML entities and invalid XML characters
    finalContent = finalContent
      // First fix any existing multiple encodings
      .replace(/&amp;amp;/g, '&amp;')
      .replace(/&amp;#x2F;/g, '/')
      .replace(/&amp;#x27;/g, "'")
      // Then handle unescaped ampersands
      .replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;')
      .replace(/[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD]/g, '') // Remove invalid XML characters
      // Clean up audio links
      .replace(/<a href="([^"]*?)&amp;title=[^"]*"/g, '<a href="$1"');

    // Final paragraph cleanup - fix nested and malformed paragraph tags
    finalContent = finalContent
      .replace(/<p>([^<]*?)<p>/g, '<p>$1</p><p>')  // Close unclosed P before new P
      .replace(/<\/p>\s*<\/p>/g, '</p>')  // Remove double closing tags
      .replace(/<p>\s*<p>/g, '<p>')  // Remove double opening tags
      .replace(/<p>\s*<\/p>/g, '');  // Remove empty paragraphs

    return finalContent;
  }

  async getRSSMetadata(req: Request, res: Response): Promise<void> {
    try {
      const posts = await blogStorage.getAllPosts(true);
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const metadata = {
        feedUrl: `${baseUrl}/api/rss`,
        feedTitle: 'uAI by Up Arrow Inc - Technology Insights & Business Strategy',
        feedDescription: 'Latest insights on technology consulting, AI integration, and business growth strategies',
        itemCount: posts.length,
        lastUpdated: posts[0]?.publishedAt || null,
        websiteUrl: baseUrl,
        blogUrl: `${baseUrl}/blog`
      };
      res.json(metadata);
    } catch (error) {
      console.error('RSS metadata error:', error);
      res.status(500).json({ error: 'Failed to get RSS metadata' });
    }
  }
}

export const rssService = new RSSService();