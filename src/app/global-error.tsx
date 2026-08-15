'use client';

import React from 'react';
import { RefreshCw, Home, Sparkles } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('[GLOBAL_APP_ERROR]', error);
    const msg = error?.message?.toLowerCase() || '';
    if (msg.includes('chunk') || msg.includes('loading') || msg.includes('failed to fetch') || msg.includes('dynamically imported') || msg.includes('resource')) {
      const hasReloaded = sessionStorage.getItem('auto_global_reloaded');
      if (!hasReloaded) {
        sessionStorage.setItem('auto_global_reloaded', 'true');
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#fcfdff] text-[#1e293b] flex items-center justify-center p-6 antialiased font-sans">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-blue-600">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900">
              AI Institute Satana
            </h2>
            <p className="text-sm text-slate-500">
              Application session refreshed. Click reload to continue.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => reset()}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Page</span>
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Go to Home</span>
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
