import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Tag, ArrowLeft, Share2 } from "lucide-react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { VideoPlayer } from "@/components/media/VideoPlayer";
import { AudioPlayer } from "@/components/media/AudioPlayer";
import { YouTubeEmbed, extractYouTubeId } from "@/components/media/YouTubeEmbed";
import { Breadcrumb, generateBlogBreadcrumbs } from "@/components/Breadcrumb";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string | null;
  category?: string;
  subcategory?: string;
  author: string;
  published: boolean;
  publishedAt: string | null;
  tags: string | null;
  readingTime: string | null;
}

export default function BlogPostView() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  // Fetch specific blog post by slug
  const { data: post, isLoading, error } = useQuery<BlogPost>({
    queryKey: [`/api/blog/posts/${slug}`],
    enabled: !!slug,
  });

  // Set up SEO meta tags and canonical link
  useEffect(() => {
    if (post) {
      // Set page title
      document.title = `${post.title} | Up Arrow Inc Blog`;
      
      // Remove existing meta tags
      const existingMeta = document.querySelectorAll('meta[name="description"], meta[property^="og:"], meta[name="twitter:"], link[rel="canonical"]');
      existingMeta.forEach(tag => tag.remove());
      
      // Create canonical URL (always use HTTPS and lowercase for consistency)
      const canonicalUrl = `https://ai.uparrowinc.com/blog/${post.slug.toLowerCase()}`;
      
      // Add canonical link
      const canonical = document.createElement('link');
      canonical.rel = 'canonical';
      canonical.href = canonicalUrl;
      document.head.appendChild(canonical);
      
      // Add meta description (160 char limit)
      const metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      const maskedExcerpt = post.excerpt.length > 160 
        ? post.excerpt.substring(0, 160) + '...' 
        : post.excerpt;
      metaDescription.content = maskedExcerpt;
      document.head.appendChild(metaDescription);
      
      // Add Open Graph tags
      const ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      ogTitle.content = post.title;
      document.head.appendChild(ogTitle);
      
      const ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      ogDescription.content = maskedExcerpt;
      document.head.appendChild(ogDescription);
      
      const ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      ogUrl.content = canonicalUrl;
      document.head.appendChild(ogUrl);
      
      const ogType = document.createElement('meta');
      ogType.setAttribute('property', 'og:type');
      ogType.content = 'article';
      document.head.appendChild(ogType);
      
      // Add Twitter Card tags
      const twitterCard = document.createElement('meta');
      twitterCard.name = 'twitter:card';
      twitterCard.content = 'summary_large_image';
      document.head.appendChild(twitterCard);
      
      const twitterTitle = document.createElement('meta');
      twitterTitle.name = 'twitter:title';
      twitterTitle.content = post.title;
      document.head.appendChild(twitterTitle);
      
      const twitterDescription = document.createElement('meta');
      twitterDescription.name = 'twitter:description';
      twitterDescription.content = maskedExcerpt;
      document.head.appendChild(twitterDescription);
    }
    
    // Cleanup function
    return () => {
      document.title = 'Up Arrow Inc - Technology Consulting';
    };
  }, [post]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Validate the date is reasonable (between 2000 and 2100)
      const year = date.getFullYear();
      if (isNaN(year) || year < 2000 || year > 2100) {
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



  const extractYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const extractRumbleId = (url: string) => {
    const match = url.match(/rumble\.com\/(?:embed\/)?(?:v|videos?)\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  // Parse content and render with embedded media
  const renderContentWithMedia = (content: string) => {
    if (!content || content.trim() === '') {
      return <p>No content available.</p>;
    }
    
    const parts: (string | React.ReactElement)[] = [];
    let lastIndex = 0;
    
    // Find all audio embeds
    const audioRegex = /\[audio:([^\]]+)\]/g;
    let match;
    
    while ((match = audioRegex.exec(content)) !== null) {
      // Add content before this match
      if (match.index > lastIndex) {
        const beforeContent = content.slice(lastIndex, match.index);
        const html = marked.parse(beforeContent) as string;
        parts.push(
          <div 
            key={`content-${lastIndex}`}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
          />
        );
      }
      
      // Parse audio parameters
      const src = match[1];
      const isProtected = src.includes('protected=true');
      const titleMatch = src.match(/title=([^&]+)/);
      const artistMatch = src.match(/artist=([^&]+)/);
      const title = titleMatch ? decodeURIComponent(titleMatch[1].replace(/'/g, '')) : 'Audio';
      const artist = artistMatch ? decodeURIComponent(artistMatch[1].replace(/'/g, '')) : undefined;
      const cleanSrc = src.split('&')[0];
      
      // Add audio player
      parts.push(
        <div key={`audio-${match.index}`} className="my-8">
          <AudioPlayer
            src={`/attached_assets/${cleanSrc}`}
            title={title}
            artist={artist}
            protected={isProtected}
            type="podcast"
            className="bg-gray-800 border-gray-700"
          />
        </div>
      );
      
      lastIndex = audioRegex.lastIndex;
    }
    
    // Add remaining content
    if (lastIndex < content.length) {
      const remainingContent = content.slice(lastIndex);
      const html = marked.parse(remainingContent) as string;
      parts.push(
        <div 
          key={`content-${lastIndex}`}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
        />
      );
    }
    
    return <>{parts}</>;
  };

  const sharePost = async () => {
    if (navigator.share && post) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href,
        });
      } catch (error) {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(window.location.href);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 bg-gray-900 border-gray-800 shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <ArrowLeft className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-100 mb-4">Article Not Found</h2>
            <p className="text-gray-300 mb-6">The article you're looking for doesn't exist or has been removed.</p>
            <Button asChild className="bg-gradient-to-r from-[#163253] to-[#2C4A6E] hover:from-[#1F3D66] hover:to-[#3C5A7E] border border-[#C8A466]/20">
              <Link href="/blog">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Generate breadcrumbs based on post title and content
  const getBreadcrumbsFromPost = (post: BlogPost) => {
    // Analyze post title and tags to determine category/subcategory
    const title = post.title.toLowerCase();
    const tags = getTags(post.tags);
    
    let category = 'general';
    let subcategory = null;
    
    // Determine category from title and tags
    if (title.includes('pci') || title.includes('compliance') || tags.some(tag => tag.toLowerCase().includes('pci'))) {
      category = 'ecommerce';
      subcategory = 'pci-compliance';
    } else if (title.includes('digital transformation') || tags.some(tag => tag.toLowerCase().includes('digital transformation'))) {
      category = 'consulting';
      subcategory = 'digital-transformation';
    } else if (title.includes('ssl') || title.includes('certificate')) {
      category = 'ecommerce';
      subcategory = 'ssl-certificates';
    } else if (title.includes('api') || title.includes('integration')) {
      category = 'development';
      subcategory = 'api-integration';
    } else if (title.includes('cloud') || title.includes('migration')) {
      category = 'consulting';
      subcategory = 'cloud-migration';
    } else if (tags.some(tag => ['security', 'cybersecurity'].includes(tag.toLowerCase()))) {
      category = 'security';
      subcategory = 'cybersecurity';
    } else if (tags.some(tag => ['ecommerce', 'e-commerce'].includes(tag.toLowerCase()))) {
      category = 'ecommerce';
    } else if (tags.some(tag => ['consulting'].includes(tag.toLowerCase()))) {
      category = 'consulting';
    } else if (tags.some(tag => ['development'].includes(tag.toLowerCase()))) {
      category = 'development';
    }
    
    return generateBlogBreadcrumbs(category, subcategory, post.title);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Breadcrumb Navigation */}
          <Breadcrumb items={getBreadcrumbsFromPost(post)} />
          
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild className="text-gray-300 hover:text-white hover:bg-gray-800">
              <Link href="/blog">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Link>
            </Button>
            <Button variant="outline" onClick={sharePost} className="border-gray-700 text-gray-300 hover:bg-[#163253] hover:text-white hover:border-[#2C4A6E]">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-4 py-8">
        {/* Featured Image */}
        {post.featuredImage && (
          <div className="mb-8 rounded-lg overflow-hidden">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-64 object-cover"
            />
          </div>
        )}

        {/* Article Header */}
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#E8EDF2] via-[#C8A466] to-[#E8EDF2] bg-clip-text text-transparent mb-6 leading-tight">
            {post.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-8">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{post.publishedAt && formatDate(post.publishedAt)}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{post.readingTime || '5 min read'}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span className="text-gray-300">By {post.author}</span>
            </div>
          </div>

          {/* Tags */}
          {post.tags && (
            <div className="flex flex-wrap gap-2 mb-8">
              {getTags(post.tags).map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700 transition-colors">
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Excerpt */}
          <div className="text-xl text-gray-300 leading-relaxed border-l-4 border-gradient-to-b from-blue-500 to-purple-500 pl-6 bg-gradient-to-r from-blue-600/10 to-purple-600/10 p-6 rounded-r-lg border border-gray-800">
            {post.excerpt}
          </div>
        </header>

        {/* Article Content */}
        <div className="prose prose-lg prose-invert max-w-none">
          {renderContentWithMedia(post.content)}
        </div>
      </article>

      {/* Back to Blog CTA */}
      <div className="max-w-4xl mx-auto px-4 py-12 border-t border-gray-800">
        <div className="text-center">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-100 mb-4">Continue Reading</h3>
            <p className="text-gray-300 mb-6">Explore more insights on technology, AI integration, and business strategy</p>
            <Button asChild size="lg" className="bg-gradient-to-r from-[#163253] to-[#2C4A6E] hover:from-[#1F3D66] hover:to-[#3C5A7E] border border-[#C8A466]/20 shadow-lg shadow-[#163253]/40">
              <Link href="/blog#subscription">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Read More Articles
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced JSON-LD for Individual Blog Post SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post.title,
            "description": post.excerpt || post.content.substring(0, 160).replace(/<[^>]*>/g, '') + "...",
            "url": `https://ai.uparrowinc.com/blog/${post.slug.toLowerCase()}`,
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `https://ai.uparrowinc.com/blog/${post.slug.toLowerCase()}`
            },
            "datePublished": post.publishedAt,
            "dateModified": post.publishedAt,
            "image": post.featuredImage ? [post.featuredImage] : [],
            "author": {
              "@type": "Person",
              "name": post.author || "Up Arrow Inc"
            },
            "publisher": {
              "@type": "Organization",
              "name": "Up Arrow Inc",
              "logo": {
                "@type": "ImageObject",
                "url": "https://ai.uparrowinc.com/logo.png"
              }
            },
            "keywords": post.tags ? post.tags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0) : [],
            "articleSection": post.category || "General",
            "wordCount": post.content ? post.content.replace(/<[^>]*>/g, "").split(/\s+/).filter(word => word.length > 0).length : 0
          })
        }}
      />
    </div>
  );
}