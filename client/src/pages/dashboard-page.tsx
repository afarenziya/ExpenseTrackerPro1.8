import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { DateFilterComponent } from "@/components/filters/date-filter";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { ExpenseTrendChart } from "@/components/dashboard/expense-trend-chart";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { PaymentMethodChart } from "@/components/dashboard/payment-method-chart";
import { ExpenseTable } from "@/components/expenses/expense-table";
import { DateFilter } from "@shared/schema";
import { getDateFilter } from "@/lib/date-utils";

export default function DashboardPage() {
  const [dateFilter, setDateFilter] = useState<DateFilter>(
    getDateFilter("this_month")
  );

  const handleDateFilterChange = (filter: DateFilter) => {
    setDateFilter(filter);
  };

  return (
    <Layout 
      title="Dashboard" 
      subtitle="Overview of your company's expenses"
    >
      {/* Date Filter */}
      <DateFilterComponent onFilterChange={handleDateFilterChange} />
      
      {/* Summary Cards */}
      <SummaryCards dateFilter={dateFilter} />
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <ExpenseTrendChart />
        <CategoryChart dateFilter={dateFilter} />
      </div>
      
      {/* Payment Method Distribution */}
      <PaymentMethodChart dateFilter={dateFilter} />
      
      {/* Recent Expenses */}
      <div className="mb-6">
        <ExpenseTable dateFilter={dateFilter} limit={5} showViewAll={true} />
      </div>
    </Layout>
  );
}
