'use client';

import * as React from 'react';
import Image from 'next/image';

export const AiLoader = () => {
  const size = 120;
  const logoSize = 65;

  return (
    <div
      className='fixed inset-0 z-[9999] flex items-center justify-center bg-white/85'
      style={{ animation: 'loaderFadeIn 0.15s ease-out forwards' }}
    >
      <div className='relative flex items-center justify-center' style={{ width: size, height: size }}>
        {/* Spinning Ring */}
        <svg
          className='absolute inset-0 w-full h-full'
          viewBox='0 0 120 120'
          style={{ animation: 'loaderSpin 0.85s linear infinite' }}
        >
          {/* Track */}
          <circle cx='60' cy='60' r='56' fill='none' stroke='#f1f5f9' strokeWidth='4' />
          {/* Arc */}
          <circle
            cx='60'
            cy='60'
            r='56'
            fill='none'
            stroke='var(--color-primary, #2563eb)'
            strokeWidth='4'
            strokeDasharray='90 262'
            strokeLinecap='round'
            strokeDashoffset='0'
          />
        </svg>

        {/* Center Logo */}
        <div className='relative z-10 flex items-center justify-center w-full h-full'>
          <div className='relative' style={{ width: logoSize, height: logoSize }}>
            <Image
              src='/assets/logo.png'
              alt='Loading'
              fill
              className='object-contain drop-shadow-sm'
              sizes='65px'
              priority
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes loaderSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes loaderFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};
