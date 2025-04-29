import { useState } from "react";
import { Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

type HeaderProps = {
  title: string;
  subtitle?: string;
};

export function Header({ title, subtitle }: HeaderProps) {
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  
  return (
    <header className="mb-6 flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      </div>
      
      <div className="flex space-x-3">
        <Dialog open={isExpenseFormOpen} onOpenChange={setIsExpenseFormOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Expense</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <ExpenseForm onSuccess={() => setIsExpenseFormOpen(false)} />
          </DialogContent>
        </Dialog>
        
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-destructive rounded-full"></span>
        </Button>
      </div>
    </header>
  );
}
