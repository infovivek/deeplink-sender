import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Building2,
  MessageSquare,
  Users,
  FileText,
  Inbox,
  CreditCard,
  List,
  FileCode,
  User,
  Plus
} from 'lucide-react';

interface CreditPack {
  id: string;
  name: string;
  credits: number;
  amount: number;
  popular?: boolean;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Instances', href: '/instances', icon: Building2 },
  { name: 'Broadcast', href: '/broadcast', icon: MessageSquare },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Delivery Report', href: '/delivery-report', icon: FileText },
  { name: 'Inbox', href: '/inbox', icon: Inbox },
  { name: 'Transactions', href: '/transactions', icon: CreditCard },
  { name: 'Message Queue', href: '/message-queue', icon: List },
  { name: 'API Docs', href: '/api-docs', icon: FileCode },
  { name: 'Profile', href: '/profile', icon: User },
];

const creditPacks = [
  { name: 'Starter', credits: '500', price: '₹199' },
  { name: 'Pro', credits: '2,000', price: '₹699' },
  { name: 'Business', credits: '5,000', price: '₹1,499' },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user, credits } = useAuth();

  const { data: creditPacksData } = useQuery<CreditPack[]>({
    queryKey: ['/api/billing/packs'],
  });

  const packs = creditPacksData || creditPacks;

  return (
    <aside className="w-64 bg-card border-r border-border flex-shrink-0" data-testid="sidebar">
      <div className="flex flex-col h-full">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3 p-6 border-b border-border">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.690"/>
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">LinkSender</h1>
            <p className="text-xs text-muted-foreground">WhatsApp Marketing</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link key={item.href} href={item.href}>
                <a className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )} data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}>
                  <Icon className="w-5 h-5" />
                  {item.name}
                </a>
              </Link>
            );
          })}
        </nav>

        {/* Credits Display */}
        <div className="p-4 border-t border-border">
          <div className="bg-secondary rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-secondary-foreground">Available Credits</span>
              <Link href="/transactions">
                <a className="text-xs text-primary hover:text-primary/80" data-testid="link-buy-credits">
                  Buy More
                </a>
              </Link>
            </div>
            <div className="text-2xl font-bold text-secondary-foreground" data-testid="text-credits-balance">
              {credits.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>

          {/* Credit Packages */}
          <div className="mt-4">
            <h4 className="font-medium text-foreground mb-3 text-sm">Credit Packages</h4>
            <div className="space-y-2">
              {packs.slice(0, 3).map((pack) => (
                <div key={pack.id || pack.name} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground text-sm">{pack.name}</p>
                    <p className="text-xs text-muted-foreground">{pack.credits} credits</p>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs" data-testid={`button-buy-${pack.name.toLowerCase()}`}>
                    {pack.price || `₹${pack.amount}`}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
