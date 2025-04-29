import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentMethodDistribution, DateFilter } from "@shared/schema";
import { CreditCard, Smartphone, Building, Banknote, FileText } from "lucide-react";

type PaymentMethodChartProps = {
  dateFilter?: DateFilter;
};

export function PaymentMethodChart({ dateFilter }: PaymentMethodChartProps) {
  const queryParams = dateFilter
    ? `?startDate=${dateFilter.startDate.toISOString()}&endDate=${dateFilter.endDate.toISOString()}`
    : '';
  
  const { data, isLoading, error } = useQuery<PaymentMethodDistribution[]>({
    queryKey: [`/api/dashboard/payment-distribution${queryParams}`],
  });
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Method Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  if (error || !data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Method Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <p className="text-muted-foreground">No payment method data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Icon mapping for payment methods
  const getPaymentIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'card':
      case 'credit card':
        return <CreditCard className="text-yellow-500" />;
      case 'upi':
        return <Smartphone className="text-green-500" />;
      case 'bank transfer':
        return <Building className="text-primary" />;
      case 'cash':
        return <Banknote className="text-destructive" />;
      case 'cheque':
        return <FileText className="text-purple-500" />;
      default:
        return <CreditCard className="text-muted-foreground" />;
    }
  };
  
  // Get background color for payment method
  const getPaymentColor = (method: string) => {
    switch (method.toLowerCase()) {
      case 'card':
      case 'credit card':
        return 'bg-yellow-500 bg-opacity-20';
      case 'upi':
        return 'bg-green-500 bg-opacity-20';
      case 'bank transfer':
        return 'bg-blue-500 bg-opacity-20';
      case 'cash':
        return 'bg-red-500 bg-opacity-20';
      case 'cheque':
        return 'bg-purple-500 bg-opacity-20';
      default:
        return 'bg-gray-500 bg-opacity-20';
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Payment Method Distribution</CardTitle>
        <Tabs defaultValue="amount">
          <TabsList className="text-sm">
            <TabsTrigger value="amount">Amount</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {data.map((method) => (
            <div key={method.method} className="bg-muted rounded-lg p-4 flex flex-col items-center justify-center">
              <div className={`h-12 w-12 rounded-full ${getPaymentColor(method.method)} flex items-center justify-center mb-2`}>
                {getPaymentIcon(method.method)}
              </div>
              <h4 className="font-medium text-center">{method.method}</h4>
              <p className="text-muted-foreground text-sm">{method.count} transactions</p>
              <p className="text-xl font-mono mt-2">₹{method.amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
              <div className="w-full bg-background rounded-full h-1.5 mt-2">
                <div 
                  className="bg-primary h-1.5 rounded-full" 
                  style={{ width: `${method.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
