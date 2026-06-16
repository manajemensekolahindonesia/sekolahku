import React from 'react';

export default function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div className={`relative group ${className}`}>
      <img 
        src="/favicon.png" 
        alt="PEMURYADI Logo" 
        className="w-full h-full object-contain drop-shadow-sm transition-all duration-300 group-hover:scale-105"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
