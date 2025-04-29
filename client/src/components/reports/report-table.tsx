import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExpenseWithCategory, Category, DateFilter } from "@shared/schema";
import { formatDate } from "@/lib/date-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";

type ReportTableProps = {
  dateFilter: DateFilter;
  categoryId?: number;
  paymentMethod?: string;
};

export function ReportTable({ dateFilter, categoryId, paymentMethod }: ReportTableProps) {
  const queryParams = `?startDate=${dateFilter.startDate.toISOString()}&endDate=${dateFilter.endDate.toISOString()}`;
  
  const { data: expenses, isLoading, error } = useQuery<ExpenseWithCategory[]>({
    queryKey: [`/api/expenses${queryParams}`],
  });

  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    
    return expenses.filter(expense => {
      // Filter by category if specified
      if (categoryId !== undefined && expense.categoryId !== categoryId) {
        return false;
      }
      
      // Filter by payment method if specified
      if (paymentMethod !== undefined && expense.paymentMethod !== paymentMethod) {
        return false;
      }
      
      return true;
    });
  }, [expenses, categoryId, paymentMethod]);

  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [filteredExpenses]);

  const categoryTotals = useMemo(() => {
    const totals = new Map<number, { name: string; color: string; amount: number }>();
    
    filteredExpenses.forEach(expense => {
      const categoryId = expense.categoryId;
      const existing = totals.get(categoryId) || { 
        name: expense.category.name, 
        color: expense.category.color, 
        amount: 0 
      };
      
      existing.amount += expense.amount;
      totals.set(categoryId, existing);
    });
    
    return Array.from(totals.values()).sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses]);

  const paymentMethodTotals = useMemo(() => {
    const totals = new Map<string, { count: number; amount: number }>();
    
    filteredExpenses.forEach(expense => {
      const method = expense.paymentMethod;
      const existing = totals.get(method) || { count: 0, amount: 0 };
      
      existing.count += 1;
      existing.amount += expense.amount;
      totals.set(method, existing);
    });
    
    return Array.from(totals.entries())
      .map(([method, data]) => ({ method, ...data }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses]);

  if (isLoading) {
    return (
      <Skeleton className="h-[600px] w-full" />
    );
  }

  if (error || !expenses) {
    return (
      <div className="p-4 bg-destructive/10 rounded-lg">
        <p className="text-destructive">Failed to load expense data</p>
      </div>
    );
  }

  if (filteredExpenses.length === 0) {
    return (
      <div className="p-8 text-center border rounded-lg">
        <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-lg font-medium mb-1">No expenses found</h3>
        <p className="text-muted-foreground mb-3">No expenses match your current filter criteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-mono">₹{totalAmount.toLocaleString('en-IN', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            })}</p>
            <p className="text-muted-foreground text-sm mt-1">
              {filteredExpenses.length} expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {categoryTotals.slice(0, 3).map((category, index) => (
                <li key={index} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: category.color }}
                    />
                    <span>{category.name}</span>
                  </div>
                  <span className="font-mono">₹{category.amount.toLocaleString('en-IN', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {paymentMethodTotals.slice(0, 3).map((payment, index) => (
                <li key={index} className="flex justify-between items-center">
                  <span>{payment.method}</span>
                  <div className="text-right">
                    <span className="font-mono block">₹{payment.amount.toLocaleString('en-IN', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })}</span>
                    <span className="text-xs text-muted-foreground">{payment.count} transactions</span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Expense Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Material/Service</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{formatDate(expense.date)}</TableCell>
                    <TableCell>
                      <span 
                        className="px-2 py-1 text-xs rounded" 
                        style={{ 
                          backgroundColor: `${expense.category.color}20`, 
                          color: expense.category.color 
                        }}
                      >
                        {expense.category.name}
                      </span>
                    </TableCell>
                    <TableCell>{expense.materialName}</TableCell>
                    <TableCell>{expense.vendorName}</TableCell>
                    <TableCell>{expense.paymentMethod}</TableCell>
                    <TableCell className="text-right font-mono">₹{expense.amount.toLocaleString('en-IN', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={5} className="text-right font-medium">Total</TableCell>
                  <TableCell className="text-right font-mono font-bold">₹{totalAmount.toLocaleString('en-IN', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
