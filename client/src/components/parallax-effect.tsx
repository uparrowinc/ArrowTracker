import { useEffect, useRef } from 'react';

interface ParallaxProps {
  children: React.ReactNode;
  speed?: number; // Speed multiplier for the parallax effect (positive = slower, negative = faster)
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
  style?: React.CSSProperties;
}

export default function ParallaxEffect({ 
  children, 
  speed = 0.1, // Reduced default speed for subtlety
  direction = 'up',
  className = '',
  style = {}
}: ParallaxProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const initialPositionRef = useRef<number | null>(null);
  
  useEffect(() => {
    // Skip parallax on mobile devices for better performance
    if (window.innerWidth < 768) return;
    
    const element = elementRef.current;
    if (!element) return;
    
    // Get the parent element to properly calculate position
    const parentElement = element.parentElement;
    
    // Measure initial position if not already set
    if (initialPositionRef.current === null) {
      const rect = element.getBoundingClientRect();
      initialPositionRef.current = rect.top + window.scrollY;
    }
    
    const handleScroll = () => {
      if (!element || initialPositionRef.current === null) return;
      
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const elementPosition = initialPositionRef.current;
      
      // Only apply parallax when element is in viewport (with buffer)
      if (elementPosition > scrollPosition + windowHeight + 100 || 
          elementPosition + element.offsetHeight < scrollPosition - 100) {
        return;
      }
      
      // Calculate the element's distance from the top of the viewport
      const relativePosition = scrollPosition - elementPosition + windowHeight / 2;
      
      // Apply parallax transform based on direction with reduced movement range
      let transform = '';
      const maxMovement = 50; // Limit maximum movement to avoid extreme shifts
      let movement = Math.min(Math.abs(relativePosition * speed), maxMovement) * 
                    (relativePosition > 0 ? 1 : -1);
      
      switch (direction) {
        case 'up':
          transform = `translate3d(0, ${movement}px, 0)`;
          break;
        case 'down':
          transform = `translate3d(0, ${-movement}px, 0)`;
          break;
        case 'left':
          transform = `translate3d(${movement}px, 0, 0)`;
          break;
        case 'right':
          transform = `translate3d(${-movement}px, 0, 0)`;
          break;
      }
      
      // Apply transform
      element.style.transform = transform;
      // Ensure elements stay in their container
      element.style.willChange = 'transform';
    };
    
    // Add scroll event listener with throttling for performance
    let ticking = false;
    const scrollListener = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', scrollListener, { passive: true });
    
    // Initial calculation
    handleScroll();
    
    // Cleanup
    return () => {
      window.removeEventListener('scroll', scrollListener);
      if (element) {
        element.style.transform = '';
        element.style.willChange = 'auto';
      }
    };
  }, [speed, direction]);
  
  return (
    <div 
      ref={elementRef} 
      className={`${className}`}
      style={{
        ...style,
        position: 'relative', // Ensure element is positioned relatively
        transition: 'transform 0.3s ease-out', // Smooth transitions
      }}
    >
      {children}
    </div>
  );
}