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
import { Star, Users, LogIn, Crown } from 'lucide-react';
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

  const handleSetDefault = async (spaceId: string) => {
    // 낙관적 업데이트 - UI를 즉시 업데이트
    context.updateSpaceDefault(spaceId);
    
    toast({
      title: 'Success',
      description: 'Default space updated',
    });
    
    try {
      // 백그라운드에서 서버 업데이트
      await context.setDefaultSpace(spaceId);
    } catch (error) {
      console.error('Error setting default space:', error);
      // 실패시 롤백
      context.refreshSpaces();
      toast({
        title: 'Error',
        description: 'Failed to set default space. Changes reverted.',
        variant: 'destructive',
      });
    }
  };

  const handleSelectSpace = async (space: Space) => {
    if (onSpaceSelect) {
      onSpaceSelect(space);
    } else {
      await switchSpace(space.id);
    }
  };

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
                    {role === 'owner' && (
                      <Crown className="h-4 w-4 text-amber-600" />
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
                  className={`transition-colors duration-200 ${
                    isCurrent 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'border-gray-300 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50'
                  }`}
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
                    className="border-gray-300 hover:border-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 transition-colors duration-200"
                  >
                    <Star className="mr-2 h-4 w-4" />
                    Set Default
                  </Button>
                )}
                
                {(role === 'owner' || role === 'admin') && (
                  <Link href={`/spaces/${space.id}/members`}>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-gray-300 hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition-colors duration-200"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Members
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
