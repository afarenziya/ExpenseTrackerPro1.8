import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DateFilter, ExpenseSummary } from "@shared/schema";
import { Wallet, Tags, CreditCard, Receipt } from "lucide-react";

type SummaryCardsProps = {
  dateFilter?: DateFilter;
};

export function SummaryCards({ dateFilter }: SummaryCardsProps) {
  const queryParams = dateFilter
    ? `?startDate=${dateFilter.startDate.toISOString()}&endDate=${dateFilter.endDate.toISOString()}`
    : '';
  
  const { data, isLoading, error } = useQuery<ExpenseSummary>({
    queryKey: [`/api/dashboard/summary${queryParams}`],
  });
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6 pb-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (error || !data) {
    return (
      <div className="bg-destructive/10 p-4 rounded-lg mb-6">
        <p className="text-destructive">Failed to load summary data</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Expenses Card */}
      <Card>
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">Total Expenses</p>
            <h3 className="text-2xl font-medium font-mono">₹{data.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</h3>
          </div>
          <div className="h-12 w-12 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center">
            <Wallet className="text-primary" />
          </div>
        </CardContent>
      </Card>
      
      {/* Highest Category Card */}
      <Card>
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">Highest Category</p>
            <h3 className="text-xl font-medium">{data.highestCategory?.name || 'No data'}</h3>
            {data.highestCategory && (
              <p className="text-xs font-mono mt-1">
                ₹{data.highestCategory.amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ({data.highestCategory.percentage}%)
              </p>
            )}
          </div>
          <div className="h-12 w-12 bg-green-500 bg-opacity-20 rounded-full flex items-center justify-center">
            <Tags className="text-green-500" />
          </div>
        </CardContent>
      </Card>
      
      {/* Most Used Payment Card */}
      <Card>
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">Most Used Payment</p>
            <h3 className="text-xl font-medium">{data.mostUsedPaymentMethod?.method || 'No data'}</h3>
            {data.mostUsedPaymentMethod && (
              <p className="text-xs font-mono mt-1">
                {data.mostUsedPaymentMethod.count} transactions
              </p>
            )}
          </div>
          <div className="h-12 w-12 bg-yellow-500 bg-opacity-20 rounded-full flex items-center justify-center">
            <CreditCard className="text-yellow-500" />
          </div>
        </CardContent>
      </Card>
      
      {/* Pending Receipts Card */}
      <Card>
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">Pending Receipts</p>
            <h3 className="text-xl font-medium">{data.pendingReceipts} Expenses</h3>
            {data.pendingReceipts > 0 && (
              <p className="text-xs text-destructive flex items-center mt-1">
                Action required
              </p>
            )}
          </div>
          <div className="h-12 w-12 bg-red-500 bg-opacity-20 rounded-full flex items-center justify-center">
            <Receipt className="text-destructive" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
