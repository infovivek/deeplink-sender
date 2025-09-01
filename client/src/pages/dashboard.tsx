import { useQuery } from '@tanstack/react-query';
import StatsCards from '@/components/dashboard/stats-cards';
import Charts from '@/components/dashboard/charts';
import RecentCampaigns from '@/components/dashboard/recent-campaigns';
import QuickActions from '@/components/dashboard/quick-actions';
import CampaignBuilder from '@/components/campaign/campaign-builder';
import QueueTable from '@/components/queue/queue-table';
import type { Instance } from '@shared/schema';

export default function Dashboard() {
  const { data: instances } = useQuery<Instance[]>({
    queryKey: ['/api/instances'],
  });

  const currentInstanceId = instances?.[0]?.id;

  const { data: stats } = useQuery<{ messagesSent: number; deliveryRate: number; creditsUsed: number }>({
    queryKey: ['/api/analytics/stats'],
    enabled: !!currentInstanceId,
  });

  return (
    <div className="space-y-6" data-testid="dashboard">
      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Charts Section */}
      <Charts instanceId={currentInstanceId} />

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentCampaigns instanceId={currentInstanceId} />
        </div>
        <QuickActions />
      </div>

      {/* Campaign Builder Preview */}
      <CampaignBuilder />

      {/* Message Queue Interface */}
      <QueueTable instanceId={currentInstanceId} />
    </div>
  );
}
