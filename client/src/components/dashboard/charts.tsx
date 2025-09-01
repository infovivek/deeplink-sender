import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3 } from 'lucide-react';

interface ChartsProps {
  instanceId?: string;
}

export default function Charts({ instanceId }: ChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Message Activity Chart */}
      <Card data-testid="chart-message-activity">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Message Activity</CardTitle>
            <Select defaultValue="7days">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Chart visualization with Recharts</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Status Distribution */}
      <Card data-testid="chart-delivery-status">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Delivery Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Delivered</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold" data-testid="status-delivered-count">1,175</span>
                <span className="text-xs text-muted-foreground ml-2">94.2%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium">Pending</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold" data-testid="status-pending-count">42</span>
                <span className="text-xs text-muted-foreground ml-2">3.4%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium">Failed</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold" data-testid="status-failed-count">30</span>
                <span className="text-xs text-muted-foreground ml-2">2.4%</span>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '94.2%' }}></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
