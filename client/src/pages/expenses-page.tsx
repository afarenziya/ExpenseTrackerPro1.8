import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { DateFilterComponent } from "@/components/filters/date-filter";
import { ExpenseTable } from "@/components/expenses/expense-table";
import { DateFilter } from "@shared/schema";
import { getDateFilter } from "@/lib/date-utils";

export default function ExpensesPage() {
  const [dateFilter, setDateFilter] = useState<DateFilter>(
    getDateFilter("this_month")
  );

  const handleDateFilterChange = (filter: DateFilter) => {
    setDateFilter(filter);
  };
  
  return (
    <Layout
      title="Expenses"
      subtitle="Manage and track all your company expenses"
    >
      {/* Date Filter */}
      <DateFilterComponent onFilterChange={handleDateFilterChange} />
      
      {/* Expenses Table */}
      <ExpenseTable dateFilter={dateFilter} />
    </Layout>
  );
}
