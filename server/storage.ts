import { 
  users, 
  contactSubmissions,
  type User, 
  type InsertUser, 
  type Service, 
  type Testimonial, 
  type TeamMember,
  type ContactFormData,
  type ContactSubmission
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Define the storage interface
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Service methods
  getAllServices(): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  createService(service: Omit<Service, "id">): Promise<Service>;
  
  // Testimonial methods
  getAllTestimonials(): Promise<Testimonial[]>;
  getTestimonial(id: number): Promise<Testimonial | undefined>;
  createTestimonial(testimonial: Omit<Testimonial, "id">): Promise<Testimonial>;
  
  // Team member methods
  getAllTeamMembers(): Promise<TeamMember[]>;
  getTeamMember(id: number): Promise<TeamMember | undefined>;
  createTeamMember(teamMember: Omit<TeamMember, "id">): Promise<TeamMember>;
  
  // Contact form methods
  createContactSubmission(formData: ContactFormData, ipAddress?: string): Promise<ContactSubmission>;
  getAllContactSubmissions(): Promise<ContactSubmission[]>;
  updateContactSubmissionEmailStatus(id: number, emailSent: boolean): Promise<void>;
  
  // Blog methods
  getAllBlogPosts(published?: boolean): Promise<any[]>;
  getBlogPost(slug: string): Promise<any>;
  createBlogPost(postData: any): Promise<any>;
  updateBlogPost(id: number, postData: any): Promise<any>;
  deleteBlogPost(id: number): Promise<boolean>;
  searchBlogPosts(query: string): Promise<any[]>;
  
  // Email subscriber methods
  addEmailSubscriber(data: any): Promise<any>;
  getAllEmailSubscribers(): Promise<any[]>;
  
  // Media methods
  uploadMedia(data: any): Promise<any>;
  getAllMedia(): Promise<any[]>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private services: Map<number, Service>;
  private testimonials: Map<number, Testimonial>;
  private teamMembers: Map<number, TeamMember>;
  private contactSubmissions: ContactFormData[];
  private blogPosts: Map<number, any>;
  private emailSubscribers: Map<number, any>;
  private mediaUploads: Map<number, any>;
  
  private currentUserId: number;
  private currentServiceId: number;
  private currentTestimonialId: number;
  private currentTeamMemberId: number;
  private currentBlogPostId: number;
  private currentSubscriberId: number;
  private currentMediaId: number;

  constructor() {
    this.users = new Map();
    this.services = new Map();
    this.testimonials = new Map();
    this.teamMembers = new Map();
    this.contactSubmissions = [];
    this.blogPosts = new Map();
    this.emailSubscribers = new Map();
    this.mediaUploads = new Map();
    
    this.currentUserId = 1;
    this.currentServiceId = 1;
    this.currentTestimonialId = 1;
    this.currentTeamMemberId = 1;
    this.currentBlogPostId = 1;
    this.currentSubscriberId = 1;
    this.currentMediaId = 1;
    
    // Initialize with some sample data
    this.initializeSampleData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Service methods
  async getAllServices(): Promise<Service[]> {
    return Array.from(this.services.values());
  }
  
  async getService(id: number): Promise<Service | undefined> {
    return this.services.get(id);
  }
  
  async createService(service: Omit<Service, "id">): Promise<Service> {
    const id = this.currentServiceId++;
    const newService: Service = { ...service, id };
    this.services.set(id, newService);
    return newService;
  }
  
  // Testimonial methods
  async getAllTestimonials(): Promise<Testimonial[]> {
    return Array.from(this.testimonials.values());
  }
  
  async getTestimonial(id: number): Promise<Testimonial | undefined> {
    return this.testimonials.get(id);
  }
  
  async createTestimonial(testimonial: Omit<Testimonial, "id">): Promise<Testimonial> {
    const id = this.currentTestimonialId++;
    const newTestimonial: Testimonial = { ...testimonial, id };
    this.testimonials.set(id, newTestimonial);
    return newTestimonial;
  }
  
  // Team member methods
  async getAllTeamMembers(): Promise<TeamMember[]> {
    return Array.from(this.teamMembers.values());
  }
  
  async getTeamMember(id: number): Promise<TeamMember | undefined> {
    return this.teamMembers.get(id);
  }
  
  async createTeamMember(teamMember: Omit<TeamMember, "id">): Promise<TeamMember> {
    const id = this.currentTeamMemberId++;
    const newTeamMember: TeamMember = { ...teamMember, id };
    this.teamMembers.set(id, newTeamMember);
    return newTeamMember;
  }
  
  // Contact form methods - now using SQLite database
  async createContactSubmission(formData: ContactFormData, ipAddress?: string): Promise<ContactSubmission> {
    const result = db.insert(contactSubmissions).values({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      company: formData.company || null,
      serviceInterest: formData.serviceInterest,
      message: formData.message,
      ipAddress: ipAddress || null,
    }).returning().get();
    
    console.log('✅ Contact form submission saved to database:', result.id, 'from IP:', ipAddress || 'unknown');
    return result;
  }
  
  async getAllContactSubmissions(): Promise<ContactSubmission[]> {
    return db.select().from(contactSubmissions).all();
  }
  
  async updateContactSubmissionEmailStatus(id: number, emailSent: boolean): Promise<void> {
    try {
      db.update(contactSubmissions)
        .set({ emailSent })
        .where(eq(contactSubmissions.id, id))
        .run();
      console.log(`✅ Updated contact submission ${id} email status: ${emailSent}`);
    } catch (error) {
      console.error(`❌ Failed to update contact submission ${id} email status:`, error);
    }
  }
  
  // Initialize sample data
  private initializeSampleData() {
    // Services
    const services = [
      {
        title: "eCommerce Solutions",
        description: "Build and optimize custom eCommerce platforms with secure payment processing, inventory management, and seamless customer experiences.",
        imageUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400&q=80",
        link: "#ecommerce"
      },
      {
        title: "Technology Consulting",
        description: "Get expert guidance on technology decisions with personalized recommendations that align with your business goals and budget.",
        imageUrl: "https://images.unsplash.com/photo-1560439513-74b037a25d84?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400&q=80",
        link: "#consulting"
      },
      {
        title: "AI & Automation",
        description: "Implement custom AI solutions to streamline operations, enhance decision-making, and create more efficient business processes.",
        imageUrl: "https://images.unsplash.com/photo-1488229297570-58520851e868?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400&q=80",
        link: "#ai"
      }
    ];
    
    services.forEach(service => {
      this.services.set(this.currentServiceId, { 
        ...service, 
        id: this.currentServiceId++ 
      });
    });
    
    // Testimonials
    const testimonials = [
      {
        content: "up arrow inc's eCommerce solution revolutionized our online store. The personalized approach meant I got exactly what my business needed without paying for unnecessary features. Sales increased by 65% in the first quarter.",
        authorName: "Sarah Johnson",
        authorTitle: "Owner, Green Valley Boutique",
        authorImageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=120&q=80",
        rating: 5
      },
      {
        content: "As a small business owner, I needed expert technology guidance without the huge consulting fees. up arrow inc provided clear, actionable advice that helped me make smart tech investments that actually paid off.",
        authorName: "David Chen",
        authorTitle: "Founder, Artisan Works",
        authorImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=120&q=80",
        rating: 5
      },
      {
        content: "I was impressed by the dedicated personal service. Unlike larger firms where you get passed between departments, up arrow inc provided consistent, knowledgeable support from start to finish on our automation project.",
        authorName: "Amanda Rodriguez",
        authorTitle: "Director, Bright Path Learning",
        authorImageUrl: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=120&q=80",
        rating: 5
      }
    ];
    
    testimonials.forEach(testimonial => {
      this.testimonials.set(this.currentTestimonialId, {
        ...testimonial,
        id: this.currentTestimonialId++
      });
    });
    
    // Team members - one person operation
    const teamMembers = [
      {
        name: "Michael Foster",
        title: "Founder & Technology Consultant",
        bio: "Technology expert with over 15 years of experience in eCommerce solutions, system integration, and business technology strategy.",
        imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300&q=80",
        linkedinUrl: "#",
        twitterUrl: "#"
      }
    ];
    
    teamMembers.forEach(member => {
      this.teamMembers.set(this.currentTeamMemberId, {
        ...member,
        id: this.currentTeamMemberId++
      });
    });
    
    // Initialize blog sample data
    const sampleBlogPosts = [
      {
        title: "Getting Started with AI in Business: A Practical Guide",
        slug: "getting-started-ai-business-practical-guide",
        excerpt: "Learn how to implement AI solutions in your business without breaking the bank. From chatbots to automation, discover practical ways to leverage artificial intelligence.",
        content: `# Getting Started with AI in Business: A Practical Guide

**AI isn't just for tech giants anymore.** Small and medium businesses can now leverage artificial intelligence to improve efficiency, reduce costs, and enhance customer experiences without breaking the bank.

## Why AI Matters for Your Business

In today's competitive landscape, businesses that embrace AI gain significant advantages:
- **Cost Reduction**: Automate repetitive tasks and reduce operational overhead
- **Better Customer Experience**: Provide 24/7 support and personalized interactions  
- **Data-Driven Decisions**: Extract actionable insights from your business data
- **Competitive Edge**: Stay ahead of competitors still using manual processes

## Key Areas for AI Implementation

### 1. Customer Service Automation
- **AI Chatbots** can handle routine inquiries instantly
- **Sentiment Analysis** helps prioritize urgent customer issues
- **Auto-routing** directs complex questions to the right team members

### 2. Business Intelligence & Analytics
- **Predictive Analytics** forecast sales trends and inventory needs
- **Customer Behavior Analysis** reveals purchasing patterns
- **Financial Forecasting** improves budget planning and cash flow management

### 3. Marketing & Sales Optimization
- **Lead Scoring** identifies your most promising prospects
- **Content Personalization** tailors messaging to individual customers
- **Email Marketing Automation** sends the right message at the right time

### 4. Operations & Process Automation
- **Invoice Processing** eliminates manual data entry
- **Inventory Management** automatically reorders products
- **Quality Control** detects defects faster than human inspection

## Getting Started: Your AI Implementation Roadmap

### Phase 1: Start Small (Month 1-2)
1. **Identify One Problem**: Choose a specific, measurable pain point
2. **Research Solutions**: Look for tools that integrate with your existing systems
3. **Test with Limited Scope**: Start with a pilot program before full rollout

### Phase 2: Expand & Optimize (Month 3-6)
1. **Measure Results**: Track ROI and performance improvements
2. **Train Your Team**: Ensure staff understands and embraces new tools
3. **Scale What Works**: Expand successful implementations to other areas

### Phase 3: Advanced Integration (Month 6+)
1. **Connect Systems**: Link AI tools for maximum efficiency
2. **Custom Solutions**: Consider bespoke AI for unique business needs
3. **Continuous Learning**: Stay updated on new AI developments

## Recommended AI Tools for Small Business

### Customer Service
- **Intercom**: AI-powered customer messaging
- **Zendesk Answer Bot**: Automated support ticket resolution
- **Tidio**: Live chat with AI assistance

### Marketing & Sales
- **HubSpot**: AI-driven CRM and marketing automation
- **Mailchimp**: Predictive audience insights
- **Salesforce Einstein**: AI for sales forecasting

### Operations
- **Zapier**: Workflow automation between apps
- **QuickBooks**: AI-powered accounting insights
- **Monday.com**: Project management with AI features

## Implementation Best Practices

### Do:
- **Start with clear goals** and measurable outcomes
- **Involve your team** in the selection and training process
- **Choose tools** that integrate with your existing workflow
- **Monitor performance** and adjust as needed

### Don't:
- **Implement everything at once** - this leads to confusion and poor adoption
- **Ignore data privacy** - ensure AI tools comply with regulations
- **Replace human judgment** entirely - AI should enhance, not replace decision-making
- **Skip training** - untrained teams won't maximize AI benefits

## Common Challenges & Solutions

**Challenge**: "AI is too expensive for our small business"
**Solution**: Start with free tiers and gradually upgrade as you see ROI

**Challenge**: "Our team is afraid AI will replace their jobs"
**Solution**: Position AI as a tool that eliminates boring tasks, allowing focus on strategic work

**Challenge**: "We don't have the technical expertise"
**Solution**: Choose user-friendly, no-code AI solutions with good customer support

**Challenge**: "We don't have enough data"
**Solution**: Start with tools that work with small datasets or use external data sources

## Measuring AI Success

Track these key metrics to evaluate your AI implementation:

- **Time Savings**: Hours saved on manual tasks
- **Cost Reduction**: Decreased operational expenses  
- **Customer Satisfaction**: Improved support ratings and response times
- **Revenue Impact**: Increased sales or customer retention
- **Error Reduction**: Fewer mistakes in automated processes

## The Future is AI-Enhanced

The businesses that thrive in the next decade will be those that successfully integrate AI into their operations. **The time to start is now** - not because AI is a magic solution, but because incremental improvements compound over time.

Start small, measure results, and gradually expand your AI capabilities. Your future self (and your bottom line) will thank you.

---

*Ready to get started with AI in your business? [Contact our consulting team](/contact) for a personalized AI strategy session.*`,
        featuredImage: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400&q=80",
        author: "Up Arrow Inc",
        published: true,
        publishedAt: new Date().toISOString(),
        tags: "AI, business, automation, technology",
        metaDescription: "Learn practical ways to implement AI in your business. From chatbots to automation, discover how small businesses can leverage artificial intelligence effectively.",
        readingTime: "5 min read",
        seoTitle: "AI in Business: Practical Implementation Guide for Small Companies",
        canonicalUrl: null
      }
    ];
    
    sampleBlogPosts.forEach(post => {
      this.blogPosts.set(this.currentBlogPostId, {
        ...post,
        id: this.currentBlogPostId++,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });
  }
  
  // Blog methods
  async getAllBlogPosts(published?: boolean): Promise<any[]> {
    const posts = Array.from(this.blogPosts.values());
    if (published !== undefined) {
      return posts.filter(post => post.published === published);
    }
    return posts;
  }

  async getPublishedBlogPosts(): Promise<any[]> {
    return Array.from(this.blogPosts.values())
      .filter(post => post.published && post.publishedAt)
      .sort((a, b) => 
        new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime()
      );
  }

  async getBlogPost(slug: string): Promise<any> {
    return Array.from(this.blogPosts.values()).find(post => post.slug === slug);
  }

  async createBlogPost(postData: any): Promise<any> {
    const id = this.currentBlogPostId++;
    const now = new Date().toISOString();
    
    // Generate slug if not provided
    const slug = postData.slug || this.generateSlug(postData.title);
    
    const post = {
      ...postData,
      id,
      slug,
      createdAt: now,
      updatedAt: now,
      publishedAt: postData.published ? now : null,
      readingTime: this.calculateReadingTime(postData.content)
    };
    this.blogPosts.set(id, post);
    return post;
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  async updateBlogPost(id: number, postData: any): Promise<any> {
    const existingPost = this.blogPosts.get(id);
    if (!existingPost) return null;
    
    const updatedPost = {
      ...existingPost,
      ...postData,
      updatedAt: new Date().toISOString(),
      publishedAt: postData.published && !existingPost.published ? new Date().toISOString() : existingPost.publishedAt,
      readingTime: postData.content ? this.calculateReadingTime(postData.content) : existingPost.readingTime
    };
    
    this.blogPosts.set(id, updatedPost);
    return updatedPost;
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    return this.blogPosts.delete(id);
  }

  async searchBlogPosts(query: string): Promise<any[]> {
    const posts = Array.from(this.blogPosts.values()).filter(post => post.published);
    const searchTerm = query.toLowerCase();
    
    return posts.filter(post => 
      post.title?.toLowerCase().includes(searchTerm) ||
      post.content?.toLowerCase().includes(searchTerm) ||
      (post.excerpt && post.excerpt.toLowerCase().includes(searchTerm)) ||
      (post.tags && post.tags.toLowerCase().includes(searchTerm))
    );
  }

  // Email subscriber methods
  async addEmailSubscriber(data: any): Promise<any> {
    const id = this.currentSubscriberId++;
    const subscriber = {
      ...data,
      id,
      subscribed: true,
      subscribedAt: new Date().toISOString(),
      source: "blog"
    };
    this.emailSubscribers.set(id, subscriber);
    return subscriber;
  }

  async getAllEmailSubscribers(): Promise<any[]> {
    return Array.from(this.emailSubscribers.values());
  }

  // Media methods
  async uploadMedia(data: any): Promise<any> {
    const id = this.currentMediaId++;
    const media = {
      ...data,
      id,
      uploadedAt: new Date().toISOString()
    };
    this.mediaUploads.set(id, media);
    return media;
  }

  async getAllMedia(): Promise<any[]> {
    return Array.from(this.mediaUploads.values());
  }

  private calculateReadingTime(content: string): string {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  }
}

export const storage = new MemStorage();
