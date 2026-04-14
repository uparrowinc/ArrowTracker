import { db } from "./db";
import { 
  blogPosts, 
  blogCategories, 
  blogComments, 
  blogMedia,
  type BlogPost,
  type InsertBlogPost,
  type BlogCategory,
  type InsertBlogCategory,
  type BlogComment,
  type InsertBlogComment,
  type BlogMedia,
  type InsertBlogMedia,
  type BlogPostWithDetails
} from "@shared/blog-schema";
import { eq, desc, like, and, sql, count, or, isNull, lte, gte } from "drizzle-orm";

export class BlogStorage {
  
  // Blog Posts
  async getAllPosts(published: boolean = true): Promise<BlogPostWithDetails[]> {
    const now = new Date();
    let query;
    
    if (published) {
      // Only show published posts where scheduled_for is null or in the past
      query = and(
        eq(blogPosts.published, true),
        or(
          isNull(blogPosts.scheduledFor),
          lte(blogPosts.scheduledFor, now)
        )
      );
    } else {
      query = undefined; // Show all posts for admin
    }
      
    const posts = await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        excerpt: blogPosts.excerpt,
        content: blogPosts.content,
        featuredImage: blogPosts.featuredImage,
        audioUrl: blogPosts.audioUrl,
        audioDuration: blogPosts.audioDuration,
        audioTitle: blogPosts.audioTitle,
        postType: blogPosts.postType,
        category: blogPosts.category,
        subcategory: blogPosts.subcategory,
        author: blogPosts.author,
        published: blogPosts.published,
        publishedAt: blogPosts.publishedAt,
        createdAt: blogPosts.createdAt,
        updatedAt: blogPosts.updatedAt,
        tags: blogPosts.tags,
        metaDescription: blogPosts.metaDescription,
        readingTime: blogPosts.readingTime,
        commentCount: sql<number>`cast(count(${blogComments.id}) as int)`,
      })
      .from(blogPosts)
      .leftJoin(blogComments, eq(blogPosts.id, blogComments.postId))
      .where(query)
      .groupBy(blogPosts.id)
      .orderBy(desc(blogPosts.publishedAt));
      
    return posts.map(post => ({
      ...post,
      commentCount: 0,
      seoTitle: post.metaDescription || post.title,
      scheduledFor: null
    })) as unknown as BlogPostWithDetails[];
  }
  
  async getPostBySlug(slug: string): Promise<BlogPostWithDetails | undefined> {
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug));
      
    if (!post) return undefined;
    
    const comments = await this.getPostComments(post.id, true);
    
    return {
      ...post,
      comments,
      commentCount: comments.length,
      audioUrl: post.audioUrl || null,
      audioDuration: post.audioDuration || null,
      audioTitle: post.audioTitle || null,
      postType: post.postType || 'blog'
    } as unknown as BlogPostWithDetails;
  }
  
  async createPost(postData: InsertBlogPost): Promise<BlogPost> {
    try {
      // Generate slug from title if not provided
      if (!postData.slug) {
        postData.slug = this.generateSlug(postData.title);
      }
      
      // Calculate reading time
      if (!postData.readingTime) {
        postData.readingTime = this.calculateReadingTime(postData.content);
      }
      
      // Handle publishing and scheduling logic
      if (postData.published) {
        // If scheduling for future, set scheduledFor and don't publish immediately
        if (postData.scheduledFor && new Date(postData.scheduledFor) > new Date()) {
          postData.published = false; // Don't publish yet
        } else if (!postData.publishedAt) {
          // Publishing immediately, set publishedAt
          postData.publishedAt = new Date();
        }
      }
      
      // Clean up date fields - remove invalid dates or convert strings to null
      // Drizzle doesn't handle mixed types well, so we'll be more explicit
      if (postData.publishedAt !== undefined) {
        if (typeof postData.publishedAt === 'string') {
          const parsed = new Date(postData.publishedAt);
          if (isNaN(parsed.getTime())) {
            postData.publishedAt = null; // Set to null instead of deleting
          } else {
            postData.publishedAt = parsed;
          }
        } else if (!(postData.publishedAt instanceof Date)) {
          postData.publishedAt = null;
        }
      }
      
      if (postData.scheduledFor !== undefined) {
        if (typeof postData.scheduledFor === 'string') {
          const parsed = new Date(postData.scheduledFor);
          if (isNaN(parsed.getTime())) {
            postData.scheduledFor = null;
          } else {
            postData.scheduledFor = parsed;
          }
        } else if (!(postData.scheduledFor instanceof Date)) {
          postData.scheduledFor = null;
        }
      }
      
      // Debug logging for date issues
      console.log('Creating post with data:', {
        ...postData,
        publishedAt: postData.publishedAt ? { 
          value: postData.publishedAt, 
          type: typeof postData.publishedAt,
          isDate: postData.publishedAt instanceof Date,
          valid: postData.publishedAt instanceof Date ? !isNaN(postData.publishedAt.getTime()) : 'N/A'
        } : null,
        scheduledFor: postData.scheduledFor ? { 
          value: postData.scheduledFor, 
          type: typeof postData.scheduledFor,
          isDate: postData.scheduledFor instanceof Date,
          valid: postData.scheduledFor instanceof Date ? !isNaN(postData.scheduledFor.getTime()) : 'N/A'
        } : null
      });
      
      const [post] = await db
        .insert(blogPosts)
        .values(postData)
        .returning();
        
      console.log('Created post:', post);
      return post;
    } catch (error) {
      console.error('Blog storage createPost error:', error);
      throw error;
    }
  }
  
  async updatePost(id: number, postData: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    try {
      console.log('BlogStorage updatePost called with:', { 
        id, 
        postData,
        publishedAt: postData.publishedAt ? {
          value: postData.publishedAt,
          type: typeof postData.publishedAt
        } : null,
        scheduledFor: postData.scheduledFor ? {
          value: postData.scheduledFor,
          type: typeof postData.scheduledFor
        } : null
      });
      
      // Update reading time if content changed
      if (postData.content) {
        postData.readingTime = this.calculateReadingTime(postData.content);
      }
      
      // Convert date strings to Date objects
      if (postData.publishedAt && typeof postData.publishedAt === 'string') {
        postData.publishedAt = new Date(postData.publishedAt);
      }
      
      if (postData.scheduledFor && typeof postData.scheduledFor === 'string') {
        postData.scheduledFor = new Date(postData.scheduledFor);
      }
      
      // Set published date if publishing for first time
      if (postData.published && !postData.publishedAt) {
        postData.publishedAt = new Date();
      }
      
      // Filter out read-only fields that shouldn't be updated
      const { id: _, createdAt: __, ...updateFields } = postData as any;
      
      const updateData = {
        ...updateFields,
        updatedAt: new Date()
      };
      
      console.log('Updating with data:', updateData);
      
      const [post] = await db
        .update(blogPosts)
        .set(updateData)
        .where(eq(blogPosts.id, id))
        .returning();
        
      console.log('Updated post:', post);
      return post;
    } catch (error) {
      console.error('Blog storage updatePost error:', error);
      throw error;
    }
  }
  
  async deletePost(id: number): Promise<boolean> {
    const result = await db
      .delete(blogPosts)
      .where(eq(blogPosts.id, id));
      
    return (result as any)?.changes > 0;
  }
  
  async searchPosts(query: string): Promise<BlogPostWithDetails[]> {
    try {
      const now = new Date();
      const searchTerm = `%${query.toLowerCase()}%`;
      
      console.log(`🔍 BlogStorage: Searching for "${query}" with term "${searchTerm}"`);
      
      // Enhanced search with case-insensitive ILIKE for better partial matching
      const posts = await db
        .select()
        .from(blogPosts)
        .where(
          and(
            eq(blogPosts.published, true),
            or(
              isNull(blogPosts.scheduledFor),
              lte(blogPosts.scheduledFor, now)
            ),
            or(
              sql`LOWER(${blogPosts.title}) LIKE LOWER(${searchTerm})`,
              sql`LOWER(${blogPosts.content}) LIKE LOWER(${searchTerm})`,
              sql`LOWER(${blogPosts.excerpt}) LIKE LOWER(${searchTerm})`,
              sql`LOWER(${blogPosts.tags}) LIKE LOWER(${searchTerm})`,
              sql`LOWER(${blogPosts.author}) LIKE LOWER(${searchTerm})`
            )
          )
        )
        .orderBy(desc(blogPosts.publishedAt));
        
      console.log(`🔍 BlogStorage: Found ${posts.length} posts`);
      
      return posts.map(post => ({
        ...post,
        commentCount: 0
      })) as unknown as BlogPostWithDetails[];
    } catch (error) {
      console.error('BlogStorage searchPosts error:', error);
      throw error;
    }
  }
  
  // Categories
  async getAllCategories(): Promise<BlogCategory[]> {
    return await db
      .select()
      .from(blogCategories)
      .orderBy(blogCategories.name);
  }
  
  async createCategory(categoryData: InsertBlogCategory): Promise<BlogCategory> {
    if (!categoryData.slug) {
      categoryData.slug = this.generateSlug(categoryData.name);
    }
    
    const [category] = await db
      .insert(blogCategories)
      .values(categoryData)
      .returning();
      
    return category;
  }
  
  // Comments
  async getPostComments(postId: number, approvedOnly: boolean = true): Promise<BlogComment[]> {
    const query = approvedOnly 
      ? and(eq(blogComments.postId, postId), eq(blogComments.approved, true))
      : eq(blogComments.postId, postId);
      
    return await db
      .select()
      .from(blogComments)
      .where(query)
      .orderBy(desc(blogComments.createdAt));
  }
  
  async createComment(commentData: InsertBlogComment): Promise<BlogComment> {
    const [comment] = await db
      .insert(blogComments)
      .values(commentData)
      .returning();
      
    return comment;
  }
  
  async approveComment(id: number): Promise<BlogComment | undefined> {
    const [comment] = await db
      .update(blogComments)
      .set({ approved: true })
      .where(eq(blogComments.id, id))
      .returning();
      
    return comment;
  }
  
  // Media Management
  async uploadMedia(mediaData: InsertBlogMedia): Promise<BlogMedia> {
    const [media] = await db
      .insert(blogMedia)
      .values(mediaData)
      .returning();
      
    return media;
  }
  
  async getAllMedia(): Promise<BlogMedia[]> {
    return await db
      .select()
      .from(blogMedia)
      .orderBy(desc(blogMedia.uploadedAt));
  }
  
  async deleteMedia(id: number): Promise<boolean> {
    const result = await db
      .delete(blogMedia)
      .where(eq(blogMedia.id, id));
      
    return (result as any)?.changes > 0;
  }
  
  // Utility functions
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  private calculateReadingTime(content: string): string {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  }
  
  // Analytics
  async getBlogStats() {
    const [totalPosts] = await db
      .select({ count: count() })
      .from(blogPosts);
      
    const [publishedPosts] = await db
      .select({ count: count() })
      .from(blogPosts)
      .where(eq(blogPosts.published, true));
      
    const [totalComments] = await db
      .select({ count: count() })
      .from(blogComments);
      
    const [recentPosts] = await db
      .select({ count: count() })
      .from(blogPosts)
      .where(sql`created_at > (strftime('%s', 'now') - 30 * 86400) * 1000`);
      
    return {
      totalPosts: totalPosts.count,
      publishedPosts: publishedPosts.count,
      totalComments: totalComments.count,
      recentPosts: recentPosts.count
    };
  }
}

export const blogStorage = new BlogStorage();