'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Users, Lock, Globe } from 'lucide-react';

interface ShareFilterProps {
  value: 'all' | 'personal' | 'shared';
  onChange: (value: 'all' | 'personal' | 'shared') => void;
}

export function ShareFilter({ value, onChange }: ShareFilterProps) {
  return (
    <ToggleGroup 
      type="single" 
      value={value} 
      onValueChange={(v) => v && onChange(v as any)}
      className="justify-start"
    >
      <ToggleGroupItem value="all" aria-label="All tasks">
        <Globe className="h-4 w-4 mr-2" />
        All
      </ToggleGroupItem>
      <ToggleGroupItem value="personal" aria-label="Personal tasks">
        <Lock className="h-4 w-4 mr-2" />
        Personal
      </ToggleGroupItem>
      <ToggleGroupItem value="shared" aria-label="Shared tasks">
        <Users className="h-4 w-4 mr-2" />
        Shared
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
