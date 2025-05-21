import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MonthlyExpense } from "@shared/schema";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function ExpenseTrendChart() {
  const [chartData, setChartData] = useState<any[]>([]);
  
  const { data, isLoading, error } = useQuery<MonthlyExpense[]>({
    queryKey: ['/api/dashboard/monthly-trend'],
  });
  
  useEffect(() => {
    if (data) {
      // Transform the data for the chart
      const transformedData = data.map(item => ({
        month: item.month,
        currentYear: item.amount,
        previousYear: Math.random() * item.amount * 0.9, // Simulated previous year data
      }));
      
      setChartData(transformedData);
    }
  }, [data]);
  
  if (isLoading) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Monthly Expense Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }
  
  if (error || !data) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Monthly Expense Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-lg">
            <p className="text-destructive">Failed to load chart data</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Monthly Expense Trend</CardTitle>
        <div className="flex items-center space-x-2 text-sm">
          <span className="flex items-center">
            <span className="w-3 h-3 bg-primary rounded-full inline-block mr-1"></span>
            <span className="text-muted-foreground">2025</span>
          </span>
          <span className="flex items-center">
            <span className="w-3 h-3 bg-muted-foreground rounded-full inline-block mr-1"></span>
            <span className="text-muted-foreground">2024</span>
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }} 
                tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <YAxis 
                tickFormatter={(value) => `₹${value/1000}k`}
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <Tooltip 
                formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']}
                contentStyle={{ 
                  backgroundColor: 'rgba(30, 30, 30, 0.9)',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="currentYear" 
                name="2023"
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line 
                type="monotone" 
                dataKey="previousYear"
                name="2022" 
                stroke="hsl(var(--muted-foreground))" 
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
