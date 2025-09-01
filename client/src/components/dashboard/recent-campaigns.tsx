import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { Campaign } from '@shared/schema';

interface RecentCampaignsProps {
  instanceId?: string;
}

export default function RecentCampaigns({ instanceId }: RecentCampaignsProps) {
  const { data: campaigns = [] } = useQuery<Campaign[]>({
    queryKey: ['/api/campaigns', { instanceId }],
    enabled: !!instanceId,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'sending':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return MessageSquare;
      case 'sending':
        return MessageSquare;
      case 'scheduled':
        return Clock;
      default:
        return MessageSquare;
    }
  };

  return (
    <Card data-testid="recent-campaigns">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Recent Campaigns</CardTitle>
          <Button variant="ghost" size="sm" data-testid="button-view-all-campaigns">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {campaigns.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No campaigns yet</h3>
              <p className="text-muted-foreground mb-4">Create your first campaign to start sending messages</p>
              <Button data-testid="button-create-first-campaign">Create Campaign</Button>
            </div>
          ) : (
            campaigns.slice(0, 3).map((campaign, index: number) => {
              const StatusIcon = getStatusIcon(campaign.status);
              return (
                <div
                  key={campaign.id || index}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                  data-testid={`campaign-item-${index}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <StatusIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{campaign.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(campaign.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
