'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { spacesApi } from '@/lib/api/spaces/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface CreateSpaceFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateSpaceForm({ onSuccess, onCancel }: CreateSpaceFormProps) {
  const router = useRouter();
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
      const space = await spacesApi.createSpace({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
      });

      toast({
        title: 'Success',
        description: 'Space created successfully',
      });

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/spaces/${space.id}`);
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
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
