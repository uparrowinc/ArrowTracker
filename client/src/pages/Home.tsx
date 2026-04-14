import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import Services from "@/components/sections/Services";
import Solutions from "@/components/sections/Solutions";
import CaseStudies from "@/components/sections/CaseStudies";
import About from "@/components/sections/About";
import CTA from "@/components/sections/CTA";
import Contact from "@/components/sections/Contact";
import RecentShowCTA from "@/components/sections/RecentShowCTA";
import { SmoothScrollNav } from "@/components/ui/smooth-scroll-nav";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Service, Testimonial, TeamMember } from "@shared/schema";

export default function Home() {
  // Fetch data for the page
  const { data: services } = useQuery<Service[]>({
    queryKey: ['/api/services'],
  });

  const { data: testimonials } = useQuery<Testimonial[]>({
    queryKey: ['/api/testimonials'],
  });

  const { data: teamMembers } = useQuery<TeamMember[]>({
    queryKey: ['/api/team-members'],
  });

  return (
    <div className="min-h-screen flex flex-col relative bg-black">
      {/* FloatingParticles disabled - too flashy for B2B consulting */}
      <SmoothScrollNav />
      
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section id="hero" className="relative overflow-hidden">
          <Hero />
        </section>
        
        {/* Recent Show Section - Moved right after Hero */}
        <section id="recent-show" className="relative">
          <div className="gradient-bg-secondary">
            <RecentShowCTA />
          </div>
        </section>

        {/* CTA Section - Ready to Transform Your Business */}
        <section className="relative overflow-hidden py-12 md:py-16">
          <CTA />
        </section>

        {/* Solutions Section */}
        <section id="solutions" className="relative gradient-bg-primary">
          <Solutions />
        </section>
        
        {/* Services Section */}
        <section id="services" className="relative pb-10 md:pb-20">
          <div className="gradient-bg-secondary">
            <Services services={services || []} />
          </div>
        </section>
        
        {/* About Section */}
        <section id="about" className="relative gradient-bg-primary">
          <About teamMembers={teamMembers || []} />
        </section>

        {/* Case Studies Section */}
        <section id="case-studies" className="relative">
          <div className="gradient-bg-secondary">
            <CaseStudies testimonials={testimonials || []} />
          </div>
        </section>
        
        {/* Contact Section */}
        <section id="contact" className="relative gradient-bg-primary">
          <Contact />
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
