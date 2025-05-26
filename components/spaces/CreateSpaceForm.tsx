'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSpace } from '@/contexts/SpaceContext';
import { spacesClient } from '@/lib/api/spaces/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { InlineSpinner } from '@/components/ui/UnifiedSpinner';

interface CreateSpaceFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateSpaceForm({ onSuccess, onCancel }: CreateSpaceFormProps) {
  const router = useRouter();
  const { addSpace } = useSpace();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Space name is required',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const space = await spacesClient.createSpace({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
      });

      // 새로 생성된 스페이스를 즉시 목록에 추가
      const newSpaceWithRole = {
        ...space,
        user_role: 'owner', // 생성자는 owner
        is_default: false   // 새 스페이스는 기본값이 아님
      };
      
      addSpace(newSpaceWithRole);

      toast({
        title: 'Success',
        description: 'Space created successfully',
      });

      if (onSuccess) {
        onSuccess();
      } else {
        // 새로 생성된 스페이스로 리다이렉트
        router.push(`/dashboard/space/${space.id}`);
      }
    } catch (error) {
      console.error('Error creating space:', error);
      toast({
        title: 'Error',
        description: 'Failed to create space',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Space Name</Label>
        <Input
          id="name"
          placeholder="e.g., Personal, Work, Project X"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          disabled={isLoading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          placeholder="Describe the purpose of this space..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          disabled={isLoading}
          rows={3}
        />
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <InlineSpinner className="w-4 h-4 mr-2" />
              Creating...
            </>
          ) : (
            'Create Space'
          )}
        </Button>
      </div>
    </form>
  );
}
