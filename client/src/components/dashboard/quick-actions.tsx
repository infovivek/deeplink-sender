import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Upload, CreditCard } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
interface CreditPack {
  id: string;
  name: string;
  credits: number;
  amount: number;
  popular?: boolean;
}

export default function QuickActions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: creditPacks = [] } = useQuery<CreditPack[]>({
    queryKey: ['/api/billing/packs'],
  });

  const createOrderMutation = useMutation({
    mutationFn: async (packId: string) => {
      const res = await apiRequest('POST', '/api/billing/razorpay/order', { packId });
      return res.json();
    },
    onSuccess: (data) => {
      // In a real app, this would open Razorpay checkout
      toast({
        title: "Order created",
        description: `Order for ${data.pack.credits} credits created. Total: ₹${data.amount}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create order",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const handleBuyCredits = (packId: string) => {
    createOrderMutation.mutate(packId);
  };

  const quickActions = [
    {
      title: 'New Campaign',
      description: 'Create broadcast message',
      icon: Plus,
      color: 'bg-primary/10 text-primary',
      action: () => toast({ title: "Coming soon", description: "Campaign builder will be available soon" }),
    },
    {
      title: 'Import Contacts',
      description: 'Upload CSV file',
      icon: Upload,
      color: 'bg-green-100 text-green-600',
      action: () => toast({ title: "Coming soon", description: "Contact import will be available soon" }),
    },
    {
      title: 'Buy Credits',
      description: 'Add to your balance',
      icon: CreditCard,
      color: 'bg-orange-100 text-orange-600',
      action: () => toast({ title: "See credit packages below" }),
    },
  ];

  return (
    <Card data-testid="quick-actions">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start h-auto p-4"
                onClick={action.action}
                data-testid={`quick-action-${index}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-foreground">{action.title}</h4>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>

        {/* Credit Packages */}
        <div className="mt-6 pt-6 border-t border-border">
          <h4 className="font-medium text-foreground mb-3">Credit Packages</h4>
          <div className="space-y-2">
            {creditPacks.slice(0, 3).map((pack) => (
              <div
                key={pack.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg"
                data-testid={`credit-pack-${pack.id}`}
              >
                <div>
                  <p className="font-medium text-foreground">{pack.name}</p>
                  <p className="text-sm text-muted-foreground">{pack.credits.toLocaleString()} credits</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleBuyCredits(pack.id)}
                  disabled={createOrderMutation.isPending}
                  data-testid={`button-buy-${pack.id}`}
                >
                  ₹{pack.amount}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
