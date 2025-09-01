import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import QueueTable from '@/components/queue/queue-table';
import { useToast } from '@/hooks/use-toast';
import { List, ExternalLink, Search, RefreshCw } from 'lucide-react';
import type { Instance, Message } from '@shared/schema';

export default function MessageQueue() {
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpeningTabs, setIsOpeningTabs] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: instances = [] } = useQuery<Instance[]>({
    queryKey: ['/api/instances'],
  });

  const { data: messages = [], isLoading, refetch } = useQuery<Message[]>({
    queryKey: ['/api/messages', { 
      instanceId: selectedInstanceId,
      status: statusFilter === 'all' ? undefined : statusFilter,
      q: searchQuery || undefined,
      limit: 100
    }],
    enabled: !!selectedInstanceId,
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  const openTabsMutation = useMutation({
    mutationFn: async (messageIds: string[]) => {
      // Generate signed deeplinks for each message
      const deeplinks = await Promise.all(
        messageIds.map(async (messageId) => {
          const res = await fetch(`/api/deeplink?messageId=${messageId}&t=${Date.now() + 3600000}&s=demo`);
          if (res.ok) {
            return res.url;
          }
          throw new Error('Failed to generate deeplink');
        })
      );
      return deeplinks;
    },
    onSuccess: (deeplinks) => {
      // Open up to 5 tabs
      const tabsToOpen = deeplinks.slice(0, 5);
      
      tabsToOpen.forEach((url, index) => {
        setTimeout(() => {
          window.open(url, '_blank');
        }, index * 500); // Stagger tab opening
      });

      toast({
        title: "Tabs opened",
        description: `Opened ${tabsToOpen.length} WhatsApp tabs.`,
      });

      // Refresh the messages to update status
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      }, 1000);
    },
    onError: (error) => {
      toast({
        title: "Failed to open tabs",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const handleOpenBulkTabs = async () => {
    if (!selectedInstanceId) {
      toast({
        title: "No instance selected",
        description: "Please select an instance first.",
        variant: "destructive",
      });
      return;
    }

    // Get the next 5 queued messages
    const queuedMessages = messages
      .filter((msg) => msg.status === 'queued')
      .slice(0, 5);

    if (queuedMessages.length === 0) {
      toast({
        title: "No queued messages",
        description: "There are no messages in the queue to open.",
        variant: "destructive",
      });
      return;
    }

    setIsOpeningTabs(true);
    try {
      // In a real implementation, this would use the actual deeplink API
      // For now, we'll simulate opening WhatsApp tabs
      const messageIds = queuedMessages.map((msg) => msg.id);
      
      // Simulate opening WhatsApp tabs
      queuedMessages.forEach((message, index: number) => {
        const encodedMessage = encodeURIComponent(message.text);
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${message.to.replace('+', '')}&text=${encodedMessage}`;
        
        setTimeout(() => {
          window.open(whatsappUrl, '_blank');
        }, index * 500);
      });

      toast({
        title: "Tabs opened",
        description: `Opened ${queuedMessages.length} WhatsApp tabs.`,
      });

      // Update message status to opened_link
      // In a real implementation, this would be done via the backend
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      }, 1000);

    } catch (error) {
      toast({
        title: "Failed to open tabs",
        description: "Something went wrong while opening WhatsApp tabs.",
        variant: "destructive",
      });
    } finally {
      setIsOpeningTabs(false);
    }
  };

  const queuedCount = messages.filter((msg) => msg.status === 'queued').length;
  const processingCount = messages.filter((msg) => msg.status === 'processing').length;
  const completedCount = messages.filter((msg) => msg.status === 'opened_link' || msg.status === 'sent_by_user').length;
  const failedCount = messages.filter((msg) => msg.status === 'failed').length;

  return (
    <div className="space-y-6" data-testid="message-queue-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Message Queue</h1>
          <p className="text-muted-foreground">Monitor and manage your message queue</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
            data-testid="button-refresh"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleOpenBulkTabs}
            disabled={!selectedInstanceId || queuedCount === 0 || isOpeningTabs}
            data-testid="button-open-bulk-tabs"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            {isOpeningTabs ? "Opening..." : `Open Next ${Math.min(queuedCount, 5)} Tabs`}
          </Button>
        </div>
      </div>

      {/* Queue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div>
                <div className="text-2xl font-bold text-foreground" data-testid="stat-queued">
                  {queuedCount}
                </div>
                <div className="text-sm text-muted-foreground">Queued</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div>
                <div className="text-2xl font-bold text-foreground" data-testid="stat-processing">
                  {processingCount}
                </div>
                <div className="text-sm text-muted-foreground">Processing</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <div className="text-2xl font-bold text-foreground" data-testid="stat-completed">
                  {completedCount}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div>
                <div className="text-2xl font-bold text-foreground" data-testid="stat-failed">
                  {failedCount}
                </div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="queued">Queued</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="opened_link">Link Opened</SelectItem>
                  <SelectItem value="sent_by_user">Sent by User</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search phone or message..."
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue Table */}
      {!selectedInstanceId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <List className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No instance selected</h3>
            <p className="text-muted-foreground text-center">
              Please select an instance to view the message queue
            </p>
          </CardContent>
        </Card>
      ) : (
        <QueueTable
          instanceId={selectedInstanceId}
          messages={messages}
          isLoading={isLoading}
          onRefresh={() => refetch()}
        />
      )}
    </div>
  );
}
