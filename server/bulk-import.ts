import { blogStorage } from './blog-storage';
import type { InsertBlogPost } from '@shared/blog-schema';

/**
 * Bulk Import Service for Blog Posts
 * Allows importing large numbers of past posts efficiently
 */
export class BulkImportService {

  /**
   * Import multiple blog posts with progress tracking
   */
  async importPosts(posts: BulkPostData[]): Promise<BulkImportResult> {
    const results: BulkImportResult = {
      total: posts.length,
      successful: 0,
      failed: 0,
      errors: [],
      imported: []
    };

    console.log(`📥 Starting bulk import of ${posts.length} posts...`);

    for (let i = 0; i < posts.length; i++) {
      const postData = posts[i];
      
      try {
        // Convert bulk data to proper insert format
        const insertData: InsertBlogPost = {
          title: postData.title,
          content: postData.content,
          excerpt: postData.excerpt || null,
          author: postData.author || 'Up Arrow Inc',
          published: postData.published !== false, // Default to true
          publishedAt: postData.publishedAt ? new Date(postData.publishedAt) : new Date(),
          scheduledFor: postData.scheduledFor ? new Date(postData.scheduledFor) : null,
          tags: Array.isArray(postData.tags) ? postData.tags.join(', ') : postData.tags || null,
          metaDescription: postData.metaDescription || null,
          featuredImage: postData.featuredImage || null,
          audioUrl: postData.audioUrl || null,
          audioDuration: postData.audioDuration || null,
          audioTitle: postData.audioTitle || null,
          postType: postData.postType || 'article',
          slug: postData.slug || '',
          category: postData.category || 'general',
          subcategory: postData.subcategory || null
        };

        const createdPost = await blogStorage.createPost(insertData);
        results.successful++;
        results.imported.push({
          index: i + 1,
          title: postData.title,
          slug: createdPost.slug,
          id: createdPost.id
        });

        // Progress update every 10 posts
        if ((i + 1) % 10 === 0) {
          console.log(`📝 Imported ${i + 1}/${posts.length} posts...`);
        }

      } catch (error) {
        results.failed++;
        results.errors.push({
          index: i + 1,
          title: postData.title,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        console.error(`❌ Failed to import post ${i + 1}: ${postData.title}`, error);
      }
    }

    console.log(`✅ Bulk import complete: ${results.successful} successful, ${results.failed} failed`);
    return results;
  }

  /**
   * Import posts from JSON file
   */
  async importFromJson(jsonData: string): Promise<BulkImportResult> {
    try {
      const posts = JSON.parse(jsonData) as BulkPostData[];
      
      if (!Array.isArray(posts)) {
        throw new Error('JSON data must be an array of posts');
      }

      return await this.importPosts(posts);
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create sample historical posts for testing
   */
  generateSamplePosts(count: number = 50): BulkPostData[] {
    const posts: BulkPostData[] = [];
    const currentDate = new Date();
    
    const sampleTitles = [
      'The Future of AI in Business Operations',
      'Cybersecurity Best Practices for Remote Teams',
      'Cloud Migration: A Step-by-Step Guide',
      'Data Analytics: Turning Numbers into Insights',
      'Digital Transformation Success Stories',
      'Mobile App Development Trends',
      'Blockchain Technology Beyond Cryptocurrency',
      'IoT Solutions for Manufacturing',
      'Machine Learning in Healthcare',
      'E-commerce Platform Optimization',
      'DevOps Culture and Implementation',
      'API Design Best Practices',
      'Database Performance Optimization',
      'User Experience Design Principles',
      'Agile Project Management Strategies'
    ];

    const sampleAuthors = [
      'Michael Foster',
      'Sarah Chen',
      'David Rodriguez',
      'Emily Johnson',
      'Alex Thompson',
      'Up Arrow Inc Team'
    ];

    const postTypes = ['article', 'podcast', 'radio', 'guide'];

    for (let i = 0; i < count; i++) {
      // Generate dates going back up to 2 years
      const daysBack = Math.floor(Math.random() * 730); // Random date within 2 years
      const publishDate = new Date(currentDate);
      publishDate.setDate(publishDate.getDate() - daysBack);

      const titleIndex = Math.floor(Math.random() * sampleTitles.length);
      const title = `${sampleTitles[titleIndex]} ${i + 1}`;
      
      posts.push({
        title,
        content: this.generateSampleContent(title),
        excerpt: `Discover ${title.toLowerCase()} and how it can transform your business operations.`,
        author: sampleAuthors[Math.floor(Math.random() * sampleAuthors.length)],
        published: true,
        publishedAt: publishDate.toISOString(),
        tags: this.generateRandomTags(),
        postType: postTypes[Math.floor(Math.random() * postTypes.length)] as any,
        metaDescription: `Learn about ${title.toLowerCase()} with practical insights and expert recommendations.`
      });
    }

    return posts.sort((a, b) => 
      new Date(a.publishedAt!).getTime() - new Date(b.publishedAt!).getTime()
    );
  }

  private generateSampleContent(title: string): string {
    return `# ${title}

In today's rapidly evolving business landscape, understanding ${title.toLowerCase()} has become crucial for organizations looking to stay competitive and innovative.

## Key Benefits

- **Improved Efficiency**: Streamline operations and reduce manual overhead
- **Cost Optimization**: Maximize ROI through strategic implementation
- **Scalability**: Build systems that grow with your business needs
- **Competitive Advantage**: Stay ahead of industry trends and changes

## Implementation Strategy

### Phase 1: Assessment and Planning
Before diving into implementation, it's essential to assess your current infrastructure and identify areas for improvement. This involves:

1. **Current State Analysis**: Document existing processes and systems
2. **Gap Identification**: Determine what needs to be improved or replaced
3. **Resource Planning**: Allocate budget and team members for the project
4. **Timeline Development**: Create realistic milestones and deadlines

### Phase 2: Execution and Testing
The implementation phase requires careful coordination and thorough testing:

- **Development Environment Setup**: Prepare isolated testing environments
- **Incremental Rollout**: Deploy changes in manageable phases
- **Quality Assurance**: Test all functionality before production deployment
- **User Training**: Ensure team members are prepared for new systems

### Phase 3: Monitoring and Optimization
Post-implementation monitoring is crucial for long-term success:

- **Performance Metrics**: Track key indicators and benchmarks
- **User Feedback**: Gather insights from end users and stakeholders
- **Continuous Improvement**: Make iterative enhancements based on data
- **Documentation**: Maintain comprehensive records for future reference

## Best Practices

1. **Start Small**: Begin with pilot projects to validate approaches
2. **Involve Stakeholders**: Ensure all relevant parties are engaged throughout
3. **Plan for Change**: Build flexibility into your implementation strategy
4. **Measure Success**: Define clear metrics and regularly assess progress

## Conclusion

Successful implementation of ${title.toLowerCase()} requires careful planning, methodical execution, and ongoing optimization. By following these guidelines and adapting them to your specific organizational needs, you can achieve significant improvements in efficiency and effectiveness.

---

*Ready to get started? Contact our consulting team for personalized guidance and support.*`;
  }

  private generateRandomTags(): string {
    const allTags = [
      'technology', 'business', 'AI', 'automation', 'cloud', 'cybersecurity',
      'analytics', 'digital-transformation', 'mobile', 'blockchain', 'IoT',
      'machine-learning', 'ecommerce', 'devops', 'api', 'database', 'UX',
      'agile', 'consulting', 'strategy', 'innovation', 'productivity'
    ];
    
    const numTags = Math.floor(Math.random() * 4) + 2; // 2-5 tags
    const selectedTags: string[] = [];
    
    for (let i = 0; i < numTags; i++) {
      const tag = allTags[Math.floor(Math.random() * allTags.length)];
      if (!selectedTags.includes(tag)) {
        selectedTags.push(tag);
      }
    }
    
    return selectedTags.join(', ');
  }
}

// Types for bulk import
export interface BulkPostData {
  title: string;
  content: string;
  excerpt?: string;
  author?: string;
  published?: boolean;
  publishedAt?: string; // ISO date string
  scheduledFor?: string; // ISO date string for future posts
  tags?: string | string[];
  metaDescription?: string;
  featuredImage?: string;
  audioUrl?: string;
  audioDuration?: string;
  audioTitle?: string;
  postType?: 'article' | 'podcast' | 'radio' | 'guide';
  slug?: string;
  category?: string;
  subcategory?: string;
}

export interface BulkImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{
    index: number;
    title: string;
    error: string;
  }>;
  imported: Array<{
    index: number;
    title: string;
    slug: string;
    id: number;
  }>;
}

export const bulkImportService = new BulkImportService();