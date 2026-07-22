/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface LogoProps {
  size?: number | string;
  className?: string;
  variant?: 'icon' | 'full' | 'compact';
}

export default function Logo({ size = 44, className = '', variant = 'icon' }: LogoProps) {
  // Unique gradient IDs to prevent collisions
  const bgGradId = "logo-bg-grad";
  const silverGradId = "logo-silver-grad";
  const goldGradId = "logo-gold-grad";
  const goldRimId = "logo-lens-gold-rim";
  const glassId = "logo-lens-glass";
  const shadowId = "logo-shadow";

  const renderSvg = (svgSize: number | string) => (
    <svg
      width={svgSize}
      height={svgSize}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="select-none shrink-0"
    >
      <defs>
        <radialGradient id={bgGradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1e1f22" />
          <stop offset="100%" stopColor="#0c0d0e" />
        </radialGradient>

        <linearGradient id={silverGradId} x1="27" y1="26" x2="54" y2="72" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#e4e4e7" />
          <stop offset="100%" stopColor="#a1a1aa" />
        </linearGradient>
        
        <linearGradient id={goldGradId} x1="49" y1="26" x2="73" y2="73" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffe066" />
          <stop offset="30%" stopColor="#f59e0b" />
          <stop offset="70%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>

        <linearGradient id={goldRimId} x1="41" y1="22" x2="59" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#854d0e" />
        </linearGradient>

        <radialGradient id={glassId} cx="48" cy="29" r="6.5" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#52525b" />
          <stop offset="50%" stopColor="#18181b" />
          <stop offset="100%" stopColor="#09090b" />
        </radialGradient>
        
        <filter id={shadowId} x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.6" />
        </filter>
      </defs>

      <rect width="100" height="100" rx="22" fill={`url(#${bgGradId})`} />

      <path d="M 27 26 L 34 31 L 34 50 L 54 47 L 34 67 L 27 72 Z" fill={`url(#${silverGradId})`} filter={`url(#${shadowId})`} />
      <path d="M 27 26 L 34 31 L 34 50 Z" fill="#ffffff" opacity="0.15" />
      <path d="M 34 67 L 27 72 L 34 50 Z" fill="#000000" opacity="0.1" />

      <path d="M 49 41 L 73 26 L 73 39 L 65 58 L 65 73 L 54 47 Z" fill={`url(#${goldGradId})`} filter={`url(#${shadowId})`} />
      <path d="M 49 41 L 73 26 L 65 58 Z" fill="#ffffff" opacity="0.15" />
      <path d="M 65 73 L 54 47 L 65 58 Z" fill="#000000" opacity="0.15" />

      <g filter={`url(#${shadowId})`}>
        <circle cx="50" cy="31" r="9" fill={`url(#${goldRimId})`} />
        <circle cx="50" cy="31" r="7.5" fill="#18181b" />
        <circle cx="50" cy="31" r="6.5" fill={`url(#${glassId})`} />
        <circle cx="48" cy="29" r="1.8" fill="#ffffff" opacity="0.5" />
        <circle cx="47" cy="28" r="0.6" fill="#ffffff" opacity="0.7" />
      </g>
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {renderSvg(size)}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-3 select-none ${className}`}>
        {renderSvg(size)}
        <div className="flex flex-col text-left">
          <span 
            className="text-sm font-extrabold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-[#DFBA6B] via-[#F9E4B7] to-[#A67C1E]"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            MODELVERSEINDIA
          </span>
          <span 
            className="text-[8px] font-medium tracking-[0.1em] text-zinc-400"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            MODELS • INFLUENCERS • BRAND COLLABORATIONS
          </span>
        </div>
      </div>
    );
  }

  // Full Screen branding variant
  return (
    <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
      {renderSvg(typeof size === 'number' ? size : 80)}
      <div className="flex flex-col items-center mt-4">
        <h1 
          className="text-2xl font-black tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-[#DFBA6B] via-[#F9E4B7] to-[#A67C1E] uppercase"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          MODELVERSEINDIA
        </h1>
        <p 
          className="text-[9px] font-bold tracking-[0.2em] text-zinc-400 uppercase mt-2"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Models • Influencers • Brand Collaborations
        </p>
      </div>
    </div>
  );
}
