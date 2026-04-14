import React from 'react';

export const RSSLogo: React.FC<{ size?: number }> = ({ size = 144 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 144 144" 
      xmlns="http://www.w3.org/2000/svg"
      className="rss-logo"
    >
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor:'#1a1a1a', stopOpacity:1}} />
          <stop offset="100%" style={{stopColor:'#0a0a0a', stopOpacity:1}} />
        </linearGradient>
        <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor:'#3b82f6', stopOpacity:1}} />
          <stop offset="50%" style={{stopColor:'#8b5cf6', stopOpacity:1}} />
          <stop offset="100%" style={{stopColor:'#06b6d4', stopOpacity:1}} />
        </linearGradient>
        <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{stopColor:'#60a5fa', stopOpacity:1}} />
          <stop offset="100%" style={{stopColor:'#a78bfa', stopOpacity:1}} />
        </linearGradient>
      </defs>
      
      {/* Background */}
      <rect width="144" height="144" rx="20" fill="url(#bgGradient)" stroke="#374151" strokeWidth="2"/>
      
      {/* Up Arrow Symbol */}
      <g transform="translate(72, 45)">
        <path d="M0,-15 L-12,0 L-6,0 L-6,15 L6,15 L6,0 L12,0 Z" fill="url(#arrowGradient)" stroke="#1e40af" strokeWidth="1"/>
        {/* Highlight effect */}
        <path d="M0,-15 L-12,0 L-6,0 L-6,6 L6,6 L6,0 L12,0 Z" fill="url(#arrowGradient)" opacity="0.8"/>
      </g>
      
      {/* AI Circuit Pattern */}
      <g transform="translate(30, 75)" opacity="0.6">
        <circle cx="0" cy="0" r="2" fill="#3b82f6"/>
        <circle cx="20" cy="0" r="2" fill="#8b5cf6"/>
        <circle cx="40" cy="0" r="2" fill="#06b6d4"/>
        <circle cx="60" cy="0" r="2" fill="#3b82f6"/>
        <circle cx="80" cy="0" r="2" fill="#8b5cf6"/>
        
        {/* Connecting lines */}
        <line x1="2" y1="0" x2="18" y2="0" stroke="#3b82f6" strokeWidth="1"/>
        <line x1="22" y1="0" x2="38" y2="0" stroke="#8b5cf6" strokeWidth="1"/>
        <line x1="42" y1="0" x2="58" y2="0" stroke="#06b6d4" strokeWidth="1"/>
        <line x1="62" y1="0" x2="78" y2="0" stroke="#3b82f6" strokeWidth="1"/>
      </g>
      
      {/* uAI Text */}
      <text x="45" y="100" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold" fill="url(#textGradient)">uAI</text>
      
      {/* Up Arrow Inc Text */}
      <text x="25" y="118" fontFamily="Arial, sans-serif" fontSize="10" fill="#9ca3af">up arrow inc</text>
      
      {/* RSS indicator */}
      <g transform="translate(110, 110)">
        <circle cx="0" cy="0" r="12" fill="#f97316" opacity="0.8"/>
        <text x="0" y="4" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="white" textAnchor="middle">RSS</text>
      </g>
      
      {/* Subtle glow effect */}
      <circle cx="72" cy="72" r="60" fill="none" stroke="url(#arrowGradient)" strokeWidth="1" opacity="0.3"/>
    </svg>
  );
};