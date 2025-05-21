import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { ExpenseWithCategory, DateFilter } from "@shared/schema";
import { formatDate } from "@/lib/date-utils";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { Eye, MoreVertical, Edit, Trash2, FileText } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogHeader, 
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ExpenseForm } from "./expense-form";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BulkExpenseUploadButton } from "./bulk-expense-upload";

type ExpenseTableProps = {
  dateFilter?: DateFilter;
  limit?: number;
  showViewAll?: boolean;
};

export function ExpenseTable({ dateFilter, limit, showViewAll = false }: ExpenseTableProps) {
  const { toast } = useToast();
  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithCategory | null>(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  
  const queryParams = dateFilter
    ? `?startDate=${dateFilter.startDate.toISOString()}&endDate=${dateFilter.endDate.toISOString()}`
    : '';
  
  const { data, isLoading, error } = useQuery<ExpenseWithCategory[]>({
    queryKey: [`/api/expenses${queryParams}`],
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
    },
    onSuccess: () => {
      toast({
        title: "Expense deleted",
        description: "The expense has been deleted successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      setShowDeleteAlert(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive"
      });
    }
  });
  
  const handleDelete = () => {
    if (selectedExpense) {
      deleteMutation.mutate(selectedExpense.id);
    }
  };
  
  const displayData = limit && data ? data.slice(0, limit) : data;
  
  if (isLoading) {
    return (
      <div className="w-full">
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }
  
  if (error || !data) {
    return (
      <div className="p-4 bg-destructive/10 rounded-lg">
        <p className="text-destructive">Failed to load expenses</p>
      </div>
    );
  }
  
  if (data.length === 0) {
    return (
      <div className="p-8 text-center border rounded-lg">
        <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-lg font-medium mb-1">No expenses found</h3>
        <p className="text-muted-foreground mb-3">No expenses have been recorded for the selected period.</p>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add Your First Expense</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <ExpenseForm onSuccess={() => queryClient.invalidateQueries({ queryKey: ['/api/expenses'] })} />
          </DialogContent>
        </Dialog>
      </div>
    );
  }
  
  return (
    <>
      <div className="rounded-lg overflow-hidden border">
        <div className="flex justify-between p-4 bg-muted">
          <h3 className="font-medium">
            {showViewAll ? "Recent Expenses" : "Expenses"}
          </h3>
          <div className="flex gap-2 items-center">
            {showViewAll && (
              <Button variant="link" size="sm" asChild>
                <a href="/expenses">View All</a>
              </Button>
            )}
            <BulkExpenseUploadButton />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData?.map((expense) => (
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
                  <TableCell>{expense.vendorName}</TableCell>
                  <TableCell>{expense.description?.substring(0, 30) || '-'}</TableCell>
                  <TableCell>{expense.paymentMethod}</TableCell>
                  <TableCell className="text-right font-mono">₹{expense.amount.toLocaleString('en-IN', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })}</TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setSelectedExpense(expense)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Expense Details</DialogTitle>
                        </DialogHeader>
                        {selectedExpense && (
                          <div className="space-y-4 py-2">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Date</p>
                                <p>{formatDate(selectedExpense.date)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Category</p>
                                <span 
                                  className="px-2 py-1 text-xs rounded" 
                                  style={{ 
                                    backgroundColor: `${selectedExpense.category.color}20`, 
                                    color: selectedExpense.category.color 
                                  }}
                                >
                                  {selectedExpense.category.name}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Material/Service</p>
                                <p>{selectedExpense.materialName}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Vendor</p>
                                <p>{selectedExpense.vendorName}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Payment Method</p>
                                <p>{selectedExpense.paymentMethod}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Amount</p>
                                <p className="font-mono font-medium text-lg">₹{selectedExpense.amount.toLocaleString('en-IN')}</p>
                              </div>
                            </div>
                            {selectedExpense.description && (
                              <div>
                                <p className="text-sm text-muted-foreground">Description</p>
                                <p>{selectedExpense.description}</p>
                              </div>
                            )}
                            {selectedExpense.receiptPath && (
                              <div>
                                <p className="text-sm text-muted-foreground">Receipt</p>
                                <a 
                                  href={selectedExpense.receiptPath} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  View Receipt
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setSelectedExpense(expense)}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <PermissionGuard permission="edit_all_expenses">
                          <Dialog open={showExpenseForm} onOpenChange={setShowExpenseForm}>
                            <DialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setSelectedExpense(expense);
                                  setShowExpenseForm(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              {selectedExpense && (
                                <ExpenseForm
                                  expenseId={selectedExpense.id}
                                  onSuccess={() => {
                                    setShowExpenseForm(false);
                                    queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
                                  }}
                                />
                              )}
                            </DialogContent>
                          </Dialog>
                        </PermissionGuard>
                        
                        <PermissionGuard permission="delete_all_expenses">
                          <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this expense? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={handleDelete}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </PermissionGuard>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
