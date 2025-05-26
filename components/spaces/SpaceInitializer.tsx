'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSpace } from '@/contexts/SpaceContext';
import { UnifiedSpinner } from '@/components/ui/UnifiedSpinner';

export function SpaceInitializer({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { currentSpace, spaces, isLoading } = useSpace();

  useEffect(() => {
    // If loading, wait
    if (isLoading) return;

    // If no spaces exist, redirect to create space
    if (spaces.length === 0) {
      router.push('/spaces/new');
      return;
    }

    // If no current space but spaces exist, redirect to space selection
    if (!currentSpace && spaces.length > 0) {
      router.push('/spaces');
      return;
    }
  }, [currentSpace, spaces, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <UnifiedSpinner size="lg" />
      </div>
    );
  }

  // If no current space, show loading while redirecting
  if (!currentSpace) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <UnifiedSpinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
