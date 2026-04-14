import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavScroll } from "@/hooks/use-nav-scroll";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isScrolled = useNavScroll();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Function to scroll to top of page
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  // Handler for logo click
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToTop();
  };

  return (
    <header 
      className={`w-full bg-black shadow-sm transition-all duration-300 ${isScrolled ? 'navbar-fixed' : ''}`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <a href="#" onClick={handleLogoClick} className="flex items-center space-x-2 cursor-pointer">
              <div className="flex items-center">
                <svg width="32" height="32" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
                  <path d="M30 10 L45 25 L37 25 L37 45 L23 45 L23 25 L15 25 Z" fill="currentColor" className="text-white" />
                </svg>
                <span className="text-white font-bold text-xl ml-2">up arrow inc</span>
              </div>
            </a>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#services-heading" className="text-white hover:text-gray-300 font-medium">
              Services
            </a>
            <a href="#solutions" className="text-white hover:text-gray-300 font-medium">
              Solutions
            </a>
            <a href="#case-studies" className="text-white hover:text-gray-300 font-medium">
              Case Studies
            </a>
            <a href="#about" className="text-white hover:text-gray-300 font-medium">
              About
            </a>
            <Link href="/blog" className="text-white hover:text-gray-300 font-medium">
              Blog
            </Link>
            <a href="#recent-show" className="bg-gradient-to-r from-[#163253] to-[#2C4A6E] hover:from-[#1F3D66] hover:to-[#3C5A7E] text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium border border-[#C8A466]/20">
              Intelligence Hub
            </a>
            <Button asChild className="bg-white hover:bg-gray-200 text-black border border-white">
              <a href="#contact">Contact Us</a>
            </Button>
          </nav>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              onClick={toggleMobileMenu} 
              className="text-white hover:text-gray-300 bg-black p-2 rounded-md"
              style={{ minWidth: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-4">
              <Link 
                href="/" 
                className="text-white hover:text-gray-300 font-medium"
                onClick={closeMobileMenu}
              >
                Home
              </Link>
              <Link 
                href="/blog" 
                className="text-white hover:text-gray-300 font-medium"
                onClick={closeMobileMenu}
              >
                Blog
              </Link>
              <a 
                href="#services-heading" 
                className="text-white hover:text-gray-300 font-medium"
                onClick={closeMobileMenu}
              >
                Services
              </a>
              <a 
                href="#solutions" 
                className="text-white hover:text-gray-300 font-medium"
                onClick={closeMobileMenu}
              >
                Solutions
              </a>
              <a 
                href="#case-studies" 
                className="text-white hover:text-gray-300 font-medium"
                onClick={closeMobileMenu}
              >
                Case Studies
              </a>
              <a 
                href="#about" 
                className="text-white hover:text-gray-300 font-medium"
                onClick={closeMobileMenu}
              >
                About
              </a>
              <a 
                href="#recent-show" 
                className="bg-gradient-to-r from-[#163253] to-[#2C4A6E] hover:from-[#1F3D66] hover:to-[#3C5A7E] text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium text-center border border-[#C8A466]/20"
                onClick={closeMobileMenu}
              >
                Intelligence Hub
              </a>
              <Button 
                asChild 
                className="bg-white hover:bg-gray-200 text-black border border-white w-full"
              >
                <a 
                  href="#contact"
                  onClick={closeMobileMenu}
                >
                  Contact Us
                </a>
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
