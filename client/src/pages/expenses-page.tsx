import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { DateFilterComponent } from "@/components/filters/date-filter";
import { ExpenseTable } from "@/components/expenses/expense-table";
import { DateFilter } from "@shared/schema";
import { getDateFilter } from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExpenseForm } from "@/components/expenses/expense-form";

export default function ExpensesPage() {
  const [dateFilter, setDateFilter] = useState<DateFilter>(
    getDateFilter("this_month")
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDateFilterChange = (filter: DateFilter) => {
    setDateFilter(filter);
  };

  const handleAddExpense = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <Layout
      title="Expenses"
      subtitle="Manage and track all your company expenses"
    >
      {/* Add New Expense Button */}
      <Button onClick={handleAddExpense} className="mb-4">
        Add New Expense
      </Button>

      {/* Add Expense Dialog */}
      {isModalOpen && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
            </DialogHeader>
            <ExpenseForm onSuccess={handleCloseModal} />
          </DialogContent>
        </Dialog>
      )}

      {/* Date Filter */}
      <DateFilterComponent onFilterChange={handleDateFilterChange} />

      {/* Expenses Table */}
      <ExpenseTable dateFilter={dateFilter} />
    </Layout>
  );
}
