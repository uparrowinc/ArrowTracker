import { db } from './db';
import { eq, and, or, desc, asc, sql, count } from 'drizzle-orm';
import {
  members,
  courses,
  courseModules,
  courseLessons,
  memberEnrollments,
  lessonProgress,
  supportTickets,
  ticketMessages,
  invoices,
  invoiceItems,
  membershipTiers,
  certificates,
  memberSessions,
  type Member,
  type InsertMember,
  type Course,
  type InsertCourse,
  type SupportTicket,
  type InsertSupportTicket,
  type Invoice,
  type InsertInvoice,
  type MembershipTier,
  type InsertMembershipTier,
} from '@shared/membership-schema';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export interface IMembershipStorage {
  // Member management
  createMember(memberData: InsertMember): Promise<Member>;
  getMemberById(id: number): Promise<Member | undefined>;
  getMemberByEmail(email: string): Promise<Member | undefined>;
  updateMember(id: number, memberData: Partial<Member>): Promise<Member>;
  approveMember(memberId: number, approvedBy: number): Promise<Member>;
  getMembersPendingApproval(): Promise<Member[]>;
  getAllMembers(): Promise<Member[]>;
  
  // Authentication
  validateMemberCredentials(email: string, password: string): Promise<Member | null>;
  createMemberSession(sessionId: string, memberId: number, ipAddress: string, userAgent: string): Promise<void>;
  getMemberBySessionId(sessionId: string): Promise<Member | undefined>;
  
  // Course management
  createCourse(courseData: InsertCourse): Promise<Course>;
  getCourseById(id: number): Promise<Course | undefined>;
  getCourseBySlug(slug: string): Promise<Course | undefined>;
  updateCourse(id: number, courseData: Partial<Course>): Promise<Course>;
  getAllCourses(): Promise<Course[]>;
  getPublishedCourses(): Promise<Course[]>;
  getCoursesByMember(memberId: number): Promise<Course[]>;
  
  // Enrollment management
  enrollMemberInCourse(memberId: number, courseId: number): Promise<void>;
  getMemberEnrollments(memberId: number): Promise<any[]>;
  updateCourseProgress(memberId: number, courseId: number, progressPercentage: number): Promise<void>;
  
  // Support tickets
  createSupportTicket(ticketData: InsertSupportTicket): Promise<SupportTicket>;
  getSupportTicketById(id: number): Promise<SupportTicket | undefined>;
  getSupportTicketsByMember(memberId: number): Promise<SupportTicket[]>;
  getAllSupportTickets(): Promise<SupportTicket[]>;
  updateSupportTicket(id: number, ticketData: Partial<SupportTicket>): Promise<SupportTicket>;
  
  // Invoices
  createInvoice(invoiceData: InsertInvoice): Promise<Invoice>;
  getInvoiceById(id: number): Promise<Invoice | undefined>;
  getInvoicesByMember(memberId: number): Promise<Invoice[]>;
  updateInvoice(id: number, invoiceData: Partial<Invoice>): Promise<Invoice>;
  
  // Membership tiers
  createMembershipTier(tierData: InsertMembershipTier): Promise<MembershipTier>;
  getAllMembershipTiers(): Promise<MembershipTier[]>;
  getActiveMembershipTiers(): Promise<MembershipTier[]>;
}

export class MembershipStorage implements IMembershipStorage {
  
  // Member management
  async createMember(memberData: InsertMember): Promise<Member> {
    const hashedPassword = await bcrypt.hash(memberData.password, 12);
    
    const [member] = await db
      .insert(members)
      .values({
        ...memberData,
        password: hashedPassword,
      })
      .returning();
    
    return member;
  }

  async getMemberById(id: number): Promise<Member | undefined> {
    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.id, id));
    
    return member;
  }

  async getMemberByEmail(email: string): Promise<Member | undefined> {
    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.email, email));
    
    return member;
  }

  async updateMember(id: number, memberData: Partial<Member>): Promise<Member> {
    const [member] = await db
      .update(members)
      .set({
        ...memberData,
        updatedAt: new Date(),
      })
      .where(eq(members.id, id))
      .returning();
    
    return member;
  }

  async approveMember(memberId: number, approvedBy: number): Promise<Member> {
    const [member] = await db
      .update(members)
      .set({
        isApproved: true,
        membershipStatus: 'active',
        approvedBy,
        approvedAt: new Date(),
        membershipStartDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(members.id, memberId))
      .returning();
    
    return member;
  }

  async getMembersPendingApproval(): Promise<Member[]> {
    return db
      .select()
      .from(members)
      .where(and(
        eq(members.isApproved, false),
        eq(members.membershipStatus, 'pending')
      ))
      .orderBy(desc(members.createdAt));
  }

  async getAllMembers(): Promise<Member[]> {
    return db
      .select()
      .from(members)
      .orderBy(desc(members.createdAt));
  }

  // Authentication
  async validateMemberCredentials(email: string, password: string): Promise<Member | null> {
    const member = await this.getMemberByEmail(email);
    
    if (!member || !member.isApproved || member.membershipStatus !== 'active') {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, member.password);
    if (!isValidPassword) {
      return null;
    }

    // Update last login
    await this.updateMember(member.id, { lastLoginAt: new Date() });

    return member;
  }

  async createMemberSession(sessionId: string, memberId: number, ipAddress: string, userAgent: string): Promise<void> {
    await db
      .insert(memberSessions)
      .values({
        sessionId,
        memberId,
        ipAddress,
        userAgent,
      });
  }

  async getMemberBySessionId(sessionId: string): Promise<Member | undefined> {
    const [session] = await db
      .select({
        member: members,
      })
      .from(memberSessions)
      .innerJoin(members, eq(memberSessions.memberId, members.id))
      .where(and(
        eq(memberSessions.sessionId, sessionId),
        eq(memberSessions.isActive, true)
      ));

    return session?.member;
  }

  // Course management
  async createCourse(courseData: InsertCourse): Promise<Course> {
    const [course] = await db
      .insert(courses)
      .values(courseData)
      .returning();
    
    return course;
  }

  async getCourseById(id: number): Promise<Course | undefined> {
    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, id));
    
    return course;
  }

  async getCourseBySlug(slug: string): Promise<Course | undefined> {
    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.slug, slug));
    
    return course;
  }

  async updateCourse(id: number, courseData: Partial<Course>): Promise<Course> {
    const [course] = await db
      .update(courses)
      .set({
        ...courseData,
        updatedAt: new Date(),
      })
      .where(eq(courses.id, id))
      .returning();
    
    return course;
  }

  async getAllCourses(): Promise<Course[]> {
    return db
      .select()
      .from(courses)
      .orderBy(desc(courses.createdAt));
  }

  async getPublishedCourses(): Promise<Course[]> {
    return db
      .select()
      .from(courses)
      .where(eq(courses.isPublished, true))
      .orderBy(desc(courses.createdAt));
  }

  async getCoursesByMember(memberId: number): Promise<Course[]> {
    return (db as any)
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        slug: courses.slug,
        thumbnail: courses.thumbnail,
        instructor: courses.instructor,
        category: courses.category,
        difficulty: courses.difficulty,
        estimatedHours: courses.estimatedHours,
        createdAt: courses.createdAt,
      })
      .from(memberEnrollments)
      .innerJoin(courses, eq(memberEnrollments.courseId, courses.id))
      .where(eq(memberEnrollments.memberId, memberId))
      .orderBy(desc(memberEnrollments.enrolledAt));
  }

  // Enrollment management
  async enrollMemberInCourse(memberId: number, courseId: number): Promise<void> {
    await db
      .insert(memberEnrollments)
      .values({
        memberId,
        courseId,
      });
  }

  async getMemberEnrollments(memberId: number): Promise<Record<string, unknown>[]> {
    return (db as any)
      .select({
        id: memberEnrollments.id,
        courseId: memberEnrollments.courseId,
        courseTitle: courses.title,
        courseSlug: courses.slug,
        courseThumbnail: courses.thumbnail,
        enrolledAt: memberEnrollments.enrolledAt,
        progressPercentage: memberEnrollments.progressPercentage,
        completedAt: memberEnrollments.completedAt,
        lastAccessedAt: memberEnrollments.lastAccessedAt,
      })
      .from(memberEnrollments)
      .innerJoin(courses, eq(memberEnrollments.courseId, courses.id))
      .where(eq(memberEnrollments.memberId, memberId))
      .orderBy(desc(memberEnrollments.lastAccessedAt));
  }

  async updateCourseProgress(memberId: number, courseId: number, progressPercentage: number): Promise<void> {
    await db
      .update(memberEnrollments)
      .set({
        progressPercentage,
        lastAccessedAt: new Date(),
        ...(progressPercentage >= 100 && { completedAt: new Date() }),
      })
      .where(and(
        eq(memberEnrollments.memberId, memberId),
        eq(memberEnrollments.courseId, courseId)
      ));
  }

  // Support tickets
  async createSupportTicket(ticketData: InsertSupportTicket): Promise<SupportTicket> {
    // Generate ticket number
    const ticketNumber = `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    const [ticket] = await db
      .insert(supportTickets)
      .values({
        ...ticketData,
        ticketNumber,
      })
      .returning();
    
    return ticket;
  }

  async getSupportTicketById(id: number): Promise<SupportTicket | undefined> {
    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, id));
    
    return ticket;
  }

  async getSupportTicketsByMember(memberId: number): Promise<SupportTicket[]> {
    return db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.memberId, memberId))
      .orderBy(desc(supportTickets.createdAt));
  }

  async getAllSupportTickets(): Promise<SupportTicket[]> {
    return db
      .select()
      .from(supportTickets)
      .orderBy(desc(supportTickets.createdAt));
  }

  async updateSupportTicket(id: number, ticketData: Partial<SupportTicket>): Promise<SupportTicket> {
    const [ticket] = await db
      .update(supportTickets)
      .set({
        ...ticketData,
        updatedAt: new Date(),
      })
      .where(eq(supportTickets.id, id))
      .returning();
    
    return ticket;
  }

  // Invoices
  async createInvoice(invoiceData: InsertInvoice): Promise<Invoice> {
    // Generate invoice number
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    
    const [invoice] = await db
      .insert(invoices)
      .values({
        ...invoiceData,
        invoiceNumber,
      })
      .returning();
    
    return invoice;
  }

  async getInvoiceById(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id));
    
    return invoice;
  }

  async getInvoicesByMember(memberId: number): Promise<Invoice[]> {
    return db
      .select()
      .from(invoices)
      .where(eq(invoices.memberId, memberId))
      .orderBy(desc(invoices.createdAt));
  }

  async updateInvoice(id: number, invoiceData: Partial<Invoice>): Promise<Invoice> {
    const [invoice] = await db
      .update(invoices)
      .set({
        ...invoiceData,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, id))
      .returning();
    
    return invoice;
  }

  // Membership tiers
  async createMembershipTier(tierData: InsertMembershipTier): Promise<MembershipTier> {
    const [tier] = await db
      .insert(membershipTiers)
      .values(tierData)
      .returning();
    
    return tier;
  }

  async getAllMembershipTiers(): Promise<MembershipTier[]> {
    return db
      .select()
      .from(membershipTiers)
      .orderBy(asc(membershipTiers.priority));
  }

  async getActiveMembershipTiers(): Promise<MembershipTier[]> {
    return db
      .select()
      .from(membershipTiers)
      .where(eq(membershipTiers.isActive, true))
      .orderBy(asc(membershipTiers.priority));
  }
}

// Create singleton instance
export const membershipStorage = new MembershipStorage();