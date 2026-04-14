import { useEffect, useState, useRef } from 'react';

interface CursorTrailParticle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  age: number;
  type: 'particle' | 'dot' | 'line' | 'circuit' | 'code';
  rotation: number;
  width?: number;
  color?: string;
  element?: HTMLDivElement;
}

export function CursorTrail() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cursorDotRef = useRef<HTMLDivElement | null>(null);
  const particlesRef = useRef<CursorTrailParticle[]>([]);
  const requestRef = useRef<number>(undefined);
  const lastMousePositionRef = useRef({ x: 0, y: 0 });
  const lastParticleTimeRef = useRef(0);
  const speedFactorRef = useRef(1);
  const isClickingRef = useRef(false);
  
  // Tech-inspired colors
  const techColors = [
    'rgba(180, 220, 255, 0.8)',  // Light blue
    'rgba(255, 255, 255, 0.8)',  // White
    'rgba(200, 255, 200, 0.7)',  // Light green
    'rgba(255, 230, 180, 0.7)',  // Light orange
  ];
  
  // Create a new particle based on cursor movement velocity
  const createParticle = (x: number, y: number) => {
    const now = performance.now();
    const dx = x - lastMousePositionRef.current.x;
    const dy = y - lastMousePositionRef.current.y;
    const velocity = Math.sqrt(dx * dx + dy * dy);
    
    // Adjust particle generation frequency based on velocity
    const minTimeBetweenParticles = isClickingRef.current ? 5 : 15;
    
    // Only create particles if the cursor has moved
    if (velocity < 0.5 || now - lastParticleTimeRef.current < minTimeBetweenParticles) return;
    
    lastParticleTimeRef.current = now;
    lastMousePositionRef.current = { x, y };
    
    const angle = Math.atan2(dy, dx);
    
    // Add more tech-inspired particle types
    const types: ('particle' | 'dot' | 'line' | 'circuit' | 'code')[] = [
      'particle', 'dot', 'line', 'circuit', 'code'
    ];
    
    // Weight the distribution to favor certain types
    const weights = [0.3, 0.2, 0.3, 0.1, 0.1]; // Higher numbers = more likely
    const weightedRandom = Math.random();
    let cumulativeWeight = 0;
    let selectedTypeIndex = 0;
    
    for (let i = 0; i < weights.length; i++) {
      cumulativeWeight += weights[i];
      if (weightedRandom <= cumulativeWeight) {
        selectedTypeIndex = i;
        break;
      }
    }
    
    const type = types[selectedTypeIndex];
    const randomColor = techColors[Math.floor(Math.random() * techColors.length)];
    
    // Create a DOM element for the particle
    const element = document.createElement('div');
    element.className = `cursor-trail tech-${type}`;
    
    // Special content for code-type particles (binary or hex digits)
    if (type === 'code') {
      element.textContent = Math.random() > 0.5 
        ? (Math.random() > 0.5 ? '0' : '1')  // Binary
        : Math.floor(Math.random() * 16).toString(16).toUpperCase(); // Hex
    }
    
    document.body.appendChild(element);
    
    // Set particle properties with enhanced diversity
    const particle: CursorTrailParticle = {
      x,
      y,
      size: type === 'line' ? 2 : 3 + Math.random() * 5,
      opacity: 0.6 + Math.random() * 0.4,
      age: 0,
      type,
      color: randomColor,
      rotation: angle * (180 / Math.PI) + (Math.random() * 30 - 15), // Slight random rotation
      element
    };
    
    // Type-specific customizations
    switch(type) {
      case 'line':
        particle.width = 15 + (velocity * speedFactorRef.current * 3);
        break;
      case 'circuit':
        particle.size = 2 + Math.random() * 3;
        break;
      case 'code':
        particle.size = 12;
        break;
    }
    
    // Update particle styles
    updateParticleStyle(particle);
    
    // Add to particles array
    particlesRef.current.push(particle);
  };
  
  // Update the particle style based on its properties
  const updateParticleStyle = (particle: CursorTrailParticle) => {
    if (!particle.element) return;
    
    particle.element.style.left = `${particle.x}px`;
    particle.element.style.top = `${particle.y}px`;
    particle.element.style.opacity = particle.opacity.toString();
    
    if (particle.color) {
      particle.element.style.backgroundColor = particle.color;
      particle.element.style.boxShadow = `0 0 8px 2px ${particle.color.replace(/[^,]+(?=\))/, '0.3')}`;
    }
    
    switch(particle.type) {
      case 'line':
        particle.element.style.setProperty('--width', `${particle.width}px`);
        particle.element.style.setProperty('--rotation', `${particle.rotation}deg`);
        break;
      case 'particle':
        particle.element.style.setProperty('--rotation', `${particle.rotation}deg`);
        particle.element.style.width = `${particle.size}px`;
        particle.element.style.height = `${particle.size}px`;
        break;
      case 'circuit':
        particle.element.style.width = `${particle.size}px`;
        particle.element.style.height = `${particle.size}px`;
        particle.element.style.borderRadius = '0';
        break;
      case 'code':
        particle.element.style.fontSize = `${particle.size}px`;
        particle.element.style.color = particle.color || 'rgba(255, 255, 255, 0.8)';
        particle.element.style.backgroundColor = 'transparent';
        particle.element.style.fontFamily = 'monospace';
        break;
      default:
        particle.element.style.width = `${particle.size}px`;
        particle.element.style.height = `${particle.size}px`;
    }
  };
  
  // Animation loop with enhanced behaviors
  const animate = () => {
    // Update the cursor dot position
    if (cursorDotRef.current) {
      cursorDotRef.current.style.left = `${mousePosition.x}px`;
      cursorDotRef.current.style.top = `${mousePosition.y}px`;
      
      // Make the cursor dot pulse when clicking
      if (isClickingRef.current) {
        cursorDotRef.current.style.transform = 'translate(-50%, -50%) scale(1.5)';
        cursorDotRef.current.style.boxShadow = '0 0 15px 5px rgba(255, 255, 255, 0.9)';
      } else {
        cursorDotRef.current.style.transform = 'translate(-50%, -50%) scale(1)';
        cursorDotRef.current.style.boxShadow = '0 0 10px 2px rgba(255, 255, 255, 0.7)';
      }
    }
    
    // Create new particles based on cursor movement
    createParticle(mousePosition.x, mousePosition.y);
    
    // Update all particles with enhanced movement and effects
    particlesRef.current.forEach((particle, index) => {
      particle.age += 1;
      
      // Different particles have different lifespans
      const fadeAge = particle.type === 'line' ? 15 : 
                      particle.type === 'code' ? 30 : 20;
      
      // Fade out particles as they age
      if (particle.age > fadeAge) {
        particle.opacity -= 0.03;
      }
      
      // Remove particles that are fully faded
      if (particle.opacity <= 0) {
        if (particle.element) {
          document.body.removeChild(particle.element);
        }
        particlesRef.current.splice(index, 1);
        return;
      }
      
      // Type-specific movement patterns
      switch(particle.type) {
        case 'particle':
          // Data bit floating upward with slight oscillation
          particle.y -= 0.7 * speedFactorRef.current;
          particle.x += Math.sin(particle.age * 0.08) * 0.5;
          break;
        case 'dot':
          // Connection node with gravity effect
          particle.y -= 0.3 * speedFactorRef.current;
          particle.x += Math.sin(particle.age * 0.05) * 0.3;
          break;
        case 'line':
          // Connection lines stay mostly static
          break;
        case 'circuit':
          // Circuit paths with rigid movements
          particle.y -= (0.4 + Math.sin(particle.age * 0.1) * 0.2) * speedFactorRef.current;
          if (Math.floor(particle.age / 10) % 2 === 0) {
            particle.x += 0.2 * speedFactorRef.current;
          } else {
            particle.x -= 0.2 * speedFactorRef.current;
          }
          break;
        case 'code':
          // Code elements floating upward slowly
          particle.y -= 0.5 * speedFactorRef.current;
          particle.x += (Math.random() - 0.5) * 0.2;
          break;
      }
      
      updateParticleStyle(particle);
    });
    
    requestRef.current = requestAnimationFrame(animate);
  };
  
  useEffect(() => {
    // Track mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    // Handle mouse down/up events for interactive effects
    const handleMouseDown = () => {
      isClickingRef.current = true;
      speedFactorRef.current = 2; // Speed up particles when clicking
      
      // Create a burst of particles on click
      const burstCount = 10;
      for (let i = 0; i < burstCount; i++) {
        setTimeout(() => {
          if (isClickingRef.current) { // Only continue burst if still clicking
            createParticle(
              mousePosition.x + (Math.random() * 20 - 10),
              mousePosition.y + (Math.random() * 20 - 10)
            );
          }
        }, i * 30);
      }
    };
    
    const handleMouseUp = () => {
      isClickingRef.current = false;
      speedFactorRef.current = 1; // Return to normal speed
    };
    
    // Initialize cursor dot
    const cursorDot = document.createElement('div');
    cursorDot.className = 'cursor-dot';
    document.body.appendChild(cursorDot);
    cursorDotRef.current = cursorDot;
    
    // Start animation loop
    requestRef.current = requestAnimationFrame(animate);
    
    // Add event listeners
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    
    // Cleanup function
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      
      if (cursorDotRef.current) {
        document.body.removeChild(cursorDotRef.current);
      }
      
      // Remove all particles
      particlesRef.current.forEach(particle => {
        if (particle.element) {
          document.body.removeChild(particle.element);
        }
      });
      // Clear the array without reassigning
      particlesRef.current.splice(0, particlesRef.current.length);
    };
  }, []);
  
  // We don't render anything directly - all elements are created and managed in the DOM
  return null;
}

export default CursorTrail;