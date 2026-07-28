import React from 'react';

interface CompanyLogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'colored';
  showSubText?: boolean;
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  className = '',
  variant = 'colored',
  showSubText = true,
}) => {
  // Theme color definitions
  const isDark = variant === 'dark';
  const isLight = variant === 'light';

  // Deep royal blue from official logo image `#1b3687`
  const primaryColor = isDark ? '#ffffff' : isLight ? '#0f172a' : '#1b3687';
  const secondaryColor = isDark ? '#60a5fa' : isLight ? '#1e293b' : '#1b3687';
  const textColorClass = isDark ? 'text-white' : isLight ? 'text-slate-900' : 'text-[#1b3687] dark:text-blue-300';
  const lineColorClass = isDark ? 'bg-blue-400' : isLight ? 'bg-slate-900' : 'bg-[#1b3687] dark:bg-blue-400';

  return (
    <div className={`flex items-center gap-3 sm:gap-4 select-none ${className}`}>
      {/* PP Construction Geometric Pyramid Logo Icon */}
      <svg
        viewBox="0 0 100 85"
        className="h-10 sm:h-12 md:h-14 w-auto shrink-0 transition-all drop-shadow-sm"
        aria-label="PP. Construction Logo Icon"
      >
        <g fill={isDark ? '#60a5fa' : isLight ? '#0f172a' : '#1b3687'}>
          {/* Top Tier (Split Pyramid Apex) */}
          <polygon points="48.25,0 34.65,25 48.25,25" />
          <polygon points="51.75,0 51.75,25 65.35,25" />

          {/* Middle Tier (Split Trapezoid) */}
          <polygon points="32.75,28.5 48.25,28.5 48.25,53.5 19.15,53.5" />
          <polygon points="51.75,28.5 67.25,28.5 80.85,53.5 51.75,53.5" />

          {/* Bottom Tier (3 Shapes: Left Leg, Middle Pillar, Far-Right Accent Block) */}
          <polygon points="17.25,57 35.5,57 24.0,85 2.0,85" />
          <polygon points="51.75,57 65.0,57 73.0,85 51.75,85" />
          <polygon points="75.5,68 87.5,68 95.0,85 83.0,85" />
        </g>
      </svg>

      {/* Typography Block: Top English, Middle Divider, Bottom Thai */}
      <div className={`flex flex-col justify-between py-0.5 h-10 sm:h-12 md:h-14 ${textColorClass}`}>
        {/* Top English Name */}
        <div className="text-[11px] sm:text-xs md:text-sm font-black tracking-wide font-sans uppercase leading-none whitespace-nowrap">
          PP.&nbsp;&nbsp;CONSTRUCTION AND MANAGEMENT CO., LTD
        </div>
        
        {/* Horizontal Divider Line */}
        <div className={`h-[2px] w-full my-1 rounded-full ${lineColorClass}`} />

        {/* Bottom Thai Name */}
        {showSubText && (
          <div className="text-[10px] sm:text-[11px] md:text-xs font-bold tracking-normal leading-none whitespace-nowrap opacity-95">
            บริษัท พีพี. คอนสตรัคชั่น แอนด์ แมนเนจเม้นท์ จำกัด
          </div>
        )}
      </div>
    </div>
  );
};
