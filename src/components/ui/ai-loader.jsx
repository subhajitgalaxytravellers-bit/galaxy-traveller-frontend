"use client";

import * as React from "react";
import Image from "next/image";

export const AiLoader = ({ size = 200 }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm transition-all duration-300">
      <div
        className="relative flex items-center justify-center select-none"
        style={{ width: size, height: size }}
      >
        {/* Spinning Loading Circle Outside */}
        <div className="absolute inset-0 rounded-full animate-spin-slow border-4 border-gray-100 border-t-primary border-r-primary/50 shadow-lg"></div>
        
        {/* Pulsing Glow */}
        <div className="absolute inset-2 rounded-full bg-primary/5 animate-pulse"></div>

        {/* Logo in the center */}
        <div className="relative z-10 w-32 h-32 flex items-center justify-center p-4">
            <Image 
                src="/assets/logo.png" 
                alt="Loading..." 
                fill 
                className="object-contain" // ensure logo is fully visible
                priority
            />
        </div>
      </div>
       <style jsx>{`
        .animate-spin-slow {
            animation: spin 3s linear infinite;
        }
        @keyframes spin {
            from {
                transform: rotate(0deg);
            }
            to {
                transform: rotate(360deg);
            }
        }
      `}</style>
    </div>
  );
};
