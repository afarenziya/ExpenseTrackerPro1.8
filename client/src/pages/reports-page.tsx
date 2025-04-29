import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { ReportFilters } from "@/components/reports/report-filters";
import { ReportTable } from "@/components/reports/report-table";
import { DateFilter } from "@shared/schema";
import { getDateFilter } from "@/lib/date-utils";

type FilterValues = {
  dateFilter: DateFilter;
  categoryId?: number;
  paymentMethod?: string;
};

export default function ReportsPage() {
  const [filters, setFilters] = useState<FilterValues>({
    dateFilter: getDateFilter("this_month"),
  });

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
  };

  return (
    <Layout 
      title="Reports" 
      subtitle="Generate detailed expense reports with various filters"
    >
      <ReportFilters onFilterChange={handleFilterChange} />
      <ReportTable 
        dateFilter={filters.dateFilter}
        categoryId={filters.categoryId}
        paymentMethod={filters.paymentMethod}
      />
    </Layout>
  );
}
