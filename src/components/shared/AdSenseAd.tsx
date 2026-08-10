'use client';

import React, { useEffect } from 'react';

interface AdSenseAdProps {
  adSlot?: string;
  adFormat?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  fullWidthResponsive?: boolean;
  className?: string;
}

/**
 * Reusable Google AdSense Banner Component for Next.js App Router
 * Place anywhere in your layout, sidebar, course pages, or landing page.
 */
export const AdSenseAd: React.FC<AdSenseAdProps> = ({
  adSlot = '1234567890',
  adFormat = 'auto',
  fullWidthResponsive = true,
  className = '',
}) => {
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-8428613200514609';

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      console.warn('[AdSense] Ad push error:', err);
    }
  }, [adSlot]);

  return (
    <div className={`my-6 mx-auto w-full max-w-5xl overflow-hidden rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/40 p-2 text-center shadow-sm ${className}`}>
      <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 mb-1">
        Advertisement
      </div>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', minHeight: '90px' }}
        data-ad-client={publisherId}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
      />
    </div>
  );
};
