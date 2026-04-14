import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedTransitionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  type?: 'fade' | 'slide' | 'scale' | 'rotate' | 'bounce';
  direction?: 'up' | 'down' | 'left' | 'right';
}

export const AnimatedTransition: React.FC<AnimatedTransitionProps> = ({
  children,
  className = '',
  delay = 0,
  duration = 0.6,
  type = 'fade',
  direction = 'up'
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  const getVariants = () => {
    const variants = {
      fade: {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
      },
      slide: {
        hidden: {
          opacity: 0,
          x: direction === 'left' ? -50 : direction === 'right' ? 50 : 0,
          y: direction === 'up' ? 50 : direction === 'down' ? -50 : 0
        },
        visible: {
          opacity: 1,
          x: 0,
          y: 0
        }
      },
      scale: {
        hidden: { opacity: 0, scale: 0.8 },
        visible: { opacity: 1, scale: 1 }
      },
      rotate: {
        hidden: { opacity: 0, rotate: -10 },
        visible: { opacity: 1, rotate: 0 }
      },
      bounce: {
        hidden: { opacity: 0, y: 30, scale: 0.9 },
        visible: { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          transition: {
            type: 'spring' as const,
            stiffness: 300,
            damping: 20
          }
        }
      }
    };

    return variants[type];
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={className}
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={getVariants()}
          transition={{ 
            duration: type === 'bounce' ? 0.8 : duration,
            ease: type === 'bounce' ? 'easeOut' : 'easeInOut'
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface StaggeredAnimationProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  className?: string;
  type?: 'fade' | 'slide' | 'scale';
}

export const StaggeredAnimation: React.FC<StaggeredAnimationProps> = ({
  children,
  staggerDelay = 0.1,
  className = '',
  type = 'slide'
}) => {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <AnimatedTransition
          key={index}
          delay={index * staggerDelay}
          type={type}
          direction="up"
        >
          {child}
        </AnimatedTransition>
      ))}
    </div>
  );
};

interface ScrollAnimationProps {
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  type?: 'fade' | 'slide' | 'scale';
  direction?: 'up' | 'down' | 'left' | 'right';
}

export const ScrollAnimation: React.FC<ScrollAnimationProps> = ({
  children,
  className = '',
  threshold = 0.1,
  type = 'slide',
  direction = 'up'
}) => {
  const [isInView, setIsInView] = useState(false);
  const [ref, setRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(ref);
        }
      },
      { threshold }
    );

    observer.observe(ref);

    return () => {
      if (ref) observer.unobserve(ref);
    };
  }, [ref, threshold]);

  const getScrollVariants = () => {
    const variants = {
      fade: {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
      },
      slide: {
        hidden: {
          opacity: 0,
          x: direction === 'left' ? -100 : direction === 'right' ? 100 : 0,
          y: direction === 'up' ? 100 : direction === 'down' ? -100 : 0
        },
        visible: {
          opacity: 1,
          x: 0,
          y: 0
        }
      },
      scale: {
        hidden: { opacity: 0, scale: 0.8 },
        visible: { opacity: 1, scale: 1 }
      }
    };

    return variants[type];
  };

  return (
    <motion.div
      ref={setRef}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={getScrollVariants()}
      transition={{ 
        duration: 0.6,
        ease: 'easeOut'
      }}
    >
      {children}
    </motion.div>
  );
};

interface HoverAnimationProps {
  children: React.ReactNode;
  className?: string;
  hoverScale?: number;
  hoverRotate?: number;
  hoverY?: number;
}

export const HoverAnimation: React.FC<HoverAnimationProps> = ({
  children,
  className = '',
  hoverScale = 1.05,
  hoverRotate = 0,
  hoverY = -5
}) => {
  return (
    <motion.div
      className={className}
      whileHover={{
        scale: hoverScale,
        rotate: hoverRotate,
        y: hoverY,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.div>
  );
};