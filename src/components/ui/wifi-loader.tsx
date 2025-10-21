import React from 'react';

interface WifiLoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const WifiLoader: React.FC<WifiLoaderProps> = ({ 
  text = "Loading", 
  size = 'md',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16', 
    lg: 'w-20 h-20'
  };

  const svgSizes = {
    sm: { outer: 48, middle: 36, inner: 24 },
    md: { outer: 64, middle: 48, inner: 32 },
    lg: { outer: 80, middle: 60, inner: 40 }
  };

  const { outer, middle, inner } = svgSizes[size];

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} relative flex justify-center items-center`}>
        {/* Outer Circle */}
        <svg 
          className="absolute" 
          viewBox={`0 0 ${outer} ${outer}`}
          style={{ width: outer, height: outer }}
        >
          <circle 
            className="fill-none stroke-gray-300 stroke-2 stroke-linecap-round stroke-linejoin-round -rotate-100 origin-center"
            cx={outer/2} 
            cy={outer/2} 
            r={outer/2 - 3}
            style={{ strokeDasharray: `${(outer-6) * 0.33} ${(outer-6) * 0.67}` }}
          />
          <circle 
            className="fill-none stroke-blue-600 stroke-2 stroke-linecap-round stroke-linejoin-round -rotate-100 origin-center animate-pulse"
            cx={outer/2} 
            cy={outer/2} 
            r={outer/2 - 3}
            style={{ strokeDasharray: `${(outer-6) * 0.33} ${(outer-6) * 0.67}` }}
          />
        </svg>

        {/* Middle Circle */}
        <svg 
          className="absolute" 
          viewBox={`0 0 ${middle} ${middle}`}
          style={{ width: middle, height: middle }}
        >
          <circle 
            className="fill-none stroke-gray-300 stroke-2 stroke-linecap-round stroke-linejoin-round -rotate-100 origin-center"
            cx={middle/2} 
            cy={middle/2} 
            r={middle/2 - 3}
            style={{ strokeDasharray: `${(middle-6) * 0.33} ${(middle-6) * 0.67}` }}
          />
          <circle 
            className="fill-none stroke-blue-500 stroke-2 stroke-linecap-round stroke-linejoin-round -rotate-100 origin-center animate-pulse"
            cx={middle/2} 
            cy={middle/2} 
            r={middle/2 - 3}
            style={{ 
              strokeDasharray: `${(middle-6) * 0.33} ${(middle-6) * 0.67}`,
              animationDelay: '0.1s'
            }}
          />
        </svg>

        {/* Inner Circle */}
        <svg 
          className="absolute" 
          viewBox={`0 0 ${inner} ${inner}`}
          style={{ width: inner, height: inner }}
        >
          <circle 
            className="fill-none stroke-gray-300 stroke-2 stroke-linecap-round stroke-linejoin-round -rotate-100 origin-center"
            cx={inner/2} 
            cy={inner/2} 
            r={inner/2 - 3}
            style={{ strokeDasharray: `${(inner-6) * 0.33} ${(inner-6) * 0.67}` }}
          />
          <circle 
            className="fill-none stroke-blue-400 stroke-2 stroke-linecap-round stroke-linejoin-round -rotate-100 origin-center animate-pulse"
            cx={inner/2} 
            cy={inner/2} 
            r={inner/2 - 3}
            style={{ 
              strokeDasharray: `${(inner-6) * 0.33} ${(inner-6) * 0.67}`,
              animationDelay: '0.2s'
            }}
          />
        </svg>
      </div>
      
      {/* Text */}
      <div className="mt-4 text-sm font-medium text-gray-600 animate-pulse">
        {text}
      </div>
    </div>
  );
};

export default WifiLoader;
