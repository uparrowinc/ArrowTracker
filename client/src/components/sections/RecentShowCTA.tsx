import React from 'react';
import { Play, Headphones, Calendar, ArrowRight, Rss } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { AudioPlayer } from '../media/AudioPlayer';

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
  postType: string;
  author: string;
  published: boolean;
  publishedAt: string | null;
  tags: string | null;
  readingTime: string | null;
}

export default function RecentShowCTA() {
  // Fetch the latest published posts (radio shows and podcasts)
  const { data: posts } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog/posts', 'published=true'],
  });

  // Find the most recent radio show or podcast
  const recentShow = posts?.find(post => 
    post.postType === 'radio' || post.postType === 'podcast'
  );

  // Find the most recent regular article
  const recentArticle = posts?.find(post => 
    post.postType === 'article'
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Extract audio info from content 
  const extractAudioFromContent = (content: string) => {
    const audioRegex = /\[audio:([^\]]+)\]/;
    const match = content.match(audioRegex);
    
    if (match) {
      const src = match[1];
      const titleMatch = src.match(/title=([^&]+)/);
      const artistMatch = src.match(/artist=([^&]+)/);
      const title = titleMatch ? decodeURIComponent(titleMatch[1].replace(/'/g, '')) : 'Audio';
      const artist = artistMatch ? decodeURIComponent(artistMatch[1].replace(/'/g, '')) : undefined;
      const cleanSrc = src.split('&')[0];
      
      return {
        src: `/attached_assets/${cleanSrc}`,
        title,
        artist,
        protected: src.includes('protected=true'),
        type: 'podcast' as const
      };
    }
    
    return null;
  };

  return (
    <section className="py-16 md:py-20 bg-black relative overflow-hidden">
      {/* Dark gradient background with subtle pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),rgba(255,255,255,0))]"></div>
      
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center mb-12 md:mb-16 relative">
          {/* Brain Logo - Desktop Left Side Like Blog Pages */}
          <div className="hidden lg:block absolute -left-48 -top-20 z-0">
            <img 
              src="/attached_assets/image_1753753865238.png" 
              alt="uAI - AI Intelligence Hub" 
              className="w-80 h-80 opacity-60 hover:opacity-80 transition-opacity duration-300"
            />
          </div>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#163253]/30 to-[#2C4A6E]/20 rounded-full border border-[#C8A466]/30 mb-6 relative z-20">
            <div className="w-2 h-2 bg-gradient-to-r from-[#C8A466] to-[#2C4A6E] rounded-full"></div>
            <span className="text-sm text-gray-300 font-medium">uAI Intelligence Hub</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#E8EDF2] via-[#C8A466] to-[#E8EDF2] bg-clip-text text-transparent mb-6">
            Stay Connected with Up Arrow Inc
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
            Get the latest insights on technology, business strategy, and innovation delivered through our blog and weekly radio shows.
          </p>
          
          {/* RSS Feed Link */}
          <div className="flex items-center justify-center gap-3 mb-12">
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600/20 to-red-600/20 rounded-lg border border-orange-500/30 hover:border-orange-400/50 transition-all duration-200">
                <Rss className="w-5 h-5 text-orange-400" />
                <a 
                  href="/api/rss" 
                  className="text-orange-300 hover:text-orange-200 font-medium transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Subscribe to our RSS feed - W3C validated and podcast compatible"
                >
                  Subscribe to RSS Feed
                </a>
              </div>
              <span className="text-xs text-gray-500">W3C & RSS Advisory Board Validated</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Most Recent Show */}
          {recentShow && (
            <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300 bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-red-600/20 p-2 rounded-full border border-red-500/30">
                    <Headphones className="w-5 h-5 text-red-400" />
                  </div>
                  <span className="text-sm font-medium text-red-400 uppercase tracking-wide">
                    Latest {recentShow.postType === 'radio' ? 'Radio Show' : 'Podcast'}
                  </span>
                </div>
                
                {recentShow.featuredImage && (
                  <div className="aspect-video bg-gray-800 rounded-lg mb-4 overflow-hidden">
                    <img 
                      src={recentShow.featuredImage} 
                      alt={recentShow.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <h3 className="text-xl font-bold text-gray-100 mb-2 line-clamp-2">
                  {recentShow.audioTitle || recentShow.title}
                </h3>
                
                <p className="text-gray-300 mb-4 line-clamp-3">
                  {recentShow.excerpt}
                </p>

                {/* Audio Player - embedded directly in preview */}
                {(() => {
                  const audioInfo = extractAudioFromContent(recentShow.content);
                  return audioInfo ? (
                    <div className="mb-6">
                      <AudioPlayer
                        {...audioInfo}
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                  ) : null;
                })()}
                
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {recentShow.publishedAt && formatDate(recentShow.publishedAt)}
                    </div>
                    {recentShow.audioDuration && (
                      <div className="flex items-center gap-1">
                        <Play className="w-4 h-4" />
                        {recentShow.audioDuration}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button asChild className="flex-1 bg-gradient-to-r from-[#163253] to-[#2C4A6E] hover:from-[#1F3D66] hover:to-[#3C5A7E] border border-[#C8A466]/20">
                    <Link href={`/blog/${recentShow.slug}`}>
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Read Full Article
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Most Recent Article */}
          {recentArticle && (
            <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300 bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <Link href={`/blog/${recentArticle.slug}`} className="flex items-center gap-2 mb-4 group cursor-pointer hover:opacity-80 transition-opacity">
                  <div className="bg-[#163253]/30 p-2 rounded-full border border-[#C8A466]/30 group-hover:border-[#C8A466]/60">
                    <ArrowRight className="w-5 h-5 text-[#C8A466]" />
                  </div>
                  <span className="text-sm font-medium text-[#C8A466] uppercase tracking-wide">
                    Latest Article
                  </span>
                </Link>
                
                {recentArticle.featuredImage && (
                  <div className="aspect-video bg-gray-800 rounded-lg mb-4 overflow-hidden">
                    <img 
                      src={recentArticle.featuredImage} 
                      alt={recentArticle.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <h3 className="text-xl font-bold text-gray-100 mb-2 line-clamp-2">
                  {recentArticle.title}
                </h3>
                
                <p className="text-gray-300 mb-4 line-clamp-3">
                  {recentArticle.excerpt}
                </p>
                
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {recentArticle.publishedAt && formatDate(recentArticle.publishedAt)}
                    </div>
                    {recentArticle.readingTime && (
                      <span>{recentArticle.readingTime}</span>
                    )}
                  </div>
                </div>
                
                <Button asChild variant="outline" className="w-full border-gray-700 text-gray-300 hover:bg-[#163253] hover:text-white hover:border-[#2C4A6E]">
                  <Link href={`/blog/${recentArticle.slug}`}>
                    Read Article
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* All Content CTA */}
        <div className="text-center mt-16">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl max-w-2xl mx-auto backdrop-blur-sm">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-[#163253] to-[#2C4A6E] rounded-lg flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-100">
                Explore All Our Content
              </h3>
            </div>
            <p className="text-gray-300 mb-8 leading-relaxed">
              Discover insights on technology consulting, AI integration, business strategy, and more through our complete library of articles and shows.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-[#163253] to-[#2C4A6E] hover:from-[#1F3D66] hover:to-[#3C5A7E] border border-[#C8A466]/20 shadow-lg shadow-[#163253]/40">
                <Link href="/blog">
                  <ArrowRight className="w-5 h-5 mr-2" />
                  View All Blog Posts
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white hover:border-gray-600">
                <Link href="/blog?filter=radio">
                  <Headphones className="w-5 h-5 mr-2" />
                  Listen to Shows
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}