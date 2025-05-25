import { CreateSpaceForm } from '@/components/spaces/CreateSpaceForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NewSpacePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/spaces">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Spaces
            </Button>
          </Link>
          
          <h1 className="text-3xl font-bold">Create New Space</h1>
          <p className="text-muted-foreground mt-2">
            Set up a new workspace for your projects and teams
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Space Details</CardTitle>
            <CardDescription>
              Choose a name and description for your new space
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateSpaceForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
