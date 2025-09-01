import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { MessageSquare, Users, Send } from 'lucide-react';
import type { Instance, Contact } from '@shared/schema';

const VARIABLES = ['name', 'city', 'custom1', 'custom2'];

export default function Broadcast() {
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('');
  const [campaignName, setCampaignName] = useState('');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const { toast } = useToast();
  const { credits } = useAuth();
  const queryClient = useQueryClient();

  const { data: instances = [] } = useQuery<Instance[]>({
    queryKey: ['/api/instances'],
  });

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ['/api/contacts', { instanceId: selectedInstanceId }],
    enabled: !!selectedInstanceId,
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: { instanceId: string; name: string; template: string; variables: string[] }) => {
      const res = await apiRequest('POST', '/api/campaigns', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      toast({
        title: "Campaign created",
        description: "Your campaign has been created successfully.",
      });
      setCampaignName('');
      setMessageTemplate('');
    },
  });

  const queueMessagesMutation = useMutation({
    mutationFn: async (data: { instanceId: string; items: { to: string; text: string; contactId: string }[] }) => {
      const res = await apiRequest('POST', '/api/messages/queue', data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      toast({
        title: "Messages queued!",
        description: `${data.queued} messages have been queued. ${data.creditsUsed} credits used.`,
      });
    },
  });

  const insertVariable = (variable: string) => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (textarea) {
      const cursorPos = textarea.selectionStart;
      const textBefore = messageTemplate.substring(0, cursorPos);
      const textAfter = messageTemplate.substring(textarea.selectionEnd);
      const newText = textBefore + `{{${variable}}}` + textAfter;
      setMessageTemplate(newText);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(cursorPos + variable.length + 4, cursorPos + variable.length + 4);
      }, 0);
    }
  };

  const generatePreview = (template: string, contact: Contact) => {
    return template
      .replace(/\{\{name\}\}/g, contact.name || '')
      .replace(/\{\{city\}\}/g, contact.fields?.city || '')
      .replace(/\{\{custom1\}\}/g, contact.fields?.custom1 || '')
      .replace(/\{\{custom2\}\}/g, contact.fields?.custom2 || '');
  };

  const handleCreateAndQueue = async () => {
    if (!selectedInstanceId || !campaignName.trim() || !messageTemplate.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (contacts.length === 0) {
      toast({
        title: "No contacts",
        description: "Please import contacts first.",
        variant: "destructive",
      });
      return;
    }

    if (credits < contacts.length) {
      toast({
        title: "Insufficient credits",
        description: `You need ${contacts.length} credits but only have ${credits}.`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Create campaign first
      const campaign = await createCampaignMutation.mutateAsync({
        instanceId: selectedInstanceId,
        name: campaignName.trim(),
        template: messageTemplate.trim(),
        variables: VARIABLES.filter(v => messageTemplate.includes(`{{${v}}}`)),
      });

      // Queue messages
      const items = contacts.map((contact) => ({
        to: contact.phoneE164,
        text: generatePreview(messageTemplate, contact),
        vars: contact.fields,
      }));

      await queueMessagesMutation.mutateAsync({
        instanceId: selectedInstanceId,
        items,
      });

    } catch (error) {
      toast({
        title: "Failed to create campaign",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6" data-testid="broadcast-page">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Broadcast Campaign</h1>
        <p className="text-muted-foreground">Create and send WhatsApp messages to your contacts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign Builder */}
        <Card data-testid="campaign-builder">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Campaign Builder
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="instance-select">Instance</Label>
              <Select value={selectedInstanceId} onValueChange={setSelectedInstanceId}>
                <SelectTrigger data-testid="select-instance">
                  <SelectValue placeholder="Select an instance" />
                </SelectTrigger>
                <SelectContent>
                  {instances.map((instance) => (
                    <SelectItem key={instance.id} value={instance.id}>
                      {instance.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="campaign-name">Campaign Name</Label>
              <Input
                id="campaign-name"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Enter campaign name"
                data-testid="input-campaign-name"
              />
            </div>

            <div>
              <Label htmlFor="message-template">Message Template</Label>
              <Textarea
                id="message-template"
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                placeholder="Type your message..."
                className="h-32"
                data-testid="textarea-message-template"
              />
            </div>

            <div>
              <Label>Available Variables</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {VARIABLES.map((variable) => (
                  <Button
                    key={variable}
                    variant="secondary"
                    size="sm"
                    onClick={() => insertVariable(variable)}
                    data-testid={`button-variable-${variable}`}
                  >
                    {`{{${variable}}}`}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                data-testid="button-toggle-preview"
              >
                {isPreviewMode ? "Hide Preview" : "Show Preview"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview and Summary */}
        <Card data-testid="campaign-preview">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Preview & Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedInstanceId && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-secondary rounded-lg">
                  <div>
                    <Label className="text-xs">Recipients</Label>
                    <p className="font-bold" data-testid="text-recipient-count">{contacts.length}</p>
                  </div>
                  <div>
                    <Label className="text-xs">Credits Required</Label>
                    <p className="font-bold" data-testid="text-credits-required">{contacts.length}</p>
                  </div>
                  <div>
                    <Label className="text-xs">Available Credits</Label>
                    <p className="font-bold" data-testid="text-available-credits">{credits}</p>
                  </div>
                  <div>
                    <Label className="text-xs">Status</Label>
                    <Badge variant={credits >= contacts.length ? "default" : "destructive"}>
                      {credits >= contacts.length ? "Ready" : "Insufficient Credits"}
                    </Badge>
                  </div>
                </div>

                {isPreviewMode && messageTemplate && contacts.length > 0 && (
                  <div>
                    <Label>Message Preview</Label>
                    <div className="bg-muted rounded-lg p-4 h-48 overflow-y-auto mt-2">
                      <div className="space-y-3">
                        {contacts.slice(0, 3).map((contact, index: number) => (
                          <div
                            key={contact.id}
                            className="bg-background p-3 rounded-lg border border-border"
                            data-testid={`preview-message-${index}`}
                          >
                            <div className="text-sm font-medium text-foreground mb-1">
                              {contact.name} ({contact.phoneE164})
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {generatePreview(messageTemplate, contact)}
                            </div>
                          </div>
                        ))}
                        {contacts.length > 3 && (
                          <div className="text-center text-sm text-muted-foreground">
                            ... and {contacts.length - 3} more contacts
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={handleCreateAndQueue}
                  disabled={
                    !selectedInstanceId ||
                    !campaignName.trim() ||
                    !messageTemplate.trim() ||
                    contacts.length === 0 ||
                    credits < contacts.length ||
                    createCampaignMutation.isPending ||
                    queueMessagesMutation.isPending
                  }
                  data-testid="button-create-and-queue"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {createCampaignMutation.isPending || queueMessagesMutation.isPending
                    ? "Creating Campaign..."
                    : "Create & Queue Campaign"
                  }
                </Button>
              </div>
            )}

            {!selectedInstanceId && (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select an instance to start creating your campaign</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
