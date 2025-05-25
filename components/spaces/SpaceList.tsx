'use client';

import { useState } from 'react';
import { useSpace } from '@/contexts/SpaceContext';
import { useSpacePermissions } from '@/hooks/spaces/useSpacePermissions';
import { spacesApi } from '@/lib/api/spaces/client';
import { Database } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Settings, Star, Users, Trash2, LogIn } from 'lucide-react';
import Link from 'next/link';

type Space = Database['public']['Tables']['spaces']['Row'];
type UserSpace = Database['public']['Tables']['user_spaces']['Row'];

interface SpaceListProps {
  onSpaceSelect?: (space: Space) => void;
}

export function SpaceList({ onSpaceSelect }: SpaceListProps) {
  const { spaces, currentSpace, setCurrentSpace, userSpaces } = useSpace();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSetDefault = async (spaceId: string) => {
    setIsLoading(spaceId);
    try {
      await spacesApi.setDefaultSpace(spaceId);
      toast({
        title: 'Success',
        description: 'Default space updated',
      });
    } catch (error) {
      console.error('Error setting default space:', error);
      toast({
        title: 'Error',
        description: 'Failed to set default space',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(null);
    }
  };

  const handleSelectSpace = async (space: Space) => {
    if (onSpaceSelect) {
      onSpaceSelect(space);
    } else {
      await setCurrentSpace(space);
    }
  };

  const getUserRole = (spaceId: string): string | null => {
    const userSpace = userSpaces.find(us => us.space_id === spaceId);
    return userSpace?.role || null;
  };

  const getDefaultSpaceId = (): string | null => {
    const defaultSpace = userSpaces.find(us => us.is_default);
    return defaultSpace?.space_id || null;
  };

  const defaultSpaceId = getDefaultSpaceId();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {spaces.map((space) => {
        const role = getUserRole(space.id);
        const isDefault = space.id === defaultSpaceId;
        const isCurrent = space.id === currentSpace?.id;

        return (
          <Card key={space.id} className={`relative ${isCurrent ? 'ring-2 ring-primary' : ''}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {space.name}
                    {isDefault && (
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    )}
                  </CardTitle>
                  {space.description && (
                    <CardDescription className="mt-1">
                      {space.description}
                    </CardDescription>
                  )}
                </div>
                <Badge variant={role === 'owner' ? 'default' : 'secondary'}>
                  {role}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={isCurrent ? 'default' : 'outline'}
                  onClick={() => handleSelectSpace(space)}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  {isCurrent ? 'Current' : 'Switch'}
                </Button>
                
                {!isDefault && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSetDefault(space.id)}
                    disabled={isLoading === space.id}
                  >
                    <Star className="mr-2 h-4 w-4" />
                    Set Default
                  </Button>
                )}
                
                {(role === 'owner' || role === 'admin') && (
                  <Link href={`/spaces/${space.id}/settings`}>
                    <Button size="sm" variant="outline">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
