import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ExternalLink, List, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { Message } from '@shared/schema';

interface QueueTableProps {
  instanceId?: string;
  messages?: Message[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export default function QueueTable({ instanceId, messages = [], isLoading = false, onRefresh }: QueueTableProps) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [isOpeningTabs, setIsOpeningTabs] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const openTabMutation = useMutation({
    mutationFn: async (messageId: string) => {
      // In a real implementation, this would call the deeplink API
      // For now, we'll simulate the WhatsApp deeplink opening
      const message = messages.find((m) => m.id === messageId);
      if (message) {
        const encodedMessage = encodeURIComponent(message.text);
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${message.to.replace('+', '')}&text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
        
        // Update the message status (in real app, this would be done by backend)
        return { success: true };
      }
      throw new Error('Message not found');
    },
    onSuccess: () => {
      toast({
        title: "WhatsApp tab opened",
        description: "Message link has been opened in a new tab.",
      });
      if (onRefresh) {
        setTimeout(onRefresh, 1000);
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to open tab",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const handleOpenBulkTabs = async () => {
    if (!instanceId) {
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
      // Open tabs with staggered timing
      for (let i = 0; i < queuedMessages.length; i++) {
        const message = queuedMessages[i];
        setTimeout(() => {
          const encodedMessage = encodeURIComponent(message.text);
          const whatsappUrl = `https://api.whatsapp.com/send?phone=${message.to.replace('+', '')}&text=${encodedMessage}`;
          window.open(whatsappUrl, '_blank');
        }, i * 500); // 500ms delay between each tab
      }

      toast({
        title: "Tabs opened",
        description: `Opened ${queuedMessages.length} WhatsApp tabs.`,
      });

      // Refresh after opening tabs
      if (onRefresh) {
        setTimeout(onRefresh, 2000);
      }

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'opened_link':
        return 'bg-green-100 text-green-800';
      case 'sent_by_user':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued':
        return Clock;
      case 'processing':
        return AlertCircle;
      case 'opened_link':
      case 'sent_by_user':
        return CheckCircle;
      case 'failed':
      case 'expired':
        return XCircle;
      default:
        return Clock;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'opened_link':
        return 'Link Opened';
      case 'sent_by_user':
        return 'Sent by User';
      case 'queued':
        return 'Queued';
      case 'processing':
        return 'Processing';
      case 'failed':
        return 'Failed';
      case 'expired':
        return 'Expired';
      default:
        return status;
    }
  };

  const filteredMessages = messages.filter((message) => {
    if (statusFilter !== 'all' && message.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const queuedCount = messages.filter((msg) => msg.status === 'queued').length;

  return (
    <Card data-testid="message-queue-table">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <List className="w-5 h-5" />
            Message Queue
          </CardTitle>
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-queue-status">
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
            <Button
              onClick={handleOpenBulkTabs}
              disabled={queuedCount === 0 || isOpeningTabs}
              data-testid="button-open-bulk-tabs"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {isOpeningTabs ? "Opening..." : `Open Next ${Math.min(queuedCount, 5)} Tabs`}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-8">
            <List className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No messages in queue</h3>
            <p className="text-muted-foreground">
              {statusFilter !== 'all' 
                ? `No messages with status "${statusFilter}"` 
                : "Create a campaign to start queueing messages"
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Message Preview</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Queued</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMessages.map((message, index: number) => {
                  const StatusIcon = getStatusIcon(message.status);
                  const canOpenTab = message.status === 'queued' || message.status === 'processing';
                  
                  return (
                    <TableRow key={message.id} data-testid={`queue-message-${index}`}>
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {message.meta?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-muted-foreground font-mono">
                          {message.to}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-foreground max-w-xs truncate">
                          {message.text}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(message.status)}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {getStatusLabel(message.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(message.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {canOpenTab ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openTabMutation.mutate(message.id)}
                            disabled={openTabMutation.isPending}
                            data-testid={`button-open-tab-${index}`}
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Open Tab
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {message.status === 'opened_link' ? 'Tab opened' : 
                             message.status === 'sent_by_user' ? 'Sent' : 
                             message.status === 'failed' ? 'Failed' : 'Completed'}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {filteredMessages.length} of {messages.length} messages
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled data-testid="button-previous-page">
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled data-testid="button-next-page">
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
