import React, { useEffect, useState } from 'react';
import { Zap, ArrowUp, Code, Shield, Database } from 'lucide-react';

interface LoadingScreenProps {
  onComplete?: () => void;
  duration?: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  onComplete, 
  duration = 1500 
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const steps = [
    { icon: <Zap className="w-8 h-8" />, text: 'Initializing uAI Systems', color: 'text-blue-400' },
    { icon: <Shield className="w-8 h-8" />, text: 'Securing Connections', color: 'text-green-400' },
    { icon: <Database className="w-8 h-8" />, text: 'Loading Data Sources', color: 'text-purple-400' },
    { icon: <Code className="w-8 h-8" />, text: 'Compiling Intelligence', color: 'text-cyan-400' },
    { icon: <ArrowUp className="w-8 h-8" />, text: 'Up Arrow Inc Ready', color: 'text-orange-400' },
  ];

  useEffect(() => {
    const stepDuration = duration / steps.length;
    
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (duration / 50));
        
        // Update current step
        const stepIndex = Math.floor((newProgress / 100) * steps.length);
        setCurrentStep(Math.min(stepIndex, steps.length - 1));
        
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => onComplete?.(), 500);
          }, 500);
          return 100;
        }
        
        return newProgress;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [duration, onComplete, steps.length]);

  if (!isVisible) return null;

  return (
    <div className={`
      fixed inset-0 z-[9999] bg-black flex items-center justify-center
      transition-opacity duration-500
      ${progress >= 100 ? 'opacity-0' : 'opacity-100'}
    `}>
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
        
        {/* Floating orbs */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className={`
              absolute w-32 h-32 rounded-full opacity-10 animate-pulse
              ${i % 4 === 0 ? 'bg-blue-500' : 
                i % 4 === 1 ? 'bg-purple-500' : 
                i % 4 === 2 ? 'bg-cyan-500' : 'bg-orange-500'}
            `}
            style={{
              left: `${10 + (i * 12)}%`,
              top: `${15 + (i * 10)}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${2 + (i * 0.2)}s`,
            }}
          />
        ))}

        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-md mx-auto px-6">
        {/* Logo */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4 animate-pulse">
            <ArrowUp className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Up Arrow Inc
          </h1>
          <p className="text-gray-400 text-sm mt-2">Technology Consulting Platform</p>
        </div>

        {/* Current step */}
        <div className="mb-8 h-16 flex items-center justify-center">
          <div className="flex items-center gap-4">
            <div className={`transition-colors duration-300 ${steps[currentStep]?.color || 'text-gray-400'}`}>
              {steps[currentStep]?.icon}
            </div>
            <div className="text-left">
              <p className={`font-medium transition-colors duration-300 ${steps[currentStep]?.color || 'text-gray-400'}`}>
                {steps[currentStep]?.text || 'Loading...'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-800 rounded-full h-2 mb-4 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 transition-all duration-300 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Progress percentage */}
        <p className="text-gray-400 text-sm">
          {Math.round(progress)}% Complete
        </p>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`
                w-2 h-2 rounded-full transition-all duration-300
                ${index <= currentStep 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 scale-125' 
                  : 'bg-gray-700 scale-100'
                }
              `}
            />
          ))}
        </div>
      </div>
    </div>
  );
};