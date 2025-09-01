import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, TrendingUp, Users, CreditCard } from 'lucide-react';

interface StatsCardsProps {
  stats?: {
    messagesSent: number;
    deliveryRate: number;
    creditsUsed: number;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const data = stats || {
    messagesSent: 0,
    deliveryRate: 0,
    creditsUsed: 0,
  };

  const cards = [
    {
      title: 'Messages Sent (7d)',
      value: data.messagesSent.toLocaleString(),
      icon: CheckCircle,
      iconColor: 'text-primary',
      iconBg: 'bg-primary/10',
      change: '+12.5%',
      changeType: 'positive' as const,
    },
    {
      title: 'Delivery Rate',
      value: `${data.deliveryRate.toFixed(1)}%`,
      icon: TrendingUp,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100',
      change: '+2.1%',
      changeType: 'positive' as const,
    },
    {
      title: 'Active Contacts',
      value: '3,894',
      icon: Users,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      change: '+234',
      changeType: 'positive' as const,
    },
    {
      title: 'Credits Used (7d)',
      value: data.creditsUsed.toLocaleString(),
      icon: CreditCard,
      iconColor: 'text-orange-600',
      iconBg: 'bg-orange-100',
      change: '-8.3%',
      changeType: 'negative' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} data-testid={`stat-card-${index}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <p className="text-3xl font-bold text-foreground" data-testid={`stat-value-${index}`}>
                    {card.value}
                  </p>
                </div>
                <div className={`w-12 h-12 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <span className={`text-sm font-medium ${
                  card.changeType === 'positive' ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {card.change}
                </span>
                <span className="text-sm text-muted-foreground">from last week</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
