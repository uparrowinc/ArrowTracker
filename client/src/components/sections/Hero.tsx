import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";
import ParallaxEffect from "@/components/parallax-effect";

export default function Hero() {
  const [gradientPosition, setGradientPosition] = useState({ x: 0, y: 0 });
  const [gradientColors, setGradientColors] = useState({
    inner: 'rgba(22, 50, 83, 0.4)',
    middle: 'rgba(18, 23, 33, 0.85)',
    outer: 'rgba(11, 13, 16, 0.9)',
    background: 'rgba(11, 13, 16, 0.98)'
  });
  const [isAnimating, setIsAnimating] = useState(true);
  const [interactionCount, setInteractionCount] = useState(0);
  const [floatingParticles, setFloatingParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    speed: number;
    opacity: number;
    type: 'ai' | 'cart' | 'data' | 'code' | 'security';
  }>>([]);
  const heroRef = useRef<HTMLElement>(null);
  
  // Floating particles disabled - too flashy for B2B consulting
  useEffect(() => {
    setFloatingParticles([]);
  }, []);
  
  // Animation effect for the gradient and particles
  useEffect(() => {
    const animationFrameId = { current: 0 };
    let startTime: number;
    
    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const elapsedTime = time - startTime;
      
      // Calculate the x and y position based on time, creating a slow circular movement
      const x = 50 + 25 * Math.sin(elapsedTime * 0.0003);
      const y = 50 + 15 * Math.cos(elapsedTime * 0.0004);
      
      setGradientPosition({ x, y });
      
      // Enhanced animation for floating particles with unique movements for each type
      setFloatingParticles(prev => 
        prev.map(particle => {
          // Create different movement patterns based on particle type
          let xMovement = 0;
          let yMovement = 0;
          
          // Apply different movement patterns based on particle type
          switch(particle.type) {
            case 'ai':
              // AI particles move in a more complex pattern
              xMovement = Math.sin(elapsedTime * 0.0002 + particle.id) * 0.2;
              yMovement = Math.cos(elapsedTime * 0.0003 + particle.id) * particle.speed * 0.8;
              break;
            case 'cart':
              // eCommerce particles move more horizontally
              xMovement = Math.sin(elapsedTime * 0.0003 + particle.id) * 0.3;
              yMovement = particle.speed * 0.7;
              break;
            case 'data':
              // Database particles have more vertical motion
              xMovement = Math.sin(elapsedTime * 0.0002 + particle.id) * 0.15;
              yMovement = particle.speed * 1.1;
              break;
            case 'security':
              // Security particles move in a shield-like pattern
              xMovement = Math.sin(elapsedTime * 0.0001 + particle.id * 3) * 0.25;
              yMovement = Math.abs(Math.sin(elapsedTime * 0.0002 + particle.id)) * particle.speed;
              break;
            case 'code':
              // Code particles move in a more angular pattern
              xMovement = Math.sin(elapsedTime * 0.0002 + particle.id * 2) * 0.22;
              yMovement = particle.speed * (1 + Math.sin(elapsedTime * 0.0004 + particle.id) * 0.3);
              break;
            default:
              xMovement = Math.sin(elapsedTime * 0.0001 + particle.id) * 0.1;
              yMovement = particle.speed;
          }
          
          // Calculate new position, ensuring particles wrap around
          const newY = (particle.y - yMovement) % 100;
          const y = newY < 0 ? 100 + newY : newY;
          
          // Add a slight pulsating effect
          const opacityFactor = 0.05 + (particle.id % 5) * 0.01;
          const opacityChange = Math.sin(elapsedTime * 0.001 + particle.id * 0.5) * opacityFactor;
          
          return {
            ...particle,
            x: ((particle.x + xMovement) % 100 + 100) % 100, // Ensure x wraps properly
            y,
            opacity: Math.max(0.2, Math.min(0.9, particle.opacity + opacityChange))
          };
        })
      );
      
      if (isAnimating) {
        animationFrameId.current = requestAnimationFrame(animate);
      }
    };
    
    animationFrameId.current = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationFrameId.current);
    };
  }, [isAnimating, floatingParticles]);
  
  // Interactive effect on mouse movement with enhanced gradient changes
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      
      const rect = heroRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      // Always update gradient position for smooth tracking
      setGradientPosition({ x, y });
      
      // If not auto-animating, subtly change colors based on mouse position
      if (!isAnimating) {
        // Create subtle color variations based on mouse position
        const hueShift = Math.floor((x / 100) * 20); // 0-20 degree hue shift
        const saturation = Math.floor(40 + (y / 100) * 20); // 40-60% saturation
        
        setGradientColors({
          inner: `hsla(${240 + hueShift}, ${saturation}%, 30%, 0.8)`,
          middle: `hsla(${225 + hueShift}, ${saturation - 5}%, 20%, 0.85)`,
          outer: `hsla(${210 + hueShift}, ${saturation - 10}%, 15%, 0.9)`,
          background: `hsla(${200 + hueShift}, ${saturation - 15}%, 10%, 0.95)`
        });
      }
    };
    
    const handleMouseClick = () => {
      // Toggle animation state
      setIsAnimating(!isAnimating);
      
      // Increase interaction count
      setInteractionCount(prev => prev + 1);
      
      // Executive Navy color theme - single professional theme
      const colorThemes = [
        // Executive Navy theme
        {
          inner: 'rgba(22, 50, 83, 0.4)',
          middle: 'rgba(18, 23, 33, 0.85)',
          outer: 'rgba(11, 13, 16, 0.9)',
          background: 'rgba(11, 13, 16, 0.98)'
        },
        // Deep Steel theme
        {
          inner: 'rgba(44, 74, 110, 0.35)',
          middle: 'rgba(18, 23, 33, 0.85)',
          outer: 'rgba(11, 13, 16, 0.9)',
          background: 'rgba(11, 13, 16, 0.98)'
        },
        // Bronze accent theme
        {
          inner: 'rgba(200, 164, 102, 0.15)',
          middle: 'rgba(18, 23, 33, 0.88)',
          outer: 'rgba(11, 13, 16, 0.92)',
          background: 'rgba(11, 13, 16, 0.98)'
        }
      ];
      
      // Select the next theme based on interaction count
      const nextTheme = colorThemes[interactionCount % colorThemes.length];
      setGradientColors(nextTheme);
    };
    
    if (heroRef.current) {
      heroRef.current.addEventListener('mousemove', handleMouseMove);
      heroRef.current.addEventListener('click', handleMouseClick);
    }
    
    return () => {
      if (heroRef.current) {
        heroRef.current.removeEventListener('mousemove', handleMouseMove);
        heroRef.current.removeEventListener('click', handleMouseClick);
      }
    };
  }, [isAnimating, heroRef, interactionCount]);
  
  // Dynamic gradient that changes based on user interaction
  const gradientStyle = {
    background: `
      radial-gradient(circle at ${gradientPosition.x}% ${gradientPosition.y}%, 
        ${gradientColors.inner} 0%, 
        ${gradientColors.middle} 30%, 
        ${gradientColors.outer} 60%, 
        ${gradientColors.background} 100%)
    `,
    transition: 'background 0.5s ease-out',
  };
  
  // Get SVG icon for each particle type
  const getParticleSvg = (type: 'ai' | 'cart' | 'data' | 'code' | 'security') => {
    switch (type) {
      case 'ai':
        return (
          <path 
            d="M12,2C13.1,2 14,2.9 14,4C14,4.74 13.6,5.39 13,5.73V7H14C17.67,7 20.56,10.33 20,14C19.44,17.67 16.11,20.56 12.45,20C8.78,19.44 5.89,16.11 6.45,12.45C6.67,10.71 7.68,9.16 9.08,8.18L9,8C9,6.9 9.9,6 11,6C11.26,6 11.5,6.05 11.75,6.11C11.29,5.51 11,4.78 11,4C11,2.9 11.9,2 13,2M16,8V10L14,11L16,12V14L12,12V8H16Z" 
            fill="#FFFFFF" 
          />
        );
      case 'cart':
        return (
          <path 
            d="M17,18C15.89,18 15,18.89 15,20A2,2 0 0,0 17,22A2,2 0 0,0 19,20C19,18.89 18.1,18 17,18M1,2V4H3L6.6,11.59L5.25,14.04C5.09,14.32 5,14.65 5,15A2,2 0 0,0 7,17H19V15H7.42A0.25,0.25 0 0,1 7.17,14.75C7.17,14.7 7.18,14.66 7.2,14.63L8.1,13H15.55C16.3,13 16.96,12.59 17.3,11.97L21.16,4.96L19.42,4H19.41L18.31,6L15.55,11H8.53L8.4,10.73L6.16,6L5.21,4L4.27,2M7,18C5.89,18 5,18.89 5,20A2,2 0 0,0 7,22A2,2 0 0,0 9,20C9,18.89 8.1,18 7,18Z" 
            fill="#FFFFFF" 
          />
        );
      case 'data':
        return (
          <path 
            d="M12,3C7.58,3 4,4.79 4,7V17C4,19.21 7.59,21 12,21C16.41,21 20,19.21 20,17V7C20,4.79 16.42,3 12,3M18,17C18,17.5 15.87,19 12,19C8.13,19 6,17.5 6,17V14.77C7.61,15.55 9.72,16 12,16C14.28,16 16.39,15.55 18,14.77V17M18,12.45C16.7,13.4 14.42,14 12,14C9.58,14 7.3,13.4 6,12.45V9.64C7.47,10.47 9.61,11 12,11C14.39,11 16.53,10.47 18,9.64V12.45M12,9C8.13,9 6,7.5 6,7C6,6.5 8.13,5 12,5C15.87,5 18,6.5 18,7C18,7.5 15.87,9 12,9Z" 
            fill="#FFFFFF" 
          />
        );
      case 'code':
        return (
          <path 
            d="M8,3A2,2 0 0,0 6,5V9A2,2 0 0,1 4,11H3V13H4A2,2 0 0,1 6,15V19A2,2 0 0,0 8,21H10V19H8V14A2,2 0 0,0 6,12A2,2 0 0,0 8,10V5H10V3M16,3A2,2 0 0,1 18,5V9A2,2 0 0,0 20,11H21V13H20A2,2 0 0,0 18,15V19A2,2 0 0,1 16,21H14V19H16V14A2,2 0 0,1 18,12A2,2 0 0,1 16,10V5H14V3H16Z" 
            fill="#FFFFFF" 
          />
        );
      case 'security':
        return (
          <path 
            d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,5A3,3 0 0,1 15,8A3,3 0 0,1 12,11A3,3 0 0,1 9,8A3,3 0 0,1 12,5M17.13,17C15.92,18.85 14.11,20.24 12,20.92C9.89,20.24 8.08,18.85 6.87,17C6.53,16.5 6.24,16 6,15.47C6,13.82 8.71,12.47 12,12.47C15.29,12.47 18,13.79 18,15.47C17.76,16 17.47,16.5 17.13,17Z" 
            fill="#FFFFFF" 
          />
        );
      default:
        return null;
    }
  };
  
  return (
    <section 
      ref={heroRef}
      className="relative bg-black overflow-hidden min-h-[80vh] flex items-center"
      onClick={() => setIsAnimating(!isAnimating)}
    >
      {/* Circuit background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* No stars as requested */}
      </div>
      
      {/* Digital circuit patterns with subtle parallax effect - reduced opacity for cosmic effect */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#FFF" strokeWidth="0.5" />
            </pattern>
            <pattern id="circuit" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="50" cy="50" r="2" fill="#FFF" />
              <circle cx="25" cy="25" r="1" fill="#FFF" />
              <circle cx="75" cy="75" r="1" fill="#FFF" />
              <circle cx="75" cy="25" r="1" fill="#FFF" />
              <circle cx="25" cy="75" r="1" fill="#FFF" />
              <path d="M50 50 L75 75 M50 50 L25 25 M50 50 L75 25 M50 50 L25 75" stroke="#FFF" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <rect width="100%" height="100%" fill="url(#circuit)" />
        </svg>
      </div>
      
      {/* Floating AI and eCommerce symbols - brighter */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingParticles.map(particle => (
          <div 
            key={particle.id}
            className="absolute"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              opacity: particle.opacity + 0.2, /* Increased opacity to make brighter */
              transform: `scale(${particle.size})`,
              transition: 'opacity 0.5s ease',
              width: '30px', /* Increased size */
              height: '30px', /* Increased size */
              filter: 'brightness(1.5) drop-shadow(0 0 3px rgba(255,255,255,0.3))' /* Added glow effect */
            }}
          >
            <svg viewBox="0 0 24 24" width="100%" height="100%">
              {getParticleSvg(particle.type as 'ai' | 'cart' | 'data' | 'code' | 'security')}
            </svg>
          </div>
        ))}
      </div>
      
      {/* Dynamic gradient overlay */}
      <div className="absolute inset-0" style={gradientStyle}></div>
      
      {/* Binary code lines in background with scroll animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[20%] right-[10%] text-white opacity-10 text-xs whitespace-nowrap font-mono">
          <div className="binary-scroll-right inline-block">
            01001001 01101110 01110100 01100101 01101100 01101100 01101001 01100111 01100101 01101110 01100011 01100101
            01001001 01101110 01110100 01100101 01101100 01101100 01101001 01100111 01100101 01101110 01100011 01100101
          </div>
        </div>
        <div className="absolute top-[40%] left-[5%] text-white opacity-10 text-xs whitespace-nowrap font-mono">
          <div className="binary-scroll-left inline-block">
            01100101 01000011 01101111 01101101 01101101 01100101 01110010 01100011 01100101
            01100101 01000011 01101111 01101101 01101101 01100101 01110010 01100011 01100101
          </div>
        </div>
        <div className="absolute bottom-[30%] right-[15%] text-white opacity-10 text-xs whitespace-nowrap font-mono">
          <div className="binary-scroll-right inline-block">
            01000001 01110101 01110100 01101111 01101101 01100001 01110100 01101001 01101111 01101110
            01000001 01110101 01110100 01101111 01101101 01100001 01110100 01101001 01101111 01101110
          </div>
        </div>
      </div>
      
      <style>
        {`
          @keyframes scrollRight {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          
          @keyframes scrollLeft {
            0% { transform: translateX(-50%); }
            100% { transform: translateX(0); }
          }
          
          .binary-scroll-right {
            animation: scrollRight 20s linear infinite;
          }
          
          .binary-scroll-left {
            animation: scrollLeft 20s linear infinite;
          }
        `}
      </style>
      
      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="py-12 md:py-20 lg:py-28">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-10">
            {/* Left side content */}
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                AI Empowerment and <span className="text-white bg-gradient-to-r from-white to-gray-400 bg-clip-text">eCommerce</span> Solutions
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-4">
                Where artificial intelligence meets online business innovation
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-2">
                <Button 
                  asChild
                  size="lg" 
                  className="bg-white hover:bg-gray-200 text-black font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <a href="#services-heading">
                    Explore Our Services
                  </a>
                </Button>
                <Button 
                  asChild
                  size="lg" 
                  variant="outline" 
                  className="bg-transparent hover:bg-white/10 text-white border border-white font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <a href="#contact">
                    Schedule a Consultation
                  </a>
                </Button>

              </div>
            </div>
            
            {/* CTA Card with micro-interactions - Desktop version */}
            <div className="hidden lg:block">
              <div className="bg-black/60 border border-white/20 backdrop-blur-sm rounded-xl p-6 shadow-2xl w-[340px] transform transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] relative overflow-hidden group">
                {/* Animated accent corner */}
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-white/5 rotate-45 transform transition-all duration-500 group-hover:scale-150 group-hover:bg-white/10 group-hover:rotate-[60deg]"></div>
                
                {/* Subtle background pulse effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 rounded-xl pulse-bg"></div>
                
                <div className="relative mb-5">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/10 to-transparent rounded-full -mt-8 -mr-8 blur-xl group-hover:from-white/20 transition-all duration-500"></div>
                  <h3 className="text-2xl font-bold text-white mb-2 transition-transform duration-300 group-hover:translate-x-1">Tech Solutions for Today's Business</h3>
                  <div className="h-1 w-10 bg-white mb-3 transition-all duration-500 group-hover:w-20"></div>
                </div>
                
                <ul className="space-y-4 mb-6">
                  <li className="flex items-center text-white transition-all duration-300 hover:translate-x-1 cursor-pointer">
                    <svg className="w-6 h-6 mr-3 text-white transition-transform duration-300 transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="transition-colors duration-300 hover:text-white/90 text-lg">AI-powered business solutions</span>
                  </li>
                  <li className="flex items-center text-white transition-all duration-300 hover:translate-x-1 cursor-pointer">
                    <svg className="w-6 h-6 mr-3 text-white transition-transform duration-300 transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="transition-colors duration-300 hover:text-white/90 text-lg">eCommerce optimization services</span>
                  </li>
                  <li className="flex items-center text-white transition-all duration-300 hover:translate-x-1 cursor-pointer">
                    <svg className="w-6 h-6 mr-3 text-white transition-transform duration-300 transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="transition-colors duration-300 hover:text-white/90 text-lg">Database & security expertise</span>
                  </li>
                </ul>
                
                <div className="flex flex-col gap-3 relative z-10">
                  <Button className="bg-white hover:bg-gray-200 text-black font-medium w-full relative overflow-hidden group transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]" size="lg">
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white via-gray-100 to-white translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
                    <a href="#contact" className="relative z-10">
                      Get Started Today
                    </a>
                  </Button>
                  <p className="text-center text-white/70 text-sm mt-2 transition-opacity duration-300 group-hover:text-white/90">No commitments. Free initial consultation.</p>
                </div>
              </div>
            </div>
            
            {/* Mobile CTA Card - Only visible on smaller screens */}
            <div className="lg:hidden mt-8">
              <div className="bg-black/60 border border-white/20 backdrop-blur-sm rounded-xl p-5 shadow-xl relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-white/5 rotate-45"></div>
                
                <div className="relative mb-4">
                  <h3 className="text-xl font-bold text-white mb-2">Tech Solutions for Today's Business</h3>
                  <div className="h-1 w-10 bg-white mb-3"></div>
                </div>
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="grid grid-cols-1 gap-3 flex-1">
                    <div className="flex items-center text-white">
                      <svg className="w-4 h-4 mr-2 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span className="text-sm">AI solutions</span>
                    </div>
                    <div className="flex items-center text-white">
                      <svg className="w-4 h-4 mr-2 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span className="text-sm">eCommerce</span>
                    </div>
                    <div className="flex items-center text-white">
                      <svg className="w-4 h-4 mr-2 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span className="text-sm">Security</span>
                    </div>
                  </div>
                  
                  {/* uAI Brain Logo - Mobile - IN YOUR FACE */}
                  <div className="flex-shrink-0">
                    <div className="w-40 h-40 p-2">
                      <img 
                        src="/attached_assets/image_1753753865238.png" 
                        alt="uAI Intelligence" 
                        className="w-full h-full object-contain opacity-90 hover:opacity-100 transition-opacity duration-300"
                      />
                    </div>
                  </div>
                </div>
                
                <Button className="bg-white hover:bg-gray-200 text-black font-medium w-full" size="default">
                  <a href="#contact">
                    Get Started Today
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black to-transparent"></div>
    </section>
  );
}
