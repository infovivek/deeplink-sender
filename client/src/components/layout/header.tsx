import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import type { Instance } from '@shared/schema';

export default function Header() {
  const { user, logout } = useAuth();

  const { data: instances } = useQuery<Instance[]>({
    queryKey: ['/api/instances'],
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4" data-testid="header">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your WhatsApp marketing campaigns</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Instance Selector */}
          {instances && instances.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-foreground">Instance:</label>
              <Select defaultValue={instances[0]?.id} data-testid="select-instance">
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select instance" />
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
          )}
          
          {/* User Menu */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary-foreground" data-testid="text-user-initials">
                {user ? getInitials(user.name) : 'U'}
              </span>
            </div>
            <span className="text-sm font-medium text-foreground" data-testid="text-user-name">
              {user?.name || 'User'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
