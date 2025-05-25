'use client';

import { ReactNode } from 'react';
import { SpaceProvider } from '@/contexts/SpaceContext';
import { SpaceInitializer } from '@/components/spaces/SpaceInitializer';

export default function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SpaceProvider>
      <SpaceInitializer>
        {children}
      </SpaceInitializer>
    </SpaceProvider>
  );
}
