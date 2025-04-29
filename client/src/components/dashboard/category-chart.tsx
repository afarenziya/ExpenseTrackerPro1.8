import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryDistribution, DateFilter } from "@shared/schema";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

type CategoryChartProps = {
  dateFilter?: DateFilter;
};

export function CategoryChart({ dateFilter }: CategoryChartProps) {
  const queryParams = dateFilter
    ? `?startDate=${dateFilter.startDate.toISOString()}&endDate=${dateFilter.endDate.toISOString()}`
    : '';
  
  const { data, isLoading, error } = useQuery<CategoryDistribution[]>({
    queryKey: [`/api/dashboard/category-distribution${queryParams}`],
  });
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Expense Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }
  
  if (error || !data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Expense Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center">
            <p className="text-muted-foreground">No category data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Expense Categories</CardTitle>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="amount"
                nameKey="categoryName"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']}
                contentStyle={{ 
                  backgroundColor: 'rgba(30, 30, 30, 0.9)',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 space-y-2">
          {data.map((category) => (
            <div key={category.categoryId} className="flex items-center justify-between">
              <div className="flex items-center">
                <span 
                  className="w-3 h-3 rounded-full inline-block mr-2" 
                  style={{ backgroundColor: category.color }}
                ></span>
                <span className="text-sm">{category.categoryName}</span>
              </div>
              <span className="text-sm font-mono">{category.percentage}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
