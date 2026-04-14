import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Server, Download, Code, Shield } from "lucide-react";
import { Link } from "wouter";

export default function ColdFusionPreview() {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Main Site
              </Button>
            </Link>
            
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full" />
              <span className="text-sm text-gray-400">ColdFusion Version</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600/20 border border-orange-500/30 rounded-full text-orange-400 text-sm mb-8">
            <Server className="w-4 h-4" />
            Server-Side Rendered Application
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-6">
            ColdFusion Version
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Experience the complete Up Arrow Inc platform built with traditional server-side rendering 
            using ColdFusion. This version provides identical functionality and design with enterprise-grade 
            server capabilities.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/ColdFusion/index.cfm" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105 font-semibold"
            >
              <ExternalLink className="w-5 h-5" />
              Launch ColdFusion App
            </a>
            
            <Link href="/">
              <Button variant="outline" size="lg" className="border-gray-600 text-gray-300 hover:text-white hover:border-gray-500">
                Compare with React Version
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            ColdFusion Implementation Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Server className="w-8 h-8" />,
                title: "Server-Side Rendering",
                description: "Fast page loads with traditional server-side processing and template rendering",
                color: "from-blue-600 to-cyan-600"
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: "Enterprise Authentication",
                description: "Secure password protection with session management and access control",
                color: "from-green-600 to-emerald-600"
              },
              {
                icon: <Code className="w-8 h-8" />,
                title: "Modern CSS & JavaScript",
                description: "Contemporary styling with CSS Grid, Flexbox, and interactive JavaScript",
                color: "from-purple-600 to-pink-600"
              },
              {
                icon: <ExternalLink className="w-8 h-8" />,
                title: "API Endpoints",
                description: "RESTful JSON APIs for services, testimonials, and dynamic content",
                color: "from-orange-600 to-red-600"
              },
              {
                icon: <Download className="w-8 h-8" />,
                title: "Contact Form Processing",
                description: "Functional contact form with server-side validation and email handling",
                color: "from-indigo-600 to-blue-600"
              },
              {
                icon: <Server className="w-8 h-8" />,
                title: "Responsive Design",
                description: "Mobile-first approach with breakpoint-specific layouts and navigation",
                color: "from-teal-600 to-cyan-600"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all duration-300 hover:scale-105"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300`} />
                
                <div className="relative z-10">
                  <div className={`inline-flex p-3 bg-gradient-to-r ${feature.color} rounded-lg mb-4 text-white`}>
                    {feature.icon}
                  </div>
                  
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Details */}
      <section className="py-16 px-4 bg-gray-900/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            Technical Implementation
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Code className="w-5 h-5 text-orange-400" />
                Server Architecture
              </h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
                  <span>ColdFusion Application Framework</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
                  <span>Session-based authentication system</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
                  <span>RESTful API endpoints for data access</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
                  <span>Server-side form processing</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                Security Features
              </h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                  <span>Password protection (KlopperX10)</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                  <span>Session management and timeouts</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                  <span>Input validation and sanitization</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                  <span>CSRF protection ready</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-400" />
              Access Information
            </h3>
            <div className="space-y-4 text-gray-300">
              <div className="flex items-center gap-3 p-3 bg-orange-600/10 border border-orange-500/20 rounded-lg">
                <div className="w-3 h-3 bg-orange-400 rounded-full" />
                <span><strong>Login Password:</strong> KlopperX10</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-600/10 border border-blue-500/20 rounded-lg">
                <div className="w-3 h-3 bg-blue-400 rounded-full" />
                <span><strong>Access URL:</strong> /ColdFusion/index.cfm</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-600/10 border border-green-500/20 rounded-lg">
                <div className="w-3 h-3 bg-green-400 rounded-full" />
                <span><strong>Features:</strong> Complete website functionality with server-side processing</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Experience Traditional Server-Side Rendering?
          </h2>
          
          <p className="text-xl text-gray-300 mb-8">
            Compare the performance and functionality of our ColdFusion implementation 
            with the modern React version.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/ColdFusion/index.cfm" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105 font-semibold"
            >
              <ExternalLink className="w-5 h-5" />
              Launch ColdFusion Version
            </a>
            
            <Link href="/">
              <Button variant="outline" size="lg" className="border-gray-600 text-gray-300 hover:text-white hover:border-gray-500">
                Return to React Version
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-black/50 backdrop-blur-sm py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2025 up arrow inc. ColdFusion implementation showcasing traditional server-side rendering.
          </p>
          
          <div className="mt-4 flex justify-center gap-6">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              React Version
            </Link>
            <a href="/static-preview/clean.html" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
              Static HTML
            </a>
            <Link href="/blog" className="text-gray-400 hover:text-white transition-colors">
              Blog
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}