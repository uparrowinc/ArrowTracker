import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Tag, Mail, Search, Rss } from "lucide-react";
import { Link } from "wouter";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { CategoryNavigation } from "@/components/CategoryNavigation";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string | null;
  author: string;
  published: boolean;
  publishedAt: string | null;
  tags: string | null;
  readingTime: string | null;
}

export default function Blog() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [emailSubscription, setEmailSubscription] = useState({ email: "", name: "" });
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | undefined>();

  // Handle hash navigation for "Read More Articles" callback
  useEffect(() => {
    if (window.location.hash === '#subscription') {
      // Small delay to ensure DOM is fully rendered
      setTimeout(() => {
        const subscriptionElement = document.getElementById('subscription');
        const postsSection = document.getElementById('blog-posts-section');
        
        // On mobile, scroll to show categories + subscription area
        const isMobile = window.innerWidth <= 1024;
        
        if (isMobile && postsSection) {
          console.log('Hash navigation: scrolling to posts section for mobile');
          const rect = postsSection.getBoundingClientRect();
          const offsetTop = window.pageYOffset + rect.top - 100;
          
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        } else if (subscriptionElement) {
          console.log('Hash navigation: scrolling to subscription element');
          subscriptionElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 100);
    }
  }, []); // Run once on component mount

  // Set up SEO for blog listing page
  useEffect(() => {
    // Set page title
    document.title = 'Technology Blog | Up Arrow Inc - AI & Business Consulting';
    
    // Remove existing meta tags
    const existingMeta = document.querySelectorAll('meta[name="description"], meta[property^="og:"], meta[name="twitter:"], link[rel="canonical"]');
    existingMeta.forEach(tag => tag.remove());
    
    // Create canonical URL for blog listing (enforce lowercase)
    const canonicalUrl = 'https://ai.uparrowinc.com/blog';
    
    // Add canonical link
    const canonical = document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = canonicalUrl;
    document.head.appendChild(canonical);
    
    // Add meta description
    const metaDescription = document.createElement('meta');
    metaDescription.name = 'description';
    metaDescription.content = 'Latest insights on AI integration, technology consulting, and business strategy from Up Arrow Inc. Expert guidance for digital transformation.';
    document.head.appendChild(metaDescription);
    
    // Add Open Graph tags
    const ogTitle = document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    ogTitle.content = 'Technology Blog | Up Arrow Inc';
    document.head.appendChild(ogTitle);
    
    const ogDescription = document.createElement('meta');
    ogDescription.setAttribute('property', 'og:description');
    ogDescription.content = 'Latest insights on AI integration, technology consulting, and business strategy from Up Arrow Inc.';
    document.head.appendChild(ogDescription);
    
    const ogUrl = document.createElement('meta');
    ogUrl.setAttribute('property', 'og:url');
    ogUrl.content = canonicalUrl;
    document.head.appendChild(ogUrl);
    
    const ogType = document.createElement('meta');
    ogType.setAttribute('property', 'og:type');
    ogType.content = 'website';
    document.head.appendChild(ogType);
    
    // Cleanup function
    return () => {
      document.title = 'Up Arrow Inc - Technology Consulting';
    };
  }, []);

  // Fetch published blog posts with category filtering
  const { data: posts = [], isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog/posts", { published: true, category: selectedCategory, subcategory: selectedSubcategory }],
    queryFn: async () => {
      const params = new URLSearchParams({ published: 'true' });
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedSubcategory) params.append('subcategory', selectedSubcategory);
      
      const response = await fetch(`/api/blog/posts?${params}`);
      if (!response.ok) throw new Error('Failed to fetch posts');
      return response.json();
    }
  });

  // Search posts
  const { data: searchResults = [], isLoading: isSearching, error: searchError } = useQuery<BlogPost[]>({
    queryKey: [`/api/blog/search?q=${encodeURIComponent(searchQuery)}`],
    enabled: searchQuery.length > 2,
  });

  // Subscribe to newsletter
  const subscribeMutation = useMutation({
    mutationFn: async (data: { email: string; name: string }) => {
      return await apiRequest("/api/blog/subscribe", "POST", data);
    },
    onSuccess: () => {
      setEmailSubscription({ email: "", name: "" });
      toast({ title: "Successfully subscribed to our newsletter!" });
    },
    onError: () => {
      toast({ title: "Failed to subscribe. Please try again.", variant: "destructive" });
    }
  });

  const handleSubscribe = () => {
    if (!emailSubscription.email) {
      toast({ title: "Email is required", variant: "destructive" });
      return;
    }
    subscribeMutation.mutate(emailSubscription);
  };

  const displayPosts = searchQuery.length > 2 ? searchResults : posts;

  const handleCategorySelect = (category?: string, subcategory?: string) => {
    setSelectedCategory(category);
    setSelectedSubcategory(subcategory);
    setSearchQuery(""); // Clear search when selecting category
    
    // On mobile/tablet, scroll to posts section instead of page top
    const isMobile = window.innerWidth <= 1024;
    
    if (isMobile) {
      // Use requestAnimationFrame for better timing in production builds
      requestAnimationFrame(() => {
        setTimeout(() => {
          const postsSection = document.getElementById('blog-posts-section');
          console.log('Mobile scrolling - postsSection found:', !!postsSection);
          
          if (postsSection) {
            // Try multiple scroll methods for maximum compatibility
            try {
              // Method 1: scrollIntoView with offset
              const rect = postsSection.getBoundingClientRect();
              const offsetTop = window.pageYOffset + rect.top - 100; // Increased buffer
              
              window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
              });
              
              console.log('Mobile scroll attempted - target offset:', offsetTop);
              
              // Method 2: Fallback with scrollIntoView
              setTimeout(() => {
                const currentScroll = window.pageYOffset;
                console.log('Current scroll after attempt:', currentScroll, 'vs target:', offsetTop);
                
                if (Math.abs(currentScroll - offsetTop) > 150) {
                  console.log('Using fallback scrollIntoView');
                  postsSection.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start',
                    inline: 'nearest'
                  });
                }
              }, 800);
              
            } catch (error) {
              console.error('Mobile scroll error:', error);
              // Emergency fallback
              postsSection.scrollIntoView({ behavior: 'smooth' });
            }
          } else {
            console.error('blog-posts-section element not found for mobile scroll');
          }
        }, 300); // Increased delay for React state updates
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Validate the date is reasonable (between 2000 and 2100)
      const year = date.getFullYear();
      if (isNaN(year) || year < 2000 || year > 2100) {
        // Return a fallback format
        return 'Recently Published';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Recently Published';
    }
  };

  const getTags = (tagString: string | null) => {
    return tagString ? tagString.split(',').map(tag => tag.trim()) : [];
  };

  const maskContent = (content: string, maxLength: number = 160) => {
    if (!content) return '';
    const textContent = content.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ');
    if (textContent.length <= maxLength) return textContent;
    return textContent.substring(0, maxLength) + '...';
  };

  const renderMarkdown = async (content: string) => {
    const html = await marked.parse(content);
    return DOMPurify.sanitize(html);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Compact Header Section */}
      <div className="gradient-bg-primary border-b border-gray-800/50 relative">
        <div className="container-content py-6">
          <div className="max-w-4xl mx-auto text-center relative">
            {/* Brain Logo - BIG behind text */}
            <div className="hidden lg:block absolute -left-40 top-1/2 transform -translate-y-1/2 z-0">
              <img 
                src="/attached_assets/image_1753753865238.png" 
                alt="uAI - AI Intelligence Hub" 
                className="w-64 h-64 opacity-60 hover:opacity-80 transition-opacity duration-300"
              />
            </div>
            <Link href="/" className="text-[#C8A466] hover:text-[#D4B87A] mb-4 inline-flex items-center gap-2 transition-all duration-300 hover:gap-3 text-lg font-medium">
              ← Back to Up Arrow Inc
            </Link>
            
            {/* Mobile Brain Logo - IN YOUR FACE */}
            <div className="lg:hidden mb-6">
              <img 
                src="/attached_assets/image_1753753865238.png" 
                alt="uAI - AI Intelligence Hub" 
                className="w-40 h-40 opacity-90 hover:opacity-100 transition-opacity duration-300 mx-auto"
              />
            </div>
            
            {/* Centered Content - High Z-Index */}
            <div className="mb-6 relative z-20">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#163253]/30 to-[#2C4A6E]/20 rounded-full border border-[#C8A466]/30 mb-3">
                <div className="w-2 h-2 bg-gradient-to-r from-[#C8A466] to-[#2C4A6E] rounded-full"></div>
                <span className="text-sm text-gray-300 font-medium">uAI Knowledge Base</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#E8EDF2] via-[#C8A466] to-[#E8EDF2] bg-clip-text text-transparent mb-3">
                Technology Insights & Business Strategy
              </h1>
              <p className="text-lg text-gray-300 max-w-2xl leading-relaxed mx-auto">
                Latest insights on technology consulting, AI integration, and business growth strategies
              </p>
            </div>
          </div>
            
          {/* Enhanced Search Interface */}
          <div className="max-w-lg mx-auto relative">
            <div className="relative bg-gray-900 border border-gray-700 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-200 hover:border-[#C8A466]/50">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#C8A466] w-5 h-5" />
              <Input
                type="text"
                placeholder="Search articles, tutorials, insights..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-12 py-4 bg-transparent border-0 text-gray-100 placeholder-gray-400 focus:ring-0 focus:border-0 text-lg"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                >
                  ✕
                </Button>
              )}
            </div>
            
            {/* Search Results Summary */}
            {searchQuery.length > 0 && (
              <div className="mt-3 text-center">
                {isSearching ? (
                  <span className="text-[#C8A466] text-sm">Searching...</span>
                ) : searchResults.length === 0 ? (
                  <span className="text-yellow-400 text-sm">
                    {searchQuery.length < 3 ? 'Type at least 3 characters to search' : `No results found for "${searchQuery}"`}
                  </span>
                ) : (
                  <span className="text-green-400 text-sm">
                    Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Blog Posts */}
          <div id="blog-posts-section" className="lg:col-span-2">
            {displayPosts.length === 0 ? (
              <Card className="bg-gray-900 border-gray-800 shadow-2xl">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#163253] to-[#2C4A6E] rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-100">
                    {searchQuery ? `No results for "${searchQuery}"` : "No posts found"}
                  </h3>
                  <p className="text-gray-400">
                    {searchQuery ? "Try different keywords or browse all articles below." : "We're working on some great content. Check back soon!"}
                  </p>
                  {searchQuery && (
                    <Button 
                      onClick={() => setSearchQuery("")}
                      variant="outline"
                      className="mt-4 border-gray-700 text-gray-300 hover:bg-gray-800"
                    >
                      Clear Search
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {displayPosts.map((post: BlogPost) => (
                  <Card key={post.id} className="bg-gray-900 border-gray-800 shadow-xl hover:shadow-2xl hover:border-gray-700 transition-all duration-200 overflow-hidden">
                    {post.featuredImage && (
                      <div className="aspect-video bg-gray-200">
                        <img 
                          src={post.featuredImage} 
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {post.publishedAt && formatDate(post.publishedAt)}
                        </div>
                        {post.readingTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {post.readingTime}
                          </div>
                        )}
                        <Badge variant="secondary" className="bg-[#163253]/30 text-[#C8A466] border-[#C8A466]/30">
                          {post.author}
                        </Badge>
                      </div>
                      
                      <Link href={`/blog/${post.slug}`}>
                        <h2 className="text-xl font-bold mb-3 text-gray-100 hover:text-[#C8A466] transition-colors cursor-pointer">
                          {post.title}
                        </h2>
                      </Link>
                      
                      <p className="text-gray-300 mb-4 leading-relaxed">
                        {maskContent(post.excerpt || post.content, 200)}
                      </p>
                      
                      {post.tags && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {getTags(post.tags).slice(0, 4).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs bg-gray-800 text-gray-300 border-gray-600">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <Link href={`/blog/${post.slug}`}>
                        <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-[#163253] hover:text-white hover:border-[#2C4A6E]">
                          Read More →
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Category Navigation */}
            <div data-section="categories">
              {/* Subscription Anchor - positioned at Blog Categories for mobile UX */}
              <div id="subscription" className="scroll-mt-16">
                <CategoryNavigation 
                  onCategorySelect={handleCategorySelect}
                  selectedCategory={selectedCategory}
                  selectedSubcategory={selectedSubcategory}
                />
              </div>
            </div>

            {/* RSS Feed Subscription */}
            <Card className="bg-gray-900 border-gray-800 shadow-xl">
              <CardHeader className="border-b border-gray-800 pb-4">
                <CardTitle className="flex items-center gap-3 text-gray-100">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg flex items-center justify-center">
                    <Rss className="w-4 h-4 text-white" />
                  </div>
                  RSS Feed
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-300 mb-4">
                  Subscribe to our RSS feed to get instant updates when new articles are published. Compatible with all RSS readers and podcast apps.
                </p>
                <div className="space-y-3">
                  <a 
                    href="/api/rss" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-medium rounded-md transition-all duration-200"
                  >
                    <Rss className="w-4 h-4" />
                    Subscribe to RSS Feed
                  </a>
                  <div className="text-xs text-gray-400 text-center space-y-1">
                    <p>✅ W3C Validated • ✅ Podcast Compatible</p>
                    <p className="text-[10px]">RSS Advisory Board Certified</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Newsletter Signup */}
            <Card className="bg-gray-900 border-gray-800 shadow-xl">
              <CardHeader className="border-b border-gray-800 pb-4">
                <CardTitle className="flex items-center gap-3 text-gray-100">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  Email Updates
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-300 mb-4">
                  Get curated insights on AI, eCommerce, and business strategy delivered to your inbox.
                </p>
                <div className="space-y-3">
                  <Input
                    type="text"
                    placeholder="Your name"
                    value={emailSubscription.name}
                    onChange={(e) => setEmailSubscription(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-gray-800 border-gray-700 text-gray-100"
                  />
                  <Input
                    type="email"
                    placeholder="your.email@example.com"
                    value={emailSubscription.email}
                    onChange={(e) => setEmailSubscription(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-gray-800 border-gray-700 text-gray-100"
                  />
                  <Button 
                    onClick={handleSubscribe}
                    disabled={subscribeMutation.isPending}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {subscribeMutation.isPending ? "Subscribing..." : "Subscribe"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Popular Topics */}
            <Card className="bg-gray-900 border-gray-800 shadow-xl">
              <CardHeader className="border-b border-gray-800 pb-4">
                <CardTitle className="flex items-center gap-3 text-gray-100">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg flex items-center justify-center">
                    <Tag className="w-4 h-4 text-white" />
                  </div>
                  Popular Topics
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(
                    posts.flatMap((post: BlogPost) => getTags(post.tags))
                  )).slice(0, 15).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700 transition-colors">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* About */}
            <Card className="bg-gray-900 border-gray-800 shadow-xl">
              <CardHeader className="border-b border-gray-800 pb-4">
                <CardTitle className="flex items-center gap-3 text-gray-100">
                  <div className="w-8 h-8 bg-gradient-to-r from-[#163253] to-[#2C4A6E] rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold text-white">uAI</span>
                  </div>
                  About Up Arrow Inc
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-300 leading-relaxed mb-4">
                  We're a technology consulting firm specializing in AI integration, 
                  eCommerce solutions, and business strategy. Our insights help businesses 
                  leverage technology for competitive advantage.
                </p>
                <Link href="/contact">
                  <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-[#163253] hover:text-white hover:border-[#2C4A6E]">
                    Get In Touch
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Enhanced JSON-LD for SEO */}
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            "name": "Up Arrow Inc Technology Blog",
            "description": "Technology insights, AI integration strategies, and business consulting advice",
            "url": "https://ai.uparrowinc.com/blog",
            "publisher": {
              "@type": "Organization",
              "name": "Up Arrow Inc",
              "url": "https://ai.uparrowinc.com",
              "logo": {
                "@type": "ImageObject",
                "url": "https://ai.uparrowinc.com/logo.png"
              }
            },
            "blogPost": posts.map((post: BlogPost) => ({
              "@type": "BlogPosting",
              "headline": post.title,
              "description": post.excerpt || post.content.substring(0, 160).replace(/<[^>]*>/g, '') + "...",
              "url": `https://ai.uparrowinc.com/blog/${post.slug.toLowerCase()}`,
              "datePublished": post.publishedAt,
              "dateModified": post.publishedAt,
              "image": post.featuredImage ? [post.featuredImage] : [],
              "keywords": post.tags ? post.tags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0) : [],
              "author": {
                "@type": "Organization",
                "name": post.author
              }
            }))
          })
        }}
      />
    </div>
  );
}