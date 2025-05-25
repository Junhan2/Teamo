'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSpace } from '@/contexts/SpaceContext';
import { spacesApi } from '@/lib/api/spaces/client';
import { Database } from '@/types/supabase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, Plus, Settings, Check } from 'lucide-react';

type Space = Database['public']['Tables']['spaces']['Row'];

export function SpaceSelector() {
  const router = useRouter();
  const { currentSpace, setCurrentSpace, spaces, isLoading } = useSpace();
  const [isOpen, setIsOpen] = useState(false);

  const handleSpaceChange = async (space: Space) => {
    await setCurrentSpace(space);
    setIsOpen(false);
  };

  const handleCreateSpace = () => {
    router.push('/spaces/new');
    setIsOpen(false);
  };

  const handleManageSpaces = () => {
    router.push('/spaces');
    setIsOpen(false);
  };

  if (isLoading) {
    return (
      <div className="h-10 w-48 bg-gray-200 animate-pulse rounded-md" />
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-48 justify-between">
          <span className="truncate">
            {currentSpace?.name || 'Select Space'}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        <DropdownMenuLabel>Your Spaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {spaces.map((space) => (
          <DropdownMenuItem
            key={space.id}
            onClick={() => handleSpaceChange(space)}
            className="flex items-center justify-between"
          >
            <span className="truncate">{space.name}</span>
            {currentSpace?.id === space.id && (
              <Check className="h-4 w-4 ml-2" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCreateSpace}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Space
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleManageSpaces}>
          <Settings className="mr-2 h-4 w-4" />
          Manage Spaces
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
