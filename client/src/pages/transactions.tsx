import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { CreditCard, Plus, Star, Check } from 'lucide-react';

interface CreditPack {
  id: string;
  name: string;
  credits: number;
  amount: number;
  popular?: boolean;
}

interface Transaction {
  id: string;
  orderId: string;
  amount: number;
  status: string;
  credits: number;
  createdAt: string;
}

export default function Transactions() {
  const [isPackageDialogOpen, setIsPackageDialogOpen] = useState(false);
  const { toast } = useToast();
  const { credits } = useAuth();
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
  });

  const { data: creditPacks = [] } = useQuery<CreditPack[]>({
    queryKey: ['/api/billing/packs'],
  });

  const createOrderMutation = useMutation({
    mutationFn: async (packId: string) => {
      const res = await apiRequest('POST', '/api/billing/razorpay/order', { packId });
      return res.json();
    },
    onSuccess: (data) => {
      // In a real app, this would integrate with Razorpay checkout
      toast({
        title: "Order created",
        description: `Order for ${data.pack.credits.toLocaleString()} credits created. Total: ₹${data.amount}`,
      });
      setIsPackageDialogOpen(false);
      
      // Simulate successful payment for demo purposes
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
        queryClient.invalidateQueries({ queryKey: ['/api/me'] });
        toast({
          title: "Payment successful!",
          description: `${data.pack.credits.toLocaleString()} credits have been added to your account.`,
        });
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: "Failed to create order",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'captured':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'captured':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      case 'refunded':
        return 'Refunded';
      default:
        return status;
    }
  };

  const handleBuyCredits = (packId: string) => {
    createOrderMutation.mutate(packId);
  };

  return (
    <div className="space-y-6" data-testid="transactions-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
          <p className="text-muted-foreground">Manage your credit purchases and transaction history</p>
        </div>
        <Dialog open={isPackageDialogOpen} onOpenChange={setIsPackageDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-buy-credits">
              <Plus className="w-4 h-4 mr-2" />
              Buy Credits
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Choose Credit Package</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 mt-4">
              {creditPacks.map((pack) => (
                <div 
                  key={pack.id} 
                  className="relative p-6 border border-border rounded-lg hover:border-primary transition-colors"
                  data-testid={`credit-pack-${pack.id}`}
                >
                  {pack.popular && (
                    <Badge className="absolute -top-2 left-4 bg-primary">
                      <Star className="w-3 h-3 mr-1" />
                      Popular
                    </Badge>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{pack.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {pack.credits.toLocaleString()} credits
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ₹{(pack.amount / pack.credits).toFixed(2)} per credit
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground">₹{pack.amount}</div>
                      <Button 
                        onClick={() => handleBuyCredits(pack.id)}
                        disabled={createOrderMutation.isPending}
                        data-testid={`button-buy-${pack.id}`}
                      >
                        {createOrderMutation.isPending ? "Processing..." : "Buy Now"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Balance */}
      <Card data-testid="current-balance">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Current Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-foreground" data-testid="text-current-credits">
                {credits.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Available credits</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">1 credit = 1 message</p>
              <Button 
                variant="outline" 
                onClick={() => setIsPackageDialogOpen(true)}
                data-testid="button-add-credits"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Credits
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card data-testid="transaction-history">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No transactions yet</h3>
              <p className="text-muted-foreground mb-4">
                Your credit purchase history will appear here
              </p>
              <Button onClick={() => setIsPackageDialogOpen(true)} data-testid="button-first-purchase">
                <Plus className="w-4 h-4 mr-2" />
                Make Your First Purchase
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Credits Added</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction, index: number) => (
                  <TableRow key={transaction.id} data-testid={`transaction-row-${index}`}>
                    <TableCell className="font-mono text-sm">
                      {transaction.orderId}
                    </TableCell>
                    <TableCell className="font-semibold">
                      ₹{parseFloat(transaction.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Plus className="w-3 h-3 text-green-600" />
                        {transaction.creditsAdded.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(transaction.status)}>
                        {transaction.status === 'captured' && <Check className="w-3 h-3 mr-1" />}
                        {getStatusLabel(transaction.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {transaction.paymentId || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(transaction.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pricing Information */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Credit Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>1 credit = 1 WhatsApp message</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Credits never expire</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Unused credits are refundable</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              All payments are processed securely through Razorpay. Credits are added instantly upon successful payment.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
