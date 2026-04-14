import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { useState } from 'react';
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import Home from "@/pages/Home";
import Blog from "@/pages/Blog";
import BlogPostView from "@/pages/BlogPostView";
import BlogAdmin from "@/pages/BlogAdmin";
import AdminLogin from "@/pages/AdminLogin";
import ColdFusionPreview from "@/pages/ColdFusionPreview";
import MemberLogin from "@/pages/MemberLogin";
import MemberPortal from "@/pages/MemberPortal";
import PasswordReset from "@/pages/PasswordReset";
import KanbanBoard from "@/pages/KanbanBoard";
import ServiceDetail from "@/pages/ServiceDetail";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPostView} />
      <Route path="/blog-admin" component={BlogAdmin} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/member-login" component={MemberLogin} />
      <Route path="/member-portal" component={MemberPortal} />
      <Route path="/reset-password" component={PasswordReset} />
      <Route path="/kanban" component={KanbanBoard} />
      <Route path="/ColdFusion" component={ColdFusionPreview} />
      <Route path="/services/:slug" component={ServiceDetail} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showLoading, setShowLoading] = useState(false); // Temporarily disabled preloader

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {showLoading && (
          <LoadingScreen 
            onComplete={() => setShowLoading(false)}
            duration={2500}
          />
        )}
        
        <div className={showLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-500'}>
          <Toaster />
          {/* CursorTrail disabled - too flashy for B2B consulting */}
          <ScrollToTop />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
