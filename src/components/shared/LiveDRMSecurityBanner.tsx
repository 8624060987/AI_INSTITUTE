'use client';

import React from 'react';

interface LiveDRMProps {
  user?: {
    fullName?: string;
    email?: string;
    id?: string;
  } | null;
  children?: React.ReactNode;
}

export const LiveDRMSecurityBanner: React.FC<LiveDRMProps> = () => {
  return null;
};

export const LiveDRMGuardWrapper: React.FC<LiveDRMProps> = ({ children }) => {
  return <div className="w-full h-full relative overflow-hidden">{children}</div>;
};
