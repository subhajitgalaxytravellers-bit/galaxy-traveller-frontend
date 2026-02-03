'use client';

import * as React from 'react';
import Image from 'next/image';

export const AiLoader = ({ size = 220 }) => {
  const logoSize = size * 0.55;
  const ringSize = logoSize + 70; // larger radius

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm transition-all duration-300'>
      <div className='flex flex-col items-center gap-6 select-none'>
        <div
          className='relative flex items-center justify-center'
          style={{ width: size, height: size }}>
          {/* single circular runner hugging the logo */}
          <div
            className='absolute'
            style={{
              width: ringSize,
              height: ringSize,
            }}>
            <svg
              viewBox='0 0 44 44'
              className='w-full h-full text-primary animate-ailoader-rotate'>
              <defs>
                <linearGradient
                  id='ailoaderGradient'
                  x1='0%'
                  y1='0%'
                  x2='100%'
                  y2='0%'>
                  <stop offset='0%' stopColor='currentColor' stopOpacity='1' />
                  <stop
                    offset='70%'
                    stopColor='currentColor'
                    stopOpacity='0.35'
                  />
                  <stop
                    offset='100%'
                    stopColor='currentColor'
                    stopOpacity='0'
                  />
                </linearGradient>
              </defs>
              <circle
                cx='22'
                cy='22'
                r='18'
                fill='none'
                stroke='url(#ailoaderGradient)'
                strokeWidth='1'
                strokeDasharray='28 84'
                className='animate-dash'
                strokeLinecap='round'
              />
            </svg>
          </div>

          {/* center logo */}
          <div
            className='relative z-10 flex items-center justify-center p-2'
            style={{ width: logoSize, height: logoSize }}>
            <Image
              src='/assets/logo.png'
              alt='Loading...'
              fill
              className='object-contain'
              priority
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -112;
          }
        }

        @keyframes ailoader-rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-ailoader-rotate {
          animation: ailoader-rotate 1.1s linear infinite;
        }
        .animate-dash {
          animation: dash 1.2s linear infinite;
        }
      `}</style>
    </div>
  );
};
