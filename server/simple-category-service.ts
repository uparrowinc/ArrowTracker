// Simple category system using existing tags field
export interface BlogCategory {
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  subcategories: BlogSubcategory[];
}

export interface BlogSubcategory {
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
}

// Predefined categories that map to existing blog tags
export const BLOG_CATEGORIES: BlogCategory[] = [
  {
    name: 'Technology',
    slug: 'technology',
    description: 'Latest technology trends and insights',
    color: '#3B82F6',
    icon: 'Cpu',
    subcategories: [
      { name: 'AI & Machine Learning', slug: 'ai-machine-learning', description: 'AI and ML developments', color: '#8B5CF6', icon: 'Brain' },
      { name: 'Web Development', slug: 'web-development', description: 'Web development trends', color: '#10B981', icon: 'Code' },
      { name: 'DevOps', slug: 'devops', description: 'Development operations', color: '#F59E0B', icon: 'Settings' }
    ]
  },
  {
    name: 'Security',
    slug: 'security',
    description: 'Cybersecurity insights and best practices',
    color: '#EF4444',
    icon: 'Shield',
    subcategories: [
      { name: 'Penetration Testing', slug: 'penetration-testing', description: 'Pen testing methodologies', color: '#DC2626', icon: 'Target' },
      { name: 'Security Scanning', slug: 'security-scanning', description: 'Automated security tools', color: '#B91C1C', icon: 'Search' },
      { name: 'Compliance', slug: 'compliance', description: 'Security regulations', color: '#991B1B', icon: 'FileCheck' }
    ]
  },
  {
    name: 'Business',
    slug: 'business',
    description: 'Business strategy and insights',
    color: '#059669',
    icon: 'Briefcase',
    subcategories: [
      { name: 'Consulting', slug: 'consulting', description: 'Technology consulting', color: '#047857', icon: 'Users' },
      { name: 'Digital Transformation', slug: 'digital-transformation', description: 'Digital strategies', color: '#065F46', icon: 'Zap' },
      { name: 'Project Management', slug: 'project-management', description: 'PM methodologies', color: '#064E3B', icon: 'Calendar' }
    ]
  },
  {
    name: 'E-commerce',
    slug: 'ecommerce',
    description: 'E-commerce solutions and strategies',
    color: '#7C3AED',
    icon: 'ShoppingCart',
    subcategories: [
      { name: 'PCI Compliance', slug: 'pci-compliance', description: 'Payment security', color: '#6D28D9', icon: 'CreditCard' },
      { name: 'Payment Processing', slug: 'payment-processing', description: 'Payment gateways', color: '#5B21B6', icon: 'DollarSign' },
      { name: 'SEO', slug: 'seo', description: 'Search optimization', color: '#4C1D95', icon: 'TrendingUp' }
    ]
  },
  {
    name: 'Media',
    slug: 'media',
    description: 'Podcasts, radio shows, and multimedia',
    color: '#EC4899',
    icon: 'Mic',
    subcategories: [
      { name: 'Radio Shows', slug: 'radio-shows', description: 'uAI radio episodes', color: '#DB2777', icon: 'Radio' },
      { name: 'Podcasts', slug: 'podcasts', description: 'Tech podcasts', color: '#BE185D', icon: 'Headphones' },
      { name: 'Tutorials', slug: 'tutorials', description: 'Step-by-step guides', color: '#9D174D', icon: 'BookOpen' }
    ]
  }
];

export class SimpleCategoryService {
  private categories: BlogCategory[] = [...BLOG_CATEGORIES];

  getAllCategories(): BlogCategory[] {
    return this.categories;
  }

  getCategoryBySlug(slug: string): BlogCategory | null {
    return this.categories.find(cat => cat.slug === slug) || null;
  }

  getSubcategoryBySlug(slug: string): BlogSubcategory | null {
    for (const category of this.categories) {
      const subcategory = category.subcategories.find(sub => sub.slug === slug);
      if (subcategory) return subcategory;
    }
    return null;
  }

  async createCategory(data: {
    name: string;
    slug: string;
    description: string;
    color: string;
    icon: string;
    parentCategory?: string;
  }): Promise<BlogCategory | BlogSubcategory> {
    const { name, slug, description, color, icon, parentCategory } = data;

    // Check if slug already exists
    if (this.getCategoryBySlug(slug) || this.getSubcategoryBySlug(slug)) {
      throw new Error('Category with this slug already exists');
    }

    if (parentCategory) {
      // Create subcategory
      const parent = this.getCategoryBySlug(parentCategory);
      if (!parent) {
        throw new Error('Parent category not found');
      }

      const newSubcategory: BlogSubcategory = {
        name,
        slug,
        description,
        color,
        icon
      };

      parent.subcategories.push(newSubcategory);
      return newSubcategory;
    } else {
      // Create main category
      const newCategory: BlogCategory = {
        name,
        slug,
        description,
        color,
        icon,
        subcategories: []
      };

      this.categories.push(newCategory);
      return newCategory;
    }
  }

  async updateCategory(data: {
    originalSlug: string;
    name: string;
    slug: string;
    description: string;
    color: string;
    icon: string;
    parentCategory?: string;
  }): Promise<BlogCategory | BlogSubcategory> {
    const { originalSlug, name, slug, description, color, icon, parentCategory } = data;

    // Find existing category/subcategory
    let existingCategory = this.getCategoryBySlug(originalSlug);
    let existingSubcategory: BlogSubcategory | null = null;
    let parentCat: BlogCategory | null = null;

    if (!existingCategory) {
      // Look for subcategory
      for (const category of this.categories) {
        const subcategory = category.subcategories.find(sub => sub.slug === originalSlug);
        if (subcategory) {
          existingSubcategory = subcategory;
          parentCat = category;
          break;
        }
      }
    }

    if (!existingCategory && !existingSubcategory) {
      throw new Error('Category not found');
    }

    // Check if new slug conflicts (if changed)
    if (slug !== originalSlug) {
      if (this.getCategoryBySlug(slug) || this.getSubcategoryBySlug(slug)) {
        throw new Error('Category with this slug already exists');
      }
    }

    if (existingSubcategory && parentCat) {
      // Update subcategory
      existingSubcategory.name = name;
      existingSubcategory.slug = slug;
      existingSubcategory.description = description;
      existingSubcategory.color = color;
      existingSubcategory.icon = icon;
      return existingSubcategory;
    } else if (existingCategory) {
      // Update main category
      existingCategory.name = name;
      existingCategory.slug = slug;
      existingCategory.description = description;
      existingCategory.color = color;
      existingCategory.icon = icon;
      return existingCategory;
    }

    throw new Error('Failed to update category');
  }

  // Map tags to categories based on keywords
  mapTagsToCategory(tags: string): { category: string; subcategory?: string } | null {
    if (!tags) return null;
    
    const tagList = tags.toLowerCase().split(',').map(t => t.trim());
    
    // Security mapping
    if (tagList.some(tag => ['security', 'scan', 'scanner', 'owasp', 'zap', 'penetration', 'pen test'].includes(tag))) {
      if (tagList.some(tag => ['scan', 'scanner', 'semgroup'].includes(tag))) {
        return { category: 'security', subcategory: 'security-scanning' };
      }
      if (tagList.some(tag => ['owasp', 'zap', 'penetration'].includes(tag))) {
        return { category: 'security', subcategory: 'penetration-testing' };
      }
      return { category: 'security' };
    }
    
    // AI/Technology mapping
    if (tagList.some(tag => ['ai', 'machine learning', 'dall-e', 'openai', 'artificial intelligence'].includes(tag))) {
      return { category: 'technology', subcategory: 'ai-machine-learning' };
    }
    
    // Technology general
    if (tagList.some(tag => ['technology', 'tech', 'web', 'development', 'devops'].includes(tag))) {
      return { category: 'technology' };
    }
    
    // Business mapping
    if (tagList.some(tag => ['business', 'consulting', 'strategy'].includes(tag))) {
      return { category: 'business', subcategory: 'consulting' };
    }
    
    // Media mapping
    if (tagList.some(tag => ['radio', 'podcast', 'audio', 'media'].includes(tag))) {
      return { category: 'media', subcategory: 'radio-shows' };
    }
    
    return null;
  }

  // Delete category or subcategory
  deleteCategory(slug: string): boolean {
    // Try to find and delete main category
    const categoryIndex = this.categories.findIndex(cat => cat.slug === slug);
    if (categoryIndex !== -1) {
      this.categories.splice(categoryIndex, 1);
      return true;
    }

    // Try to find and delete subcategory
    for (const category of this.categories) {
      const subcategoryIndex = category.subcategories.findIndex(sub => sub.slug === slug);
      if (subcategoryIndex !== -1) {
        category.subcategories.splice(subcategoryIndex, 1);
        return true;
      }
    }

    return false;
  }

  // Enhanced post mapping with categories/subcategories
  mapTagsToCategories(posts: any[]): any[] {
    return posts.map(post => {
      const mapping = this.mapTagsToCategory(post.tags);
      if (mapping) {
        return {
          ...post,
          category: mapping.category,
          subcategory: mapping.subcategory || ""
        };
      }
      return post;
    });
  }

  // Get posts count per category (would need to be called with actual posts data)
  getCategoryStats(posts: any[]): { [key: string]: number } {
    const stats: { [key: string]: number } = {};
    
    for (const post of posts) {
      const mapping = this.mapTagsToCategory(post.tags);
      if (mapping) {
        stats[mapping.category] = (stats[mapping.category] || 0) + 1;
        if (mapping.subcategory) {
          stats[mapping.subcategory] = (stats[mapping.subcategory] || 0) + 1;
        }
      }
    }
    
    return stats;
  }

  // Get categories with post counts
  getCategoriesWithPostCounts(posts: any[]): BlogCategory[] {
    return this.categories.map(category => ({
      ...category,
      postCount: posts.filter(post => {
        const mapping = this.mapTagsToCategory(post.tags);
        return mapping?.category === category.slug;
      }).length,
      subcategories: category.subcategories.map(subcategory => ({
        ...subcategory,
        postCount: posts.filter(post => {
          const mapping = this.mapTagsToCategory(post.tags);
          return mapping?.category === category.slug && mapping?.subcategory === subcategory.slug;
        }).length
      }))
    }));
  }
}

export const simpleCategoryService = new SimpleCategoryService();