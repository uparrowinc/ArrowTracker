import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Blog posts table
export const blogPosts = sqliteTable("blog_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title", { length: 255 }).notNull(),
  slug: text("slug", { length: 255 }).unique().notNull(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  featuredImage: text("featured_image", { length: 500 }),
  audioUrl: text("audio_url", { length: 500 }),
  audioDuration: text("audio_duration", { length: 20 }),
  audioTitle: text("audio_title", { length: 255 }),
  postType: text("post_type", { length: 20 }).default("article"),
  category: text("category", { length: 50 }).default("general"),
  subcategory: text("subcategory", { length: 50 }),
  author: text("author", { length: 100 }).default("Up Arrow Inc"),
  published: integer("published", { mode: 'boolean' }).default(false),
  publishedAt: integer("published_at", { mode: 'timestamp_ms' }),
  scheduledFor: integer("scheduled_for", { mode: 'timestamp_ms' }),
  createdAt: integer("created_at", { mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
  tags: text("tags", { length: 500 }),
  metaDescription: text("meta_description", { length: 160 }),
  readingTime: text("reading_time", { length: 20 }),
});

// Blog categories table
export const blogCategories = sqliteTable("blog_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name", { length: 100 }).notNull(),
  slug: text("slug", { length: 100 }).unique().notNull(),
  description: text("description"),
  color: text("color", { length: 7 }).default("#3B82F6"),
  createdAt: integer("created_at", { mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
});

// Blog comments table
export const blogComments = sqliteTable("blog_comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id").references(() => blogPosts.id),
  name: text("name", { length: 100 }).notNull(),
  email: text("email", { length: 255 }).notNull(),
  content: text("content").notNull(),
  approved: integer("approved", { mode: 'boolean' }).default(false),
  createdAt: integer("created_at", { mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
});

// Blog images/media table
export const blogMedia = sqliteTable("blog_media", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  filename: text("filename", { length: 255 }).notNull(),
  originalName: text("original_name", { length: 255 }).notNull(),
  mimeType: text("mime_type", { length: 100 }).notNull(),
  size: text("size", { length: 20 }).notNull(),
  path: text("path", { length: 500 }).notNull(),
  altText: text("alt_text", { length: 255 }),
  caption: text("caption"),
  uploadedAt: integer("uploaded_at", { mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
});

// Zod schemas for validation
export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertBlogCategorySchema = createInsertSchema(blogCategories).omit({ 
  id: true, 
  createdAt: true 
});

export const insertBlogCommentSchema = createInsertSchema(blogComments).omit({ 
  id: true, 
  createdAt: true,
  approved: true 
});

export const insertBlogMediaSchema = createInsertSchema(blogMedia).omit({ 
  id: true, 
  uploadedAt: true 
});

// TypeScript types
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogCategory = typeof blogCategories.$inferSelect;
export type InsertBlogCategory = z.infer<typeof insertBlogCategorySchema>;
export type BlogComment = typeof blogComments.$inferSelect;
export type InsertBlogComment = z.infer<typeof insertBlogCommentSchema>;
export type BlogMedia = typeof blogMedia.$inferSelect;
export type InsertBlogMedia = z.infer<typeof insertBlogMediaSchema>;

// Blog post with category and comments
export type BlogPostWithDetails = BlogPost & {
  category?: BlogCategory;
  commentCount?: number;
  comments?: BlogComment[];
};
