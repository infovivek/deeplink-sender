import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Inbox as InboxIcon, Search, MessageCircle, Phone } from 'lucide-react';
import type { Instance } from '@shared/schema';

export default function Inbox() {
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: instances = [] } = useQuery<Instance[]>({
    queryKey: ['/api/instances'],
  });

  // Note: In a real implementation, this would fetch webhook responses or incoming messages
  const mockConversations = [
    {
      id: '1',
      phone: '+1234567890',
      name: 'John Doe',
      lastMessage: 'Thanks for the discount code!',
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      unread: true,
      status: 'replied'
    },
    {
      id: '2',
      phone: '+1987654321',
      name: 'Jane Smith',
      lastMessage: 'When is the next sale?',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      unread: true,
      status: 'replied'
    },
    {
      id: '3',
      phone: '+1555666777',
      name: 'Mike Johnson',
      lastMessage: 'Message delivered',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      unread: false,
      status: 'delivered'
    }
  ];

  const filteredConversations = mockConversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.phone.includes(searchQuery) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6" data-testid="inbox-page">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Inbox</h1>
        <p className="text-muted-foreground">View and manage incoming messages and responses</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="search">Search Conversations</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, phone, or message..."
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {!selectedInstanceId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <InboxIcon className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No instance selected</h3>
            <p className="text-muted-foreground text-center">
              Please select an instance to view incoming messages
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <Card className="lg:col-span-1" data-testid="conversations-list">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Conversations ({filteredConversations.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <MessageCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? "No conversations match your search" : "No conversations yet"}
                  </p>
                </div>
              ) : (
                <div className="space-y-0">
                  {filteredConversations.map((conversation, index) => (
                    <div key={conversation.id}>
                      <div 
                        className="p-4 hover:bg-accent cursor-pointer transition-colors"
                        data-testid={`conversation-${index}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <Phone className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium text-foreground">{conversation.name}</h4>
                              <p className="text-sm text-muted-foreground font-mono">
                                {conversation.phone}
                              </p>
                            </div>
                          </div>
                          {conversation.unread && (
                            <Badge variant="destructive" className="text-xs">New</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {conversation.lastMessage}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            {conversation.timestamp.toLocaleTimeString()}
                          </span>
                          <Badge 
                            variant={conversation.status === 'replied' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {conversation.status}
                          </Badge>
                        </div>
                      </div>
                      {index < filteredConversations.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conversation Detail */}
          <Card className="lg:col-span-2" data-testid="conversation-detail">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Conversation Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12">
                <MessageCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Select a conversation</h3>
                <p className="text-muted-foreground text-center">
                  Choose a conversation from the list to view message details
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Feature Notice */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <InboxIcon className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <h4 className="font-medium text-foreground mb-1">Webhook Integration</h4>
              <p className="text-sm text-muted-foreground">
                To receive incoming messages, configure your instance webhook URL to receive WhatsApp webhook events. 
                This feature requires a webhook endpoint to capture incoming message data.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
