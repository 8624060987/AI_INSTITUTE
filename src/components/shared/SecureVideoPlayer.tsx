'use client';

import React from 'react';

interface SecureVideoPlayerProps {
  src?: string;
  title?: string;
  description?: string;
  user?: {
    id?: string;
    fullName?: string;
    email?: string;
    mobileNumber?: string;
  } | null;
  onEnded?: () => void;
}

export const SecureVideoPlayer: React.FC<SecureVideoPlayerProps> = ({
  src,
  title,
  description,
  onEnded
}) => {
  return (
    <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black relative border border-slate-200 dark:border-slate-800 shadow-md">
      <video
        src={src}
        controls
        controlsList="nodownload"
        className="w-full h-full object-cover pointer-events-auto"
        onEnded={onEnded}
      />
    </div>
  );
};
