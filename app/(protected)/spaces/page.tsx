import { SpaceList } from '@/components/spaces/SpaceList';
import { CreateSpaceForm } from '@/components/spaces/CreateSpaceForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SpacesPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Your Spaces</h1>
        <p className="text-muted-foreground mt-2">
          Manage your workspaces and switch between different contexts
        </p>
      </div>

      <Tabs defaultValue="spaces" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="spaces">My Spaces</TabsTrigger>
          <TabsTrigger value="create">Create New</TabsTrigger>
        </TabsList>
        
        <TabsContent value="spaces" className="mt-6">
          <SpaceList />
        </TabsContent>
        
        <TabsContent value="create" className="mt-6">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Create a New Space</CardTitle>
              <CardDescription>
                Spaces help you organize your tasks and collaborate with different teams
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateSpaceForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
