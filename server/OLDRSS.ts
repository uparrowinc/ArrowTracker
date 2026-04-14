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
      // Use the real blog storage to get published posts
      const posts = await blogStorage.getAllPosts(true); // published only
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      console.log(`📡 RSS: Generating feed with ${posts.length} published posts`);
      
      const rssXML = this.buildRSSXML(posts, baseUrl);
      
      console.log(`📡 RSS: Posts found - ${posts.map(p => p.title).join(', ')}`);
      console.log(`📡 RSS: First post data:`, posts[0] ? { title: posts[0].title, published: posts[0].published, publishedAt: posts[0].publishedAt } : 'No posts');
      
      res.set({
        'Content-Type': 'application/rss+xml; charset=UTF-8',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      });
      
      res.send(rssXML);
    } catch (error) {
      console.error('RSS generation error:', error);
      res.status(500).json({ error: 'Failed to generate RSS feed' });
    }
  }

  private buildRSSXML(posts: RSSBlogPost[], baseUrl: string): string {
    const now = new Date().toUTCString();
    const latestPost = posts[0];
    const lastBuildDate = latestPost?.publishedAt 
      ? new Date(latestPost.publishedAt).toUTCString() 
      : now;

    const channelItems = posts.map(post => this.buildRSSItem(post, baseUrl)).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
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
      <url>${baseUrl}/favicon.ico</url>
      <title>uAI by Up Arrow Inc - Technology Insights &amp; Business Strategy</title>
      <link>${baseUrl}</link>
      <width>16</width>
      <height>16</height>
      <description>uAI by Up Arrow Inc - Technology Intelligence Hub</description>
    </image>
    <itunes:image href="${baseUrl}/favicon.ico" />
    <itunes:category text="Technology" />
    <itunes:explicit>no</itunes:explicit>
    <itunes:email>info@uparrowinc.com</itunes:email>
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
    const postUrl = `${baseUrl}/blog/post/${post.slug}`;
    const pubDate = post.publishedAt 
      ? new Date(post.publishedAt).toUTCString() 
      : new Date().toUTCString();
    
    // Clean content for RSS (remove markdown, limit length)
    const cleanContent = this.sanitizeContentForRSS(post.content);
    const description = post.excerpt || cleanContent.substring(0, 300) + '...';
    
    // Extract categories from tags
    const categories = post.tags 
      ? post.tags.split(',').map(tag => `    <category><![CDATA[${tag.trim()}]]></category>`).join('\n')
      : '';

    // Extract audio enclosure for podcast RSS support
    const audioMatch = post.content.match(/\[audio:([^\]]+)\]/);
    let enclosureTag = '';
    let itunesElements = '';
    
    if (audioMatch) {
      const audioUrl = audioMatch[1];
      const isHostedAudio = audioUrl.startsWith('/') || audioUrl.includes('localhost') || audioUrl.includes('.replit.app');
      const fullAudioUrl = isHostedAudio 
        ? (audioUrl.startsWith('/') ? `${baseUrl}${audioUrl}` : audioUrl)
        : audioUrl;
      
      // Estimate file size (placeholder - could be enhanced with actual file stats)
      const estimatedSize = '25000000'; // 25MB default for podcast episodes
      
      enclosureTag = `      <enclosure url="${fullAudioUrl}" length="${estimatedSize}" type="audio/mpeg"/>`;
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
      <author>info@uparrowinc.com (${post.author})</author>
${categories}
${enclosureTag}
${itunesElements}
    </item>`;
  }

  private sanitizeContentForRSS(content: string): string {
    // Convert markdown to properly formatted HTML for RSS readers (CDATA compatible)
    let htmlContent = content;
    
    // Convert headers to HTML (preserve line structure)
    htmlContent = htmlContent
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Convert emphasis to HTML (do this before lists to avoid conflicts)
    htmlContent = htmlContent
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>') // Italic (not part of **)
      .replace(/(?<!_)_([^_\n]+?)_(?!_)/g, '<em>$1</em>'); // Underscore italic
    
    // Convert images to HTML
    htmlContent = htmlContent
      .replace(/!\[([^\]]*)\]\(([^\)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;" />');
    
    // Convert links to HTML
    htmlContent = htmlContent
      .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>');
    
    // Handle horizontal rules
    htmlContent = htmlContent
      .replace(/^---+$/gm, '<hr />')
      .replace(/^===+$/gm, '<hr />');
    
    // Convert bullet points and numbered lists to HTML
    const lines = htmlContent.split('\n');
    const processedLines: string[] = [];
    let inUnorderedList = false;
    let inOrderedList = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Check for unordered list items
      if (trimmedLine.match(/^[•\-\*]\s+/)) {
        if (!inUnorderedList) {
          if (inOrderedList) {
            processedLines.push('</ol>');
            inOrderedList = false;
          }
          processedLines.push('<ul>');
          inUnorderedList = true;
        }
        const listText = trimmedLine.replace(/^[•\-\*]\s+/, '');
        processedLines.push(`<li>${listText}</li>`);
      }
      // Check for ordered list items
      else if (trimmedLine.match(/^\d+\.\s+/)) {
        if (!inOrderedList) {
          if (inUnorderedList) {
            processedLines.push('</ul>');
            inUnorderedList = false;
          }
          processedLines.push('<ol>');
          inOrderedList = true;
        }
        const listText = trimmedLine.replace(/^\d+\.\s+/, '');
        processedLines.push(`<li>${listText}</li>`);
      }
      // Regular line
      else {
        if (inUnorderedList) {
          processedLines.push('</ul>');
          inUnorderedList = false;
        }
        if (inOrderedList) {
          processedLines.push('</ol>');
          inOrderedList = false;
        }
        processedLines.push(line);
      }
    }
    
    // Close any remaining lists
    if (inUnorderedList) processedLines.push('</ul>');
    if (inOrderedList) processedLines.push('</ol>');
    
    htmlContent = processedLines.join('\n');
    
    // Handle code blocks and inline code
    htmlContent = htmlContent
      .replace(/```[\s\S]*?```/g, '<pre><code>[Technical Code Example]</code></pre>')
      .replace(/`([^`\n]+)`/g, '<code>$1</code>');
    
    // Handle media embeds with HTML formatting
    htmlContent = htmlContent
      .replace(/\[video:([^\]]+)\]/g, '<p><strong>🎥 Video Content Available:</strong> <a href="$1">Watch Video</a></p>')
      .replace(/\[audio:([^\]]+)\]/g, '<p><strong>🎵 Audio Content Available:</strong> <a href="$1">Listen to Audio</a></p>')
      .replace(/\[youtube:([^\]]+)\]/g, '<p><strong>📺 YouTube Video:</strong> <a href="https://youtube.com/watch?v=$1">Watch Here</a></p>')
      .replace(/\[rumble:([^\]]+)\]/g, '<p><strong>📹 Rumble Video:</strong> <a href="https://rumble.com/$1">Watch Here</a></p>');
    
    // Convert paragraphs (split by double line breaks)
    const sections = htmlContent.split('\n\n');
    const formattedSections = sections.map(section => {
      const trimmed = section.trim();
      if (!trimmed) return '';
      
      // Skip if already wrapped in HTML block tags
      if (trimmed.match(/^<(h[1-6]|ul|ol|pre|hr|img|p)\b/)) {
        return trimmed;
      }
      
      // Handle single lines that don't contain HTML
      if (!trimmed.includes('<') && !trimmed.includes('\n')) {
        return `<p>${trimmed}</p>`;
      }
      
      // For multi-line content or content with some HTML, wrap carefully
      const cleanedSection = trimmed.replace(/\n(?!<)/g, '<br>');
      return `<p>${cleanedSection}</p>`;
    }).filter(p => p.length > 0);
    
    // Clean up the final HTML
    let cleanedContent = formattedSections.join('\n\n');
    
    // Fix common HTML issues
    cleanedContent = cleanedContent
      .replace(/<p><\/p>/g, '') // Remove empty paragraphs
      .replace(/<p>\s*<\/p>/g, '') // Remove whitespace-only paragraphs
      .replace(/<p>(<h[1-6][^>]*>.*?<\/h[1-6]>)<\/p>/g, '$1') // Remove paragraphs around headers
      .replace(/<p>(<ul>.*?<\/ul>)<\/p>/gs, '$1') // Remove paragraphs around lists
      .replace(/<p>(<ol>.*?<\/ol>)<\/p>/gs, '$1') // Remove paragraphs around ordered lists
      .replace(/<p>(<hr\s*\/?>)<\/p>/g, '$1') // Remove paragraphs around horizontal rules
      .replace(/<p>(<img[^>]*>)<\/p>/g, '$1') // Remove paragraphs around images
      .replace(/\n{3,}/g, '\n\n'); // Reduce excessive line breaks
    
    return cleanedContent;
  }

  async getRSSMetadata(req: Request, res: Response): Promise<void> {
    try {
      // Use the real blog storage to get published posts
      const posts = await blogStorage.getAllPosts(true); // published only
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      const metadata = {
        feedUrl: `${baseUrl}/api/rss`,
        feedTitle: 'uAI by Up Arrow Inc - Technology Insights & Business Strategy',
        feedDescription: 'Latest insights on technology consulting, AI integration, and business growth strategies',
        itemCount: posts.length,
        lastUpdated: posts[0]?.publishedAt || null,
        websiteUrl: `${baseUrl}`,
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