'use client';

import { useSpace } from '@/contexts/SpaceContext';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';

export function SpaceInfo({ className }: { className?: string }) {
  const { currentSpace } = useSpace();

  if (!currentSpace) return null;

  return (
    <div className={className}>
      <Badge variant="outline" className="gap-2">
        <Building2 className="h-3 w-3" />
        {currentSpace.name}
      </Badge>
    </div>
  );
}
