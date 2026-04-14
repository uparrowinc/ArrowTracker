import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ExternalLink, BookOpen, Code, Globe, Zap } from 'lucide-react';

export const CrossPlatformNavigation: React.FC = () => {
  const platformLinks = [
    {
      title: 'Blog & Articles',
      description: 'Latest insights on technology and business',
      href: '/blog',
      icon: <BookOpen className="w-5 h-5" />,
      color: 'from-blue-600 to-cyan-600',
      isInternal: true
    },
    {
      title: 'Blog Admin',
      description: 'Content management system',
      href: '/blog-admin',
      icon: <Code className="w-5 h-5" />,
      color: 'from-purple-600 to-pink-600',
      isInternal: true
    },
    {
      title: 'Clean Static Site',
      description: 'Pure HTML/CSS version',
      href: '/static-preview/clean.html',
      icon: <Globe className="w-5 h-5" />,
      color: 'from-green-600 to-emerald-600',
      isInternal: false
    },
    {
      title: 'ColdFusion Version',
      description: 'Server-side rendered application',
      href: '/ColdFusion',
      icon: <Zap className="w-5 h-5" />,
      color: 'from-orange-600 to-red-600',
      isInternal: false
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-gray-900 to-black">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
            Explore Our Platform
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Experience Up Arrow Inc across multiple technologies and platforms
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {platformLinks.map((platform, index) => (
            <div
              key={index}
              className="group relative bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              {/* Gradient glow effect */}
              <div className={`absolute inset-0 bg-gradient-to-r ${platform.color} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300`} />
              
              <div className="relative z-10">
                <div className={`inline-flex p-3 bg-gradient-to-r ${platform.color} rounded-lg mb-4 text-white`}>
                  {platform.icon}
                </div>
                
                <h3 className="text-xl font-semibold text-gray-100 mb-2 group-hover:text-white transition-colors">
                  {platform.title}
                </h3>
                
                <p className="text-gray-400 text-sm mb-6 group-hover:text-gray-300 transition-colors">
                  {platform.description}
                </p>
                
                {platform.isInternal ? (
                  <Link href={platform.href}>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className={`w-full bg-gradient-to-r ${platform.color} border-0 text-white hover:opacity-90 transition-opacity`}
                    >
                      Explore
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                ) : (
                  <a href={platform.href} target="_blank" rel="noopener noreferrer">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className={`w-full bg-gradient-to-r ${platform.color} border-0 text-white hover:opacity-90 transition-opacity`}
                    >
                      Visit
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* RSS Feed Section */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600/20 border border-orange-500/30 rounded-full text-orange-400 text-sm">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
            Stay updated with our RSS feed
          </div>
          
          <div className="mt-4">
            <a 
              href="/api/rss" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3.429 2.571c8.738 0 15.714 7.143 15.714 15.714h-3.714c0-6.857-5.143-12-12-12v-3.714zm0 5.714c4.571 0 8.571 4 8.571 8.571h-3.714c0-2.857-2-4.857-4.857-4.857v-3.714zm1.714 5.714c1.143 0 2 .857 2 2s-.857 2-2 2-2-.857-2-2 .857-2 2-2z"/>
              </svg>
              Subscribe to RSS
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};