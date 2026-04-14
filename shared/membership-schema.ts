import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Member Users (separate from admin users)
export const members = sqliteTable("members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").unique().notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  password: text("password").notNull(),
  profileImage: text("profile_image"),
  phone: text("phone"),
  company: text("company"),
  jobTitle: text("job_title"),
  membershipTier: text("membership_tier").default("basic"),
  membershipStatus: text("membership_status").default("pending"),
  membershipStartDate: integer("membership_start_date", { mode: "timestamp" }),
  membershipEndDate: integer("membership_end_date", { mode: "timestamp" }),
  isApproved: integer("is_approved", { mode: "boolean" }).default(false),
  approvedBy: integer("approved_by"),
  approvedAt: integer("approved_at", { mode: "timestamp" }),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  paypalCustomerId: text("paypal_customer_id"),
  mfaEnabled: integer("mfa_enabled", { mode: "boolean" }).default(false),
  mfaSecret: text("mfa_secret"),
  mfaBackupCodes: text("mfa_backup_codes").default("[]"),
  preferredMfaMethod: text("preferred_mfa_method").default("authenticator"),
  phoneVerified: integer("phone_verified", { mode: "boolean" }).default(false),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false),
  lastMfaUsed: integer("last_mfa_used", { mode: "timestamp" }),
  failedMfaAttempts: integer("failed_mfa_attempts").default(0),
  mfaLockedUntil: integer("mfa_locked_until", { mode: "timestamp" }),
  hasTrainingAccess: integer("has_training_access", { mode: "boolean" }).default(false),
  hasTicketingAccess: integer("has_ticketing_access", { mode: "boolean" }).default(false),
  hasBillingAccess: integer("has_billing_access", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
});

export const membershipTiers = sqliteTable("membership_tiers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  currency: text("currency").default("USD"),
  billingInterval: text("billing_interval").default("monthly"),
  features: text("features"),
  maxCourses: integer("max_courses").default(-1),
  maxSupportTickets: integer("max_support_tickets").default(-1),
  priority: integer("priority").default(0),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  stripeProductId: text("stripe_product_id"),
  stripePriceId: text("stripe_price_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const courses = sqliteTable("courses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  shortDescription: text("short_description"),
  slug: text("slug").unique().notNull(),
  thumbnail: text("thumbnail"),
  introVideo: text("intro_video"),
  syllabus: text("syllabus"),
  instructor: text("instructor").notNull(),
  instructorBio: text("instructor_bio"),
  category: text("category"),
  difficulty: text("difficulty").default("beginner"),
  estimatedHours: integer("estimated_hours").default(0),
  requiredTier: text("required_tier").default("basic"),
  isPublished: integer("is_published", { mode: "boolean" }).default(false),
  isPremium: integer("is_premium", { mode: "boolean" }).default(false),
  price: real("price"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const courseModules = sqliteTable("course_modules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull(),
  isPublished: integer("is_published", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const courseLessons = sqliteTable("course_lessons", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  moduleId: integer("module_id").references(() => courseModules.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content"),
  videoUrl: text("video_url"),
  videoProvider: text("video_provider"),
  videoDuration: integer("video_duration"),
  audioUrl: text("audio_url"),
  attachments: text("attachments"),
  orderIndex: integer("order_index").notNull(),
  isPreview: integer("is_preview", { mode: "boolean" }).default(false),
  isPublished: integer("is_published", { mode: "boolean" }).default(true),
  estimatedMinutes: integer("estimated_minutes").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const memberEnrollments = sqliteTable("member_enrollments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberId: integer("member_id").references(() => members.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  enrolledAt: integer("enrolled_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  progressPercentage: integer("progress_percentage").default(0),
  certificateIssued: integer("certificate_issued", { mode: "boolean" }).default(false),
  certificateIssuedAt: integer("certificate_issued_at", { mode: "timestamp" }),
  lastAccessedAt: integer("last_accessed_at", { mode: "timestamp" }),
});

export const lessonProgress = sqliteTable("lesson_progress", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberId: integer("member_id").references(() => members.id).notNull(),
  lessonId: integer("lesson_id").references(() => courseLessons.id).notNull(),
  isCompleted: integer("is_completed", { mode: "boolean" }).default(false),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  watchTimeSeconds: integer("watch_time_seconds").default(0),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const supportTickets = sqliteTable("support_tickets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ticketNumber: text("ticket_number").unique().notNull(),
  memberId: integer("member_id").references(() => members.id).notNull(),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  priority: text("priority").default("medium"),
  status: text("status").default("open"),
  category: text("category"),
  assignedTo: integer("assigned_to"),
  assignedAt: integer("assigned_at", { mode: "timestamp" }),
  jiraTicketId: text("jira_ticket_id"),
  jiraUrl: text("jira_url"),
  resolvedAt: integer("resolved_at", { mode: "timestamp" }),
  resolutionNotes: text("resolution_notes"),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const ticketMessages = sqliteTable("ticket_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ticketId: integer("ticket_id").references(() => supportTickets.id).notNull(),
  senderId: integer("sender_id").notNull(),
  senderType: text("sender_type").notNull(),
  message: text("message").notNull(),
  attachments: text("attachments"),
  isInternal: integer("is_internal", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  invoiceNumber: text("invoice_number").unique().notNull(),
  memberId: integer("member_id").references(() => members.id).notNull(),
  description: text("description"),
  subtotal: real("subtotal").notNull(),
  taxAmount: real("tax_amount").default(0),
  discountAmount: real("discount_amount").default(0),
  totalAmount: real("total_amount").notNull(),
  currency: text("currency").default("USD"),
  status: text("status").default("pending"),
  dueDate: integer("due_date", { mode: "timestamp" }),
  paidAt: integer("paid_at", { mode: "timestamp" }),
  stripeInvoiceId: text("stripe_invoice_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  paypalOrderId: text("paypal_order_id"),
  paymentMethod: text("payment_method"),
  pdfPath: text("pdf_path"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const invoiceItems = sqliteTable("invoice_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  invoiceId: integer("invoice_id").references(() => invoices.id).notNull(),
  description: text("description").notNull(),
  quantity: integer("quantity").default(1),
  unitPrice: real("unit_price").notNull(),
  totalPrice: real("total_price").notNull(),
  courseId: integer("course_id").references(() => courses.id),
  membershipTierId: integer("membership_tier_id").references(() => membershipTiers.id),
});

export const memberSessions = sqliteTable("member_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("session_id").unique().notNull(),
  memberId: integer("member_id").references(() => members.id).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  lastAccessedAt: integer("last_accessed_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const certificates = sqliteTable("certificates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberId: integer("member_id").references(() => members.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  certificateNumber: text("certificate_number").unique().notNull(),
  issuedAt: integer("issued_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  pdfPath: text("pdf_path"),
  verificationCode: text("verification_code").unique(),
});

// Relations
export const membersRelations = relations(members, ({ many }) => ({
  enrollments: many(memberEnrollments),
  supportTickets: many(supportTickets),
  invoices: many(invoices),
  sessions: many(memberSessions),
  certificates: many(certificates),
  lessonProgress: many(lessonProgress),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  modules: many(courseModules),
  enrollments: many(memberEnrollments),
  certificates: many(certificates),
}));

export const courseModulesRelations = relations(courseModules, ({ one, many }) => ({
  course: one(courses, { fields: [courseModules.courseId], references: [courses.id] }),
  lessons: many(courseLessons),
}));

export const courseLessonsRelations = relations(courseLessons, ({ one, many }) => ({
  module: one(courseModules, { fields: [courseLessons.moduleId], references: [courseModules.id] }),
  progress: many(lessonProgress),
}));

export const supportTicketsRelations = relations(supportTickets, ({ one, many }) => ({
  member: one(members, { fields: [supportTickets.memberId], references: [members.id] }),
  messages: many(ticketMessages),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  member: one(members, { fields: [invoices.memberId], references: [members.id] }),
  items: many(invoiceItems),
}));

// Insert schemas
export const insertMemberSchema = createInsertSchema(members).omit({
  id: true, createdAt: true, updatedAt: true, lastLoginAt: true,
  membershipStartDate: true, membershipEndDate: true, approvedAt: true,
});
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true, ticketNumber: true, createdAt: true, updatedAt: true, assignedAt: true, resolvedAt: true,
});
export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true, invoiceNumber: true, createdAt: true, updatedAt: true, paidAt: true,
});
export const insertMembershipTierSchema = createInsertSchema(membershipTiers).omit({ id: true, createdAt: true });

// Type exports
export type Member = typeof members.$inferSelect;
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type CourseModule = typeof courseModules.$inferSelect;
export type CourseLesson = typeof courseLessons.$inferSelect;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type MembershipTier = typeof membershipTiers.$inferSelect;
export type InsertMembershipTier = z.infer<typeof insertMembershipTierSchema>;
export type Certificate = typeof certificates.$inferSelect;
export type MemberEnrollment = typeof memberEnrollments.$inferSelect;
export type LessonProgress = typeof lessonProgress.$inferSelect;
