import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Services schema
export const services = sqliteTable("services", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  link: text("link").notNull(),
});

export const insertServiceSchema = createInsertSchema(services).pick({
  title: true,
  description: true,
  imageUrl: true,
  link: true,
});

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

// Testimonials schema
export const testimonials = sqliteTable("testimonials", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  content: text("content").notNull(),
  authorName: text("author_name").notNull(),
  authorTitle: text("author_title").notNull(),
  authorImageUrl: text("author_image_url").notNull(),
  rating: integer("rating").notNull(),
});

export const insertTestimonialSchema = createInsertSchema(testimonials).pick({
  content: true,
  authorName: true,
  authorTitle: true,
  authorImageUrl: true,
  rating: true,
});

export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
export type Testimonial = typeof testimonials.$inferSelect;

// Team Members schema
export const teamMembers = sqliteTable("team_members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  title: text("title").notNull(),
  bio: text("bio").notNull(),
  imageUrl: text("image_url").notNull(),
  linkedinUrl: text("linkedin_url"),
  twitterUrl: text("twitter_url"),
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).pick({
  name: true,
  title: true,
  bio: true,
  imageUrl: true,
  linkedinUrl: true,
  twitterUrl: true,
});

export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;

// Contact form schema
export const contactFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  serviceInterest: z.string().min(1, "Please select a service"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

// Contact submissions table for database storage
export const contactSubmissions = sqliteTable("contact_submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  firstName: text("first_name", { length: 100 }).notNull(),
  lastName: text("last_name", { length: 100 }).notNull(),
  email: text("email", { length: 255 }).notNull(),
  company: text("company", { length: 255 }),
  serviceInterest: text("service_interest", { length: 100 }).notNull(),
  message: text("message").notNull(),
  status: text("status", { length: 20 }).default("new"),
  createdAt: integer("created_at", { mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
  ipAddress: text("ip_address", { length: 45 }),
  emailSent: integer("email_sent", { mode: 'boolean' }).default(false),
});

export const insertContactSubmissionSchema = createInsertSchema(contactSubmissions).omit({
  id: true,
  createdAt: true,
  status: true,
  emailSent: true,
});

export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = z.infer<typeof insertContactSubmissionSchema>;

// Re-export blog schema (blog tables are defined in blog-schema.ts only)
export { blogPosts, blogCategories, blogComments, blogMedia, insertBlogPostSchema, insertBlogCategorySchema, insertBlogCommentSchema, insertBlogMediaSchema } from "./blog-schema";
export type { BlogPost, InsertBlogPost, BlogCategory, InsertBlogCategory, BlogComment, InsertBlogComment, BlogMedia, InsertBlogMedia, BlogPostWithDetails } from "./blog-schema";

// Email subscribers table  
export const emailSubscribers = sqliteTable("email_subscribers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email", { length: 255 }).unique().notNull(),
  name: text("name", { length: 100 }),
  subscribed: integer("subscribed", { mode: 'boolean' }).default(true),
  subscribedAt: integer("subscribed_at", { mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
  unsubscribedAt: integer("unsubscribed_at", { mode: 'timestamp_ms' }),
  source: text("source", { length: 50 }).default("blog"),
});

// Media uploads table
export const mediaUploads = sqliteTable("media_uploads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  filename: text("filename", { length: 255 }).notNull(),
  originalName: text("original_name", { length: 255 }).notNull(),
  mimeType: text("mime_type", { length: 100 }).notNull(),
  size: integer("size").notNull(),
  path: text("path", { length: 500 }).notNull(),
  altText: text("alt_text", { length: 255 }),
  uploadedAt: integer("uploaded_at", { mode: 'timestamp_ms' }).$defaultFn(() => new Date()),
});

export const emailSubscriberSchema = createInsertSchema(emailSubscribers).omit({
  id: true,
  subscribedAt: true,
});

export type EmailSubscriber = typeof emailSubscribers.$inferSelect;
export type InsertEmailSubscriber = z.infer<typeof emailSubscriberSchema>;
export type MediaUpload = typeof mediaUploads.$inferSelect;
