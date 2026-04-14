import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Clients table
export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email"),
  company: text("company"),
  phone: text("phone"),
  address: text("address"),
  billingRate: real("billing_rate"),
  currency: text("currency").default("USD"),
  atlassianAccountId: text("atlassian_account_id"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Projects table
export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  key: text("key").notNull().unique(),
  description: text("description"),
  clientId: integer("client_id").references(() => clients.id),
  atlassianProjectId: text("atlassian_project_id"),
  atlassianProjectKey: text("atlassian_project_key"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  settings: text("settings").default("{}"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Team Members table
export const teamMembers = sqliteTable("ticketing_team_members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  role: text("role").default("developer"),
  avatarUrl: text("avatar_url"),
  atlassianAccountId: text("atlassian_account_id"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Sprints table
export const sprints = sqliteTable("sprints", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  goal: text("goal"),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  startDate: integer("start_date", { mode: "timestamp" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp" }).notNull(),
  status: text("status").default("planned"),
  atlassianSprintId: text("atlassian_sprint_id"),
  velocity: integer("velocity"),
  burndownData: text("burndown_data").default("{}"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Tickets table
export const tickets = sqliteTable("tickets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("backlog"),
  priority: text("priority").default("medium"),
  type: text("type").default("task"),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  assigneeId: integer("assignee_id").references(() => teamMembers.id),
  reporterId: integer("reporter_id").references(() => teamMembers.id),
  clientId: integer("client_id").references(() => clients.id),
  estimatedHours: real("estimated_hours"),
  actualHours: real("actual_hours").default(0),
  billingRate: real("billing_rate"),
  storyPoints: integer("story_points"),
  sprintId: integer("sprint_id").references(() => sprints.id),
  epicId: integer("epic_id"),
  parentId: integer("parent_id"),
  atlassianIssueId: text("atlassian_issue_id"),
  atlassianIssueKey: text("atlassian_issue_key"),
  labels: text("labels").default("[]"),
  components: text("components").default("[]"),
  fixVersions: text("fix_versions").default("[]"),
  dueDate: integer("due_date", { mode: "timestamp" }),
  startDate: integer("start_date", { mode: "timestamp" }),
  resolvedAt: integer("resolved_at", { mode: "timestamp" }),
  isBillable: integer("is_billable", { mode: "boolean" }).default(true),
  totalBilled: real("total_billed").default(0),
  customFields: text("custom_fields").default("{}"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Time Entries
export const timeEntries = sqliteTable("time_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ticketId: integer("ticket_id").references(() => tickets.id).notNull(),
  teamMemberId: integer("team_member_id").references(() => teamMembers.id).notNull(),
  description: text("description"),
  hoursSpent: real("hours_spent").notNull(),
  billingRate: real("billing_rate"),
  workDate: integer("work_date", { mode: "timestamp" }).notNull(),
  startTime: integer("start_time", { mode: "timestamp" }),
  endTime: integer("end_time", { mode: "timestamp" }),
  atlassianWorklogId: text("atlassian_worklog_id"),
  isBillable: integer("is_billable", { mode: "boolean" }).default(true),
  isApproved: integer("is_approved", { mode: "boolean" }).default(false),
  approvedBy: integer("approved_by").references(() => teamMembers.id),
  approvedAt: integer("approved_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Ticket Comments
export const ticketComments = sqliteTable("ticket_comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ticketId: integer("ticket_id").references(() => tickets.id).notNull(),
  authorId: integer("author_id").references(() => teamMembers.id).notNull(),
  content: text("content").notNull(),
  isInternal: integer("is_internal", { mode: "boolean" }).default(false),
  atlassianCommentId: text("atlassian_comment_id"),
  attachments: text("attachments").default("[]"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Kanban Boards
export const kanbanBoards = sqliteTable("kanban_boards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  columns: text("columns").notNull(),
  wipLimits: text("wip_limits").default("{}"),
  settings: text("settings").default("{}"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Atlassian Integration Settings
export const atlassianIntegration = sqliteTable("atlassian_integration", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  domain: text("domain").notNull(),
  email: text("email").notNull(),
  apiToken: text("api_token"),
  isEnabled: integer("is_enabled", { mode: "boolean" }).default(false),
  lastSyncAt: integer("last_sync_at", { mode: "timestamp" }),
  syncSettings: text("sync_settings").default("{}"),
  webhookSecret: text("webhook_secret"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Relations
export const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(clients, { fields: [projects.clientId], references: [clients.id] }),
  tickets: many(tickets),
  sprints: many(sprints),
  kanbanBoards: many(kanbanBoards),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  project: one(projects, { fields: [tickets.projectId], references: [projects.id] }),
  assignee: one(teamMembers, { fields: [tickets.assigneeId], references: [teamMembers.id] }),
  timeEntries: many(timeEntries),
  comments: many(ticketComments),
}));

// Insert schemas
export const insertProjectSchema = createInsertSchema(projects);
export const insertClientSchema = createInsertSchema(clients);
export const insertTicketSchema = createInsertSchema(tickets);
export const insertTeamMemberSchema = createInsertSchema(teamMembers);
export const insertTimeEntrySchema = createInsertSchema(timeEntries);
export const insertSprintSchema = createInsertSchema(sprints);
export const insertTicketCommentSchema = createInsertSchema(ticketComments);
export const insertKanbanBoardSchema = createInsertSchema(kanbanBoards);
export const insertAtlassianIntegrationSchema = createInsertSchema(atlassianIntegration);

// Types
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;
export type Sprint = typeof sprints.$inferSelect;
export type InsertSprint = z.infer<typeof insertSprintSchema>;
export type TicketComment = typeof ticketComments.$inferSelect;
export type InsertTicketComment = z.infer<typeof insertTicketCommentSchema>;
export type KanbanBoard = typeof kanbanBoards.$inferSelect;
export type InsertKanbanBoard = z.infer<typeof insertKanbanBoardSchema>;
export type AtlassianIntegration = typeof atlassianIntegration.$inferSelect;
export type InsertAtlassianIntegration = z.infer<typeof insertAtlassianIntegrationSchema>;
