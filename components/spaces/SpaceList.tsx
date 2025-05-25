'use client';

import { useState } from 'react';
import { useSpace } from '@/contexts/SpaceContext';
import { useSpacePermissions } from '@/hooks/spaces/useSpacePermissions';
import { spacesClient } from '@/lib/api/spaces/client';
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
  const context = useSpace();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  
  // SpaceContext가 없을 때의 폴백
  if (!context) {
    return <div>Loading spaces...</div>;
  }
  
  const { spaces, currentSpace, switchSpace } = context;
  
  // userSpaces를 spaces에서 추출
  const userSpaces = spaces.map(s => ({
    space_id: s.id,
    user_id: s.created_by,
    role: s.user_role,
    is_default: s.is_default
  }));

  const handleSetDefault = async (spaceId: string) => {
    setIsLoading(spaceId);
    try {
      await spacesClient.setDefaultSpace(spaceId);
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
      await switchSpace(space.id);
    }
  };

  const getUserRole = (spaceId: string): string | null => {
    const space = spaces.find(s => s.id === spaceId);
    return space?.user_role || null;
  };

  const getDefaultSpaceId = (): string | null => {
    const defaultSpace = spaces.find(s => s.is_default);
    return defaultSpace?.id || null;
  };

  const defaultSpaceId = getDefaultSpaceId();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {spaces.map((space) => {
        const role = space.user_role;
        const isDefault = space.is_default;
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
                  <>
                    <Link href={`/spaces/${space.id}/members`}>
                      <Button size="sm" variant="outline">
                        <Users className="mr-2 h-4 w-4" />
                        Members
                      </Button>
                    </Link>
                    <Link href={`/spaces/${space.id}/settings`}>
                      <Button size="sm" variant="outline">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
