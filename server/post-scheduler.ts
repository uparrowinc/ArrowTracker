import cron from 'node-cron';
import { db } from './db';
import { blogPosts } from '@shared/blog-schema';
import { and, eq, lte, isNotNull, count, isNull } from 'drizzle-orm';

/**
 * Post Scheduler Service
 * Automatically publishes scheduled posts when their time arrives
 */
export class PostScheduler {
  private isRunning = false;

  /**
   * Initialize the scheduler to run every minute
   */
  start() {
    if (this.isRunning) {
      console.log('Post scheduler already running');
      return;
    }

    console.log('🕐 Starting post scheduler...');
    
    // Run every minute to check for posts to publish
    cron.schedule('* * * * *', async () => {
      await this.publishScheduledPosts();
    });

    this.isRunning = true;
    console.log('✅ Post scheduler started - checking every minute');
  }

  /**
   * Check for and publish posts scheduled for now or earlier
   */
  async publishScheduledPosts() {
    try {
      const now = new Date();
      
      // Find unpublished posts with scheduled_for <= now
      const scheduledPosts = await db
        .select()
        .from(blogPosts)
        .where(
          and(
            eq(blogPosts.published, false),
            isNotNull(blogPosts.scheduledFor),
            lte(blogPosts.scheduledFor, now)
          )
        );

      if (scheduledPosts.length === 0) {
        return; // No posts to publish
      }

      console.log(`📅 Publishing ${scheduledPosts.length} scheduled posts...`);

      // Publish each scheduled post
      for (const post of scheduledPosts) {
        await db
          .update(blogPosts)
          .set({
            published: true,
            publishedAt: now,
            updatedAt: now,
            scheduledFor: null // Clear the schedule
          })
          .where(eq(blogPosts.id, post.id));

        console.log(`✅ Published: "${post.title}" (scheduled for ${post.scheduledFor})`);
      }

      // Trigger sitemap update after publishing
      if (scheduledPosts.length > 0) {
        const { sitemapService } = await import('./sitemap');
        sitemapService.updateSitemapForNewPost().catch(err => 
          console.error('Failed to update sitemap after scheduled publish:', err)
        );
      }

    } catch (error) {
      console.error('❌ Error in post scheduler:', error);
    }
  }

  /**
   * Get all scheduled posts for admin view
   */
  async getScheduledPosts() {
    return await db
      .select()
      .from(blogPosts)
      .where(
        and(
          eq(blogPosts.published, false),
          isNotNull(blogPosts.scheduledFor)
        )
      )
      .orderBy(blogPosts.scheduledFor);
  }

  /**
   * Cancel a scheduled post (remove scheduling, keep as draft)
   */
  async cancelScheduledPost(postId: number) {
    const [post] = await db
      .update(blogPosts)
      .set({
        scheduledFor: null,
        updatedAt: new Date()
      })
      .where(eq(blogPosts.id, postId))
      .returning();

    return post;
  }

  /**
   * Reschedule a post for a different time
   */
  async reschedulePost(postId: number, newScheduleDate: Date) {
    const [post] = await db
      .update(blogPosts)
      .set({
        scheduledFor: newScheduleDate,
        published: false, // Ensure it's not published
        updatedAt: new Date()
      })
      .where(eq(blogPosts.id, postId))
      .returning();

    return post;
  }

  /**
   * Get scheduling statistics
   */
  async getSchedulingStats() {
    const [scheduled] = await db
      .select({ count: count() })
      .from(blogPosts)
      .where(
        and(
          eq(blogPosts.published, false),
          isNotNull(blogPosts.scheduledFor)
        )
      );

    const [published] = await db
      .select({ count: count() })
      .from(blogPosts)
      .where(eq(blogPosts.published, true));

    const [drafts] = await db
      .select({ count: count() })
      .from(blogPosts)
      .where(
        and(
          eq(blogPosts.published, false),
          isNull(blogPosts.scheduledFor)
        )
      );

    return {
      scheduled: scheduled.count,
      published: published.count,
      drafts: drafts.count,
      total: scheduled.count + published.count + drafts.count
    };
  }
}

// Export singleton instance
export const postScheduler = new PostScheduler();