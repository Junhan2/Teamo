'use client';

import { ReactNode } from 'react';
import SpaceSubHeader from '@/components/SpaceSubHeader';

export default function SpaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <SpaceSubHeader />
      {children}
    </>
  );
}
