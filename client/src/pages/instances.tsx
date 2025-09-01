import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Building2, Plus, Settings, Trash2 } from 'lucide-react';
import type { Instance } from '@shared/schema';

export default function Instances() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: instances = [], isLoading } = useQuery<Instance[]>({
    queryKey: ['/api/instances'],
  });

  const createInstanceMutation = useMutation({
    mutationFn: async (data: { name: string; webhookUrl?: string }) => {
      const res = await apiRequest('POST', '/api/instances', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/instances'] });
      setIsCreateOpen(false);
      setNewInstanceName('');
      setWebhookUrl('');
      toast({
        title: "Instance created",
        description: "Your new instance has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create instance",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const toggleInstanceMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await apiRequest('PATCH', `/api/instances/${id}`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/instances'] });
      toast({
        title: "Instance updated",
        description: "Instance status has been updated.",
      });
    },
  });

  const handleCreateInstance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstanceName.trim()) return;

    createInstanceMutation.mutate({
      name: newInstanceName.trim(),
      webhookUrl: webhookUrl.trim() || undefined,
    });
  };

  const handleToggleInstance = (id: string, currentStatus: boolean) => {
    toggleInstanceMutation.mutate({ id, isActive: !currentStatus });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="instances-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Instances</h1>
          <p className="text-muted-foreground">Manage your WhatsApp marketing instances</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-instance">
              <Plus className="w-4 h-4 mr-2" />
              Create Instance
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Instance</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateInstance} className="space-y-4">
              <div>
                <Label htmlFor="instance-name">Instance Name</Label>
                <Input
                  id="instance-name"
                  value={newInstanceName}
                  onChange={(e) => setNewInstanceName(e.target.value)}
                  placeholder="e.g., Marketing Campaign"
                  required
                  data-testid="input-instance-name"
                />
              </div>
              <div>
                <Label htmlFor="webhook-url">Webhook URL (Optional)</Label>
                <Input
                  id="webhook-url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://your-domain.com/webhook"
                  type="url"
                  data-testid="input-webhook-url"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createInstanceMutation.isPending} data-testid="button-submit-instance">
                  {createInstanceMutation.isPending ? "Creating..." : "Create Instance"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {instances.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No instances yet</h3>
              <p className="text-muted-foreground mb-4 text-center">
                Create your first instance to start managing WhatsApp campaigns
              </p>
              <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-first-instance">
                <Plus className="w-4 h-4 mr-2" />
                Create Instance
              </Button>
            </CardContent>
          </Card>
        ) : (
          instances.map((instance) => (
            <Card key={instance.id} data-testid={`instance-card-${instance.id}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{instance.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(instance.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={instance.isActive ? "default" : "secondary"}>
                      {instance.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`toggle-${instance.id}`} className="text-sm">
                        {instance.isActive ? "Active" : "Inactive"}
                      </Label>
                      <Switch
                        id={`toggle-${instance.id}`}
                        checked={instance.isActive}
                        onCheckedChange={() => handleToggleInstance(instance.id, instance.isActive)}
                        disabled={toggleInstanceMutation.isPending}
                        data-testid={`switch-instance-${instance.id}`}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Instance ID</Label>
                    <p className="text-sm text-muted-foreground font-mono">{instance.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Webhook URL</Label>
                    <p className="text-sm text-muted-foreground">
                      {instance.webhookUrl || "Not configured"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" data-testid={`button-settings-${instance.id}`}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive" data-testid={`button-delete-${instance.id}`}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
