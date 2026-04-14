import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/ui/date-picker";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash, Eye, Upload, Send, Menu, Home, X } from "lucide-react";
import { AdminSessionMonitor } from "../components/AdminSessionMonitor";
import { MediaUpload } from "../components/MediaUpload";
import { BackupManager } from "../components/BackupManager";
import { SecurityDashboard } from "../components/SecurityDashboard";
import { ImageGenerator } from "../components/ImageGenerator";
import { CategoryManager } from "../components/CategoryManager";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string | null;
  audioUrl: string | null;
  audioDuration: string | null;
  audioTitle: string | null;
  postType: string | null;
  author: string;
  published: boolean;
  publishedAt: string | null;
  scheduledFor: string | null;
  createdAt: string;
  tags: string | null;
  category: string | null;
  subcategory: string | null;
  metaDescription: string | null;
  seoTitle: string | null;
  readingTime: string | null;
}

interface EmailSubscriber {
  id: number;
  email: string;
  name: string | null;
  subscribed: boolean;
  subscribedAt: string;
}

interface AuthStatus {
  authenticated: boolean;
  user?: {
    username: string;
  };
}

export default function BlogAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [newPost, setNewPost] = useState<Partial<BlogPost>>({
    title: "",
    excerpt: "",
    content: "",
    featuredImage: "",
    audioUrl: "",
    audioDuration: "",
    audioTitle: "",
    postType: "article",
    tags: "",
    category: "",
    subcategory: "",
    metaDescription: "",
    seoTitle: "",
    published: false,
    publishedAt: null,
    scheduledFor: null
  });

  // Check authentication status first
  const { data: authStatus, isLoading: authLoading, error: authError } = useQuery<AuthStatus>({
    queryKey: ["/api/session"],
    retry: false,
  });

  // Handle authentication redirect
  useEffect(() => {
    if (!authLoading && authError) {
      // If there's an authentication error, redirect to login
      console.log('Authentication failed, redirecting to login page');
      window.location.href = '/admin-login';
    }
  }, [authLoading, authError]);

  // Fetch blog posts
  const { data: posts = [] } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog/posts"],
  });

  // Fetch email subscribers
  const { data: subscribers = [] } = useQuery<EmailSubscriber[]>({
    queryKey: ["/api/blog/subscribers"],
  });

  // Fetch categories for form selection
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/blog/categories"],
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: Partial<BlogPost>) => {
      console.log('Creating post with data:', postData);
      console.log('Auth status before creation:', authStatus);
      
      // Check auth status before making the request
      const sessionCheck = await apiRequest("GET", "/api/session");
      console.log('Session check before post creation:', await sessionCheck.json());
      
      const response = await apiRequest("POST", "/api/blog/posts", postData);
      console.log('Post creation response:', response);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog/posts"] });
      setNewPost({
        title: "",
        excerpt: "",
        content: "",
        featuredImage: "",
        audioUrl: "",
        audioDuration: "",
        audioTitle: "",
        postType: "article",
        tags: "",
        category: "",
        subcategory: "",
        metaDescription: "",
        seoTitle: "",
        published: false,
        scheduledFor: null
      });
      toast({ title: "Post created successfully!" });
      setActiveTab("posts");
    },
    onError: (error: any) => {
      console.error('Blog post creation error:', error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Unknown error occurred';
      toast({ title: "Failed to create post", description: errorMessage, variant: "destructive" });
    }
  });

  // Update post mutation
  const updatePostMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<BlogPost> }) => {
      return await apiRequest("PUT", `/api/blog/posts/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog/posts"] });
      setIsEditing(false);
      setSelectedPost(null);
      toast({ title: "Post updated successfully!" });
    },
    onError: (error: any) => {
      console.error('Blog post update error:', error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Unknown error occurred';
      toast({ title: "Failed to update post", description: errorMessage, variant: "destructive" });
    }
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/blog/posts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog/posts"] });
      toast({ title: "Post deleted successfully!" });
    },
    onError: (error: any) => {
      console.error('Blog post deletion error:', error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Unknown error occurred';
      toast({ title: "Failed to delete post", description: errorMessage, variant: "destructive" });
    }
  });

  // Send newsletter mutation
  const sendNewsletterMutation = useMutation({
    mutationFn: async (postId: number) => {
      return await apiRequest("POST", `/api/blog/newsletter/${postId}`);
    },
    onSuccess: () => {
      toast({ title: "Newsletter sent successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to send newsletter", variant: "destructive" });
    }
  });

  const handleCreatePost = () => {
    if (!newPost.title || !newPost.content) {
      toast({ title: "Title and content are required", variant: "destructive" });
      return;
    }
    createPostMutation.mutate(newPost);
  };

  const handleUpdatePost = () => {
    if (!selectedPost || !newPost.title || !newPost.content) {
      toast({ title: "Missing required fields", variant: "destructive" });
      return;
    }

    console.log("🔄 Updating post ID", selectedPost.id, "with data:", newPost);

    updatePostMutation.mutate({
      id: selectedPost.id,
      data: newPost,
    });
  };

  // Debug effect to log state changes
  useEffect(() => {
    console.log('🔄 newPost state changed:', newPost);
    console.log('📝 isEditing:', isEditing);
    console.log('📋 selectedPost:', selectedPost);
  }, [newPost, isEditing, selectedPost]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (title: string) => {
    const slug = generateSlug(title);
    setNewPost(prev => ({ ...prev, title, slug }));
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show login message if not authenticated
  if (!authStatus?.authenticated) {
    return (
      <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Authentication Required</h2>
          <p className="text-gray-400 mb-6">You need to log in to access the blog admin panel.</p>
          <Button 
            onClick={() => window.location.href = '/admin-login'}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <div className="container-wide section-padding">
        {/* Enhanced Header with Hamburger Menu */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-16 pb-8 border-b border-gray-800/50">
          <div className="flex items-center justify-between w-full lg:w-auto mb-6 lg:mb-0">
            <div className="flex items-center gap-6">
              {/* uAI Logo */}
              <img 
                src="/attached_assets/image_1753753865238.png" 
                alt="uAI - AI Intelligence Hub" 
                className="w-48 h-48 opacity-90 hover:opacity-100 transition-opacity duration-300"
              />
              <div>
                <h1 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 bg-clip-text text-transparent mb-4">
                  Blog Admin
                </h1>
                <p className="text-xl text-gray-400">Intelligent content management system</p>
                {authStatus && (
                  <p className="text-sm mt-2 text-green-400">
                    Auth Status: {authStatus.authenticated ? `✓ Logged in as ${authStatus.user?.username}` : '✗ Not authenticated'}
                  </p>
                )}
                <div className="h-1 w-32 bg-gradient-to-r from-blue-500 to-purple-600 mt-4"></div>
              </div>
            </div>
            
            {/* Hamburger Menu Button */}
            <Button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              variant="outline"
              size="sm"
              className="lg:hidden border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white hover:border-gray-600"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800/50 hover:text-white hover:border-gray-600 px-8 py-3 text-lg font-medium transition-all duration-300 hover:scale-105"
            >
              <Home className="w-5 h-5 mr-3" />
              Home
            </Button>
            <Button 
              onClick={() => setActiveTab("create")}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 shadow-lg shadow-blue-500/25 px-8 py-3 text-lg font-medium transition-all duration-300 hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-3" />
              Create Post
            </Button>
            <Button 
              onClick={() => window.open('/blog', '_blank')} 
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800/50 hover:text-white hover:border-gray-600 px-8 py-3 text-lg font-medium transition-all duration-300 hover:scale-105"
            >
              <Eye className="w-5 h-5 mr-3" />
              View Blog
            </Button>
          </div>

          {/* Mobile Navigation Menu */}
          {isMenuOpen && (
            <div className="lg:hidden w-full mt-6 p-4 bg-gray-900 border border-gray-800 rounded-lg shadow-xl">
              <div className="space-y-3">
                <Button 
                  onClick={() => {
                    window.location.href = '/';
                    setIsMenuOpen(false);
                  }}
                  variant="outline"
                  className="w-full justify-start border-gray-700 text-gray-300 hover:bg-gray-800/50 hover:text-white hover:border-gray-600"
                >
                  <Home className="w-5 h-5 mr-3" />
                  Home
                </Button>
                <Button 
                  onClick={() => {
                    setActiveTab("create");
                    setIsMenuOpen(false);
                  }}
                  className="w-full justify-start bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0"
                >
                  <Plus className="w-5 h-5 mr-3" />
                  Create Post
                </Button>
                <Button 
                  onClick={() => {
                    window.open('/blog', '_blank');
                    setIsMenuOpen(false);
                  }} 
                  variant="outline"
                  className="w-full justify-start border-gray-700 text-gray-300 hover:bg-gray-800/50 hover:text-white hover:border-gray-600"
                >
                  <Eye className="w-5 h-5 mr-3" />
                  View Blog
                </Button>
              </div>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          {/* Mobile-Responsive Tab Navigation */}
          <div className="overflow-x-auto">
            <TabsList className="flex w-full min-w-fit bg-gray-900 border border-gray-800 p-1 rounded-lg space-x-1">
              <TabsTrigger 
                value="posts" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-400 hover:text-gray-200 font-medium whitespace-nowrap px-3 py-2 text-sm"
              >
                Posts ({posts.length})
              </TabsTrigger>
              <TabsTrigger 
                value="create"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-400 hover:text-gray-200 font-medium whitespace-nowrap px-3 py-2 text-sm"
              >
                Create New
              </TabsTrigger>
              <TabsTrigger 
                value="categories"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-400 hover:text-gray-200 font-medium whitespace-nowrap px-3 py-2 text-sm"
              >
                <span className="hidden sm:inline">📁 Categories</span>
                <span className="sm:hidden">📁</span>
              </TabsTrigger>
              <TabsTrigger 
                value="subscribers"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-400 hover:text-gray-200 font-medium whitespace-nowrap px-3 py-2 text-sm"
              >
                <span className="hidden sm:inline">Subscribers</span>
                <span className="sm:hidden">Subs</span> ({subscribers.length})
              </TabsTrigger>
              <TabsTrigger 
                value="analytics"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-400 hover:text-gray-200 font-medium whitespace-nowrap px-3 py-2 text-sm"
              >
                <span className="hidden sm:inline">Analytics</span>
                <span className="sm:hidden">📊</span>
              </TabsTrigger>
              <TabsTrigger 
                value="sessions"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-400 hover:text-gray-200 font-medium whitespace-nowrap px-3 py-2 text-sm"
              >
                <span className="hidden sm:inline">🔐 Sessions</span>
                <span className="sm:hidden">🔐</span>
              </TabsTrigger>
              <TabsTrigger 
                value="backups"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-400 hover:text-gray-200 font-medium whitespace-nowrap px-3 py-2 text-sm"
              >
                <span className="hidden sm:inline">💾 Backups</span>
                <span className="sm:hidden">💾</span>
              </TabsTrigger>
              <TabsTrigger 
                value="security"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-400 hover:text-gray-200 font-medium whitespace-nowrap px-3 py-2 text-sm"
              >
                <span className="hidden sm:inline">🛡️ Security</span>
                <span className="sm:hidden">🛡️</span>
              </TabsTrigger>
              <TabsTrigger 
                value="images"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-400 hover:text-gray-200 font-medium whitespace-nowrap px-3 py-2 text-sm"
              >
                <span className="hidden sm:inline">🎨 Images</span>
                <span className="sm:hidden">🎨</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Posts Management */}
          <TabsContent value="posts" className="space-y-6">
            {posts.length === 0 ? (
              <Card className="bg-gray-900 border-gray-800 shadow-2xl">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-6">
                      <Plus className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-gray-100">No blog posts yet</h3>
                    <p className="text-gray-400 mb-6 max-w-md">Ready to share your insights? Create your first AI-powered blog post and start engaging with your audience.</p>
                    <Button 
                      onClick={() => setActiveTab("create")}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 shadow-lg shadow-blue-500/25"
                    >
                      Create Your First Post
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {posts.map((post: BlogPost) => (
                <Card key={post.id} className="bg-gray-900 border-gray-800 shadow-xl hover:shadow-2xl transition-all duration-200 hover:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-100">{post.title}</h3>
                          <Badge 
                            variant={post.published ? "default" : "secondary"}
                            className={post.published 
                              ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0" 
                              : "bg-gray-700 text-gray-300 border-gray-600"
                            }
                          >
                            {post.published ? "Published" : "Draft"}
                          </Badge>
                        </div>
                        <p className="text-gray-300 mb-3 leading-relaxed">{post.excerpt}</p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            {post.author}
                          </span>
                          <span>{post.readingTime}</span>
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                          {post.tags && (
                            <span className="px-2 py-1 bg-gray-800 rounded-md text-xs">
                              {post.tags}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Action buttons - vertical on mobile, horizontal on desktop */}
                      <div className="flex flex-col sm:flex-row gap-2 sm:ml-6">
                        {post.published && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendNewsletterMutation.mutate(post.id)}
                            disabled={sendNewsletterMutation.isPending}
                            title="Send Newsletter"
                            className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white hover:border-gray-600 justify-start sm:justify-center"
                          >
                            <Send className="w-4 h-4 sm:mr-0" />
                            <span className="ml-2 sm:hidden">Send Newsletter</span>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log('✏️ Editing post:', post.id);
                            console.log('📋 Post data:', post);
                            
                            // Helper function to decode HTML entities
                            const decodeHtmlEntities = (str: string | null) => {
                              if (!str) return "";
                              return str.replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => 
                                String.fromCharCode(parseInt(hex, 16))
                              ).replace(/&#(\d+);/g, (match, dec) => 
                                String.fromCharCode(parseInt(dec, 10))
                              );
                            };
                            
                            const editData = {
                              title: post.title || "",
                              slug: post.slug || "",
                              excerpt: post.excerpt || "",
                              content: post.content || "",
                              featuredImage: decodeHtmlEntities(post.featuredImage),
                              audioUrl: post.audioUrl || "",
                              audioDuration: post.audioDuration || "",
                              audioTitle: post.audioTitle || "",
                              postType: post.postType || "article",
                              tags: post.tags || "",
                              category: post.category || "",
                              subcategory: post.subcategory || "",
                              metaDescription: post.metaDescription || "",
                              seoTitle: post.seoTitle || "",
                              published: post.published || false,
                              publishedAt: post.publishedAt || null,
                              scheduledFor: post.scheduledFor || null,
                              author: post.author || 'Up Arrow Inc',
                            };
                            
                            console.log('📝 Setting newPost to:', editData);
                            console.log('🏷️ Category value:', editData.category);
                            console.log('🏷️ Subcategory value:', editData.subcategory);
                            console.log('📊 Available categories:', categories);
                            setNewPost(editData);

                            setSelectedPost(post); // just to store the ID
                            setIsEditing(true);
                            setActiveTab("create");
                            toast({ title: "✏️ Editing Post", description: `Now editing: ${post.title}` });
                          }}
                          title="Edit Post - Opens in Creation Form"
                          className="border-blue-500 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 justify-start sm:justify-center font-medium shadow-sm"
                        >
                          <Edit className="w-4 h-4 sm:mr-0" />
                          <span className="ml-2 sm:hidden font-medium">✏️ Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deletePostMutation.mutate(post.id)}
                          title="Delete Post"
                          className="border-red-700 text-red-400 hover:bg-red-600 hover:text-white hover:border-red-600 justify-start sm:justify-center"
                        >
                          <Trash className="w-4 h-4 sm:mr-0" />
                          <span className="ml-2 sm:hidden">Delete Post</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Create New Post */}
          <TabsContent value="create" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800 shadow-2xl" key={isEditing ? `edit-${selectedPost?.id}` : 'create'}>
              <CardHeader className="border-b border-gray-800 pb-4">
                <CardTitle className="text-xl text-gray-100 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    {isEditing ? <Edit className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />}
                  </div>
                  {isEditing ? "Edit Blog Post" : "Create New Blog Post"}
                </CardTitle>
                {isEditing && (
                  <p className="text-gray-400 text-sm">
                    Editing: {selectedPost?.title}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="title" className="text-gray-200 font-medium">Title</Label>
                    <Input
                      id="title"
                      value={newPost.title || ""}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Enter post title"
                      className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug" className="text-gray-200 font-medium">Slug (URL)</Label>
                    <Input
                      id="slug"
                      value={newPost.slug || ""}
                      onChange={(e) => setNewPost(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="auto-generated-from-title"
                      className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="excerpt" className="text-gray-200 font-medium">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    value={newPost.excerpt || ""}
                    onChange={(e) => setNewPost(prev => ({ ...prev, excerpt: e.target.value }))}
                    placeholder="Brief description of the post"
                    rows={3}
                    className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <Label htmlFor="content" className="text-gray-200 font-medium">Content (Markdown)</Label>
                  <Textarea
                    id="content"
                    value={newPost.content || ""}
                    onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="# Your Blog Post Title

Write your blog post content in **Markdown** format...

## Key Points
- Use **bold** and *italic* text
- Add [links](https://example.com)
- Create lists and headers
- Insert code blocks with ```

![Image Alt Text](image-url.jpg)"
                    rows={15}
                    className="font-mono text-sm bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                  <p className="text-xs text-gray-400 mt-2 bg-gray-800 p-2 rounded border border-gray-700">
                    💡 Markdown tips: **bold**, *italic*, [links](url), # headers, - lists, ```code```
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="postType" className="text-gray-200 font-medium">Content Type</Label>
                    <select
                      id="postType"
                      value={newPost.postType || "article"}
                      onChange={(e) => setNewPost(prev => ({ ...prev, postType: e.target.value }))}
                      className="flex h-9 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1 text-sm shadow-sm transition-colors text-gray-100 focus:border-blue-500 focus:ring-blue-500/20"
                    >
                      <option value="article">📝 Article</option>
                      <option value="radio">📻 Radio Show</option>
                      <option value="podcast">🎙️ Podcast</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category" className="text-gray-200 font-medium">Category</Label>
                      <select
                        id="category"
                        value={newPost.category || ""}
                        onChange={(e) => {
                          const selectedCategory = e.target.value;
                          setNewPost(prev => ({ ...prev, category: selectedCategory, subcategory: "" }));
                        }}
                        className="flex h-9 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1 text-sm shadow-sm transition-colors text-gray-100 focus:border-blue-500 focus:ring-blue-500/20"
                      >
                        <option value="">Select Category</option>
                        {categories.map((category: any) => (
                          <option key={category.slug} value={category.slug}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="subcategory" className="text-gray-200 font-medium">Subcategory</Label>
                      <select
                        id="subcategory"
                        value={newPost.subcategory || ""}
                        onChange={(e) => setNewPost(prev => ({ ...prev, subcategory: e.target.value }))}
                        className="flex h-9 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1 text-sm shadow-sm transition-colors text-gray-100 focus:border-blue-500 focus:ring-blue-500/20"
                        disabled={!newPost.category}
                      >
                        <option value="">Select Subcategory</option>
                        {(() => {
                          const selectedCategorySlug = newPost.category;
                          const selectedCategory = categories.find((cat: any) => cat.slug === selectedCategorySlug);
                          return selectedCategory?.subcategories?.map((sub: any) => (
                            <option key={sub.slug} value={sub.slug}>
                              {sub.name}
                            </option>
                          )) || [];
                        })()}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="tags" className="text-gray-200 font-medium">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={newPost.tags || ""}
                      onChange={(e) => setNewPost(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="technology, consulting, business"
                      className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <Label htmlFor="featuredImage" className="text-gray-200 font-medium">Featured Image URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="featuredImage"
                        value={newPost.featuredImage || ""}
                        onChange={(e) => setNewPost(prev => ({ ...prev, featuredImage: e.target.value }))}
                        placeholder="https://your-image-url.com/image.jpg"
                        className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
                      />
                      <Button
                        type="button"
                        onClick={() => setActiveTab("images")}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0 px-3 whitespace-nowrap"
                      >
                        🎨 Create
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      💡 Use the Images tab to generate professional featured images automatically
                    </p>
                  </div>

                  {/* Audio Fields for Radio/Podcast */}
                  {(newPost.postType === "radio" || newPost.postType === "podcast") && (
                    <div className="space-y-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
                      <h4 className="font-medium text-gray-200">🎙️ Audio Content</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <MediaUpload
                            label="Audio File"
                            acceptedTypes="audio/*"
                            maxSize={100 * 1024 * 1024} // 100MB
                            currentUrl={newPost.audioUrl || ""}
                            onUploadComplete={(url, filename) => {
                              setNewPost(prev => {
                                // Extract filename from URL or use provided filename
                                const audioFilename = filename || url.split('/').pop() || '';
                                
                                // Clean up filename for embed (remove path prefixes)
                                const cleanFilename = audioFilename.replace('/api/media/audio/stream?file=', '').replace('/attached_assets/', '');
                                
                                // Create audio title (use existing or derive from filename)
                                const audioTitle = prev.audioTitle || 
                                  (filename ? filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ') : prev.title) ||
                                  'Audio Content';
                                
                                // Create audio embed syntax
                                const audioEmbedSyntax = `[audio:${cleanFilename}&title=${encodeURIComponent(audioTitle)}&artist=${encodeURIComponent('Up Arrow Inc')}]`;
                                
                                // Auto-insert audio embed into content if not already present
                                let updatedContent = prev.content || '';
                                
                                if (!updatedContent.includes('[audio:') && cleanFilename) {
                                  // Find placement at top or after first title section
                                  const contentLines = updatedContent.split('\n');
                                  let insertIndex = 0;
                                  
                                  // Look for the first main heading (# title)
                                  for (let i = 0; i < contentLines.length; i++) {
                                    const line = contentLines[i].trim();
                                    
                                    // If we find the main title (single #)
                                    if (line.startsWith('# ') && !line.startsWith('## ')) {
                                      // Insert after the title and any subtitle/intro paragraph
                                      insertIndex = i + 1;
                                      
                                      // Skip empty lines and look for first paragraph
                                      while (insertIndex < contentLines.length && contentLines[insertIndex].trim() === '') {
                                        insertIndex++;
                                      }
                                      
                                      // Skip the first intro paragraph if it exists
                                      if (insertIndex < contentLines.length && !contentLines[insertIndex].startsWith('#')) {
                                        // Find end of first paragraph
                                        while (insertIndex < contentLines.length && 
                                               contentLines[insertIndex].trim() !== '' && 
                                               !contentLines[insertIndex].startsWith('#')) {
                                          insertIndex++;
                                        }
                                      }
                                      break;
                                    }
                                  }
                                  
                                  // If no main title found, place at the very beginning
                                  if (insertIndex === 0) {
                                    insertIndex = 0;
                                  }
                                  
                                  // Insert the audio section
                                  const audioSection = [
                                    '',
                                    '## Listen to Our Deep Dive Discussion',
                                    '',
                                    audioEmbedSyntax,
                                    '',
                                    '---',
                                    ''
                                  ];
                                  
                                  contentLines.splice(insertIndex, 0, ...audioSection);
                                  updatedContent = contentLines.join('\n');
                                }
                                
                                return { 
                                  ...prev, 
                                  audioUrl: url,
                                  audioTitle: audioTitle,
                                  content: updatedContent
                                };
                              });
                              
                              toast({ 
                                title: "Audio uploaded!", 
                                description: "Audio embed automatically added at top of content" 
                              });
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor="audioDuration" className="text-gray-200 font-medium">Duration (mm:ss)</Label>
                          <Input
                            id="audioDuration"
                            value={newPost.audioDuration || ""}
                            onChange={(e) => setNewPost(prev => ({ ...prev, audioDuration: e.target.value }))}
                            placeholder="45:30"
                            className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="audioTitle" className="text-gray-200 font-medium">Audio Title (optional)</Label>
                        <Input
                          id="audioTitle"
                          value={newPost.audioTitle || ""}
                          onChange={(e) => setNewPost(prev => ({ ...prev, audioTitle: e.target.value }))}
                          placeholder="Custom audio title if different from post title"
                          className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Separator />
                
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-200 flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center">
                      <span className="text-xs text-white">SEO</span>
                    </div>
                    SEO Settings
                  </h4>
                  <div>
                    <Label htmlFor="seoTitle" className="text-gray-200 font-medium">SEO Title</Label>
                    <Input
                      id="seoTitle"
                      value={newPost.seoTitle || ""}
                      onChange={(e) => setNewPost(prev => ({ ...prev, seoTitle: e.target.value }))}
                      placeholder="Optimized title for search engines"
                      className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <Label htmlFor="metaDescription" className="text-gray-200 font-medium">Meta Description</Label>
                    <Textarea
                      id="metaDescription"
                      value={newPost.metaDescription || ""}
                      onChange={(e) => setNewPost(prev => ({ ...prev, metaDescription: e.target.value }))}
                      placeholder="Description for search engines (160 characters max)"
                      rows={2}
                      className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="font-semibold text-gray-200 flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-green-600 to-blue-600 rounded flex items-center justify-center">
                      <span className="text-xs text-white">📅</span>
                    </div>
                    Publication Settings
                  </h4>
                  
                  {/* Publication Date & Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="publishedAt" className="text-gray-200 font-medium mb-2 block">Publication Date</Label>
                      <DatePicker
                        date={newPost.publishedAt ? new Date(newPost.publishedAt) : null}
                        onSelect={(date) => {
                          if (date) {
                            // Preserve time if it exists, otherwise set to current time
                            const currentDateTime = newPost.publishedAt ? new Date(newPost.publishedAt) : new Date();
                            
                            date.setHours(currentDateTime.getHours());
                            date.setMinutes(currentDateTime.getMinutes());
                            date.setSeconds(currentDateTime.getSeconds());
                          }
                          
                          const dateString = date ? date.toISOString() : null;
                          setNewPost(prev => ({ ...prev, publishedAt: dateString }));
                        }}
                        placeholder="Select publication date"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="publishTime" className="text-gray-200 font-medium mb-2 block">Publication Time</Label>
                      <Input
                        id="publishTime"
                        type="time"
                        value={(() => {
                          const dateStr = newPost.publishedAt;
                          if (!dateStr) return "";
                          const date = new Date(dateStr);
                          return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                        })()}
                        onChange={(e) => {
                          const timeValue = e.target.value;
                          if (!timeValue) return;
                          
                          const [hours, minutes] = timeValue.split(':').map(Number);
                          const currentDateStr = newPost.publishedAt;
                          
                          const date = currentDateStr ? new Date(currentDateStr) : new Date();
                          date.setHours(hours);
                          date.setMinutes(minutes);
                          date.setSeconds(0);
                          
                          const dateString = date.toISOString();
                          setNewPost(prev => ({ ...prev, publishedAt: dateString }));
                        }}
                        className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  {/* Scheduling for Future */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="scheduledFor" className="text-gray-200 font-medium mb-2 block">Schedule for Future</Label>
                      <DatePicker
                        date={newPost.scheduledFor ? new Date(newPost.scheduledFor) : null}
                        onSelect={(date) => {
                          if (date) {
                            // Set to current time if no time is specified
                            const currentDateTime = newPost.scheduledFor ? new Date(newPost.scheduledFor) : new Date();
                            
                            date.setHours(currentDateTime.getHours());
                            date.setMinutes(currentDateTime.getMinutes());
                            date.setSeconds(currentDateTime.getSeconds());
                          }
                          
                          const dateString = date ? date.toISOString() : null;
                          setNewPost(prev => ({ ...prev, scheduledFor: dateString }));
                        }}
                        placeholder="Schedule for later"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="scheduleTime" className="text-gray-200 font-medium mb-2 block">Schedule Time</Label>
                      <Input
                        id="scheduleTime"
                        type="time"
                        value={(() => {
                          const dateStr = newPost.scheduledFor;
                          if (!dateStr) return "";
                          const date = new Date(dateStr);
                          return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                        })()}
                        onChange={(e) => {
                          const timeValue = e.target.value;
                          if (!timeValue) return;
                          
                          const [hours, minutes] = timeValue.split(':').map(Number);
                          const currentDateStr = newPost.scheduledFor;
                          
                          const date = currentDateStr ? new Date(currentDateStr) : new Date();
                          date.setHours(hours);
                          date.setMinutes(minutes);
                          date.setSeconds(0);
                          
                          const dateString = date.toISOString();
                          setNewPost(prev => ({ ...prev, scheduledFor: dateString }));
                        }}
                        className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-gray-700">
                    <p className="text-sm text-blue-800 dark:text-gray-300 mb-2">
                      <strong>📅 Publication Logic:</strong>
                    </p>
                    <ul className="text-xs text-blue-700 dark:text-gray-400 space-y-1">
                      <li>• <strong>Publication Date:</strong> When the post was/will be officially published</li>
                      <li>• <strong>Schedule Date:</strong> When to auto-publish in the future (overrides publish switch)</li>
                      <li>• <strong>Historical Posts:</strong> Set publication date in the past for content migration</li>
                      <li>• <strong>Future Scheduling:</strong> Set schedule date to auto-publish later</li>
                    </ul>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <Switch
                      id="published"
                      checked={newPost.published || false}
                      onCheckedChange={(checked) => {
                        const now = new Date().toISOString();
                        setNewPost(prev => ({ 
                          ...prev, 
                          published: checked,
                          publishedAt: checked && !prev.publishedAt ? now : prev.publishedAt
                        }));
                      }}
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-600 data-[state=checked]:to-purple-600"
                    />
                    <div>
                      <Label htmlFor="published" className="text-gray-200 font-medium">Publish immediately</Label>
                      <p className="text-xs text-gray-400">Auto-sets publication date to now if none selected</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  {isEditing && (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setSelectedPost(null);
                        setActiveTab("posts");
                      }}
                      className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white hover:border-gray-600"
                    >
                      Cancel Edit
                    </Button>
                  )}
                  <Button 
                    onClick={isEditing ? handleUpdatePost : handleCreatePost}
                    disabled={createPostMutation.isPending || updatePostMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 shadow-lg shadow-blue-500/25"
                  >
                    {isEditing 
                      ? (updatePostMutation.isPending ? "Updating..." : "Update Post")
                      : (createPostMutation.isPending ? "Creating..." : "Create Post")
                    }
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Subscribers */}
          <TabsContent value="subscribers" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800 shadow-2xl">
              <CardHeader className="border-b border-gray-800 pb-4">
                <CardTitle className="text-xl text-gray-100 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                    <Send className="w-4 h-4 text-white" />
                  </div>
                  Email Subscribers
                </CardTitle>
                <p className="text-gray-400 text-sm">
                  Manage your newsletter subscribers and engagement
                </p>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {subscribers.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Send className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-100 mb-2">No subscribers yet</h3>
                      <p className="text-gray-400">Start building your audience by sharing your content!</p>
                    </div>
                  ) : (
                    subscribers.map((subscriber: EmailSubscriber) => (
                      <div key={subscriber.id} className="flex justify-between items-center p-4 bg-gray-800 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors">
                        <div>
                          <p className="font-medium text-gray-100">{subscriber.email}</p>
                          {subscriber.name && <p className="text-sm text-gray-300">{subscriber.name}</p>}
                          <p className="text-xs text-gray-400">
                            Subscribed: {new Date(subscriber.subscribedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge 
                          variant={subscriber.subscribed ? "default" : "secondary"}
                          className={subscriber.subscribed 
                            ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0" 
                            : "bg-gray-700 text-gray-300 border-gray-600"
                          }
                        >
                          {subscriber.subscribed ? "Active" : "Unsubscribed"}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Card className="bg-gray-900 border-gray-800 shadow-xl hover:shadow-2xl transition-all duration-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white">#</span>
                    </div>
                    Total Posts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-gray-100">{posts.length}</p>
                  <p className="text-xs text-gray-400 mt-1">All content</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border-gray-800 shadow-xl hover:shadow-2xl transition-all duration-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center">
                      <Eye className="w-3 h-3 text-white" />
                    </div>
                    Published
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-gray-100">{posts.filter((p: BlogPost) => p.published).length}</p>
                  <p className="text-xs text-gray-400 mt-1">Live content</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border-gray-800 shadow-xl hover:shadow-2xl transition-all duration-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-orange-600 to-red-600 rounded-full flex items-center justify-center">
                      <Edit className="w-3 h-3 text-white" />
                    </div>
                    Drafts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-gray-100">{posts.filter((p: BlogPost) => !p.published).length}</p>
                  <p className="text-xs text-gray-400 mt-1">Work in progress</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border-gray-800 shadow-xl hover:shadow-2xl transition-all duration-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                      <Send className="w-3 h-3 text-white" />
                    </div>
                    Subscribers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-gray-100">{subscribers.filter((s: EmailSubscriber) => s.subscribed).length}</p>
                  <p className="text-xs text-gray-400 mt-1">Active audience</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Admin Session Monitor */}
          <TabsContent value="sessions" className="space-y-6">
            <AdminSessionMonitor />
          </TabsContent>

          {/* Backup Management */}
          <TabsContent value="backups" className="space-y-6">
            <BackupManager />
          </TabsContent>

          {/* Security Dashboard */}
          <TabsContent value="security" className="space-y-6">
            <SecurityDashboard />
          </TabsContent>

          {/* Category Management */}
          <TabsContent value="categories" className="space-y-6">
            <CategoryManager />
          </TabsContent>

          {/* AI Image Generator */}
          <TabsContent value="images" className="space-y-6">
            <ImageGenerator 
              onImageGenerated={(imageUrl, imageType) => {
                // Auto-populate the featured image field for AI generated images
                if (imageType === 'ai-generated') {
                  setNewPost(prev => ({ ...prev, featuredImage: imageUrl }));
                  toast({
                    title: "AI Image Set",
                    description: "Generated AI image has been set as the featured image for your blog post."
                  });
                }
              }}
            />
          </TabsContent>
        </Tabs>


      </div>
    </div>
  );
}