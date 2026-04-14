import React, { useEffect, useState, useCallback } from 'react';
import { ChevronUp, Navigation, Zap, Target, Users, Briefcase, Phone, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const navItems: NavItem[] = [
  { id: 'hero', label: 'Home', icon: <Navigation className="w-4 h-4" />, color: 'from-[#163253] to-[#2C4A6E]' },
  { id: 'recent-show', label: 'Content', icon: <BookOpen className="w-4 h-4" />, color: 'from-[#163253] to-[#2C4A6E]' },
  { id: 'solutions', label: 'Solutions', icon: <Target className="w-4 h-4" />, color: 'from-[#163253] to-[#2C4A6E]' },
  { id: 'services', label: 'Services', icon: <Zap className="w-4 h-4" />, color: 'from-[#163253] to-[#2C4A6E]' },
  { id: 'about', label: 'About', icon: <Users className="w-4 h-4" />, color: 'from-[#163253] to-[#2C4A6E]' },
  { id: 'case-studies', label: 'Case Studies', icon: <Briefcase className="w-4 h-4" />, color: 'from-[#163253] to-[#2C4A6E]' },
  { id: 'contact', label: 'Contact', icon: <Phone className="w-4 h-4" />, color: 'from-[#163253] to-[#2C4A6E]' },
];

export const SmoothScrollNav: React.FC = () => {
  const [activeSection, setActiveSection] = useState('hero');
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const detectActiveSection = useCallback(() => {
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;

    setIsVisible(scrollY > 200);
    setScrollProgress(docHeight > windowHeight ? (scrollY / (docHeight - windowHeight)) * 100 : 0);

    if (scrollY + windowHeight >= docHeight - 50) {
      setActiveSection('contact');
      return;
    }

    const offset = windowHeight * 0.35;
    let current = 'hero';

    for (const { id } of navItems) {
      const el = document.getElementById(id);
      if (el) {
        const top = el.getBoundingClientRect().top;
        if (top <= offset) {
          current = id;
        }
      }
    }

    setActiveSection(current);
  }, []);

  useEffect(() => {
    detectActiveSection();

    window.addEventListener('scroll', detectActiveSection, { passive: true });
    window.addEventListener('resize', detectActiveSection, { passive: true });

    return () => {
      window.removeEventListener('scroll', detectActiveSection);
      window.removeEventListener('resize', detectActiveSection);
    };
  }, [detectActiveSection]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Floating Navigation */}
      <div className={`
        fixed right-3 md:right-6 top-1/2 transform -translate-y-1/2 z-50 
        transition-all duration-300 ease-in-out
        ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12 pointer-events-none'}
      `}>
        <div className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-1 md:p-2 shadow-2xl">
          <div className="flex flex-col gap-1">
            {navItems.map(({ id, label, icon, color }) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className={`
                  group relative p-2 md:p-3 rounded-xl transition-all duration-200
                  hover:scale-110 hover:shadow-lg
                  ${activeSection === id 
                    ? `bg-gradient-to-r ${color} text-white shadow-lg` 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }
                `}
                title={label}
              >
                {icon}
                
                {/* Tooltip */}
                <div className={`
                  absolute right-full mr-3 top-1/2 transform -translate-y-1/2
                  px-3 py-1 bg-black text-white text-sm rounded-lg
                  whitespace-nowrap opacity-0 pointer-events-none
                  group-hover:opacity-100 transition-opacity duration-200
                  border border-gray-700
                `}>
                  {label}
                  <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-r-0 border-t-4 border-b-4 border-l-black border-t-transparent border-b-transparent" />
                </div>

                {/* Active indicator */}
                {activeSection === id && (
                  <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Scroll to top button */}
          <div className="mt-2 pt-2 border-t border-gray-700">
            <button
              onClick={scrollToTop}
              className="w-full p-2 md:p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all duration-200 hover:scale-110"
              title="Back to Top"
            >
              <ChevronUp className="w-3 h-3 md:w-4 md:h-4 mx-auto" />
            </button>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="absolute -left-1 top-0 w-1 bg-gray-800 rounded-full h-full overflow-hidden">
          <div 
            className="w-full bg-gradient-to-b from-[#163253] to-[#C8A466] transition-all duration-300 ease-out"
            style={{ height: `${scrollProgress}%` }}
          />
        </div>
      </div>

      {/* Mobile scroll indicator - REMOVED - Using white ScrollToTop component instead */}
    </>
  );
};
