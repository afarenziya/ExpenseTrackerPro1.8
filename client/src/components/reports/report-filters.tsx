import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Category, DateFilter } from "@shared/schema";
import { DateFilterComponent } from "@/components/filters/date-filter";
import { DateRangeOption, getDateFilter } from "@/lib/date-utils";
import { downloadPdf, downloadExcel } from "@/lib/export-utils";
import { 
  FileDown, 
  FileText,
  FileSpreadsheet
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

type FilterValues = {
  dateFilter: DateFilter;
  categoryId?: number;
  paymentMethod?: string;
};

type ReportFiltersProps = {
  onFilterChange: (filters: FilterValues) => void;
};

export function ReportFilters({ onFilterChange }: ReportFiltersProps) {
  const { toast } = useToast();
  
  const [dateFilter, setDateFilter] = useState<DateFilter>(
    getDateFilter("this_month")
  );
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = useState<string | undefined>(undefined);

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  useEffect(() => {
    onFilterChange({
      dateFilter,
      categoryId,
      paymentMethod,
    });
  }, [dateFilter, categoryId, paymentMethod]);

  const handleDateFilterChange = (filter: DateFilter) => {
    setDateFilter(filter);
  };

  const handleCategoryChange = (value: string) => {
    if (value === "all") {
      setCategoryId(undefined);
    } else {
      setCategoryId(parseInt(value));
    }
  };

  const handlePaymentMethodChange = (value: string) => {
    if (value === "all") {
      setPaymentMethod(undefined);
    } else {
      setPaymentMethod(value);
    }
  };

  const handleExportPdf = async () => {
    try {
      await downloadPdf(dateFilter);
      toast({
        title: "Export successful",
        description: "Your PDF report has been downloaded",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error generating your PDF report",
        variant: "destructive",
      });
    }
  };

  const handleExportExcel = async () => {
    try {
      await downloadExcel(dateFilter);
      toast({
        title: "Export successful",
        description: "Your Excel report has been downloaded",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error generating your Excel report",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Date Range</h3>
            <DateFilterComponent onFilterChange={handleDateFilterChange} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="category-filter">Category</Label>
              <Select
                onValueChange={handleCategoryChange}
                defaultValue="all"
              >
                <SelectTrigger id="category-filter" className="mt-1">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="payment-filter">Payment Method</Label>
              <Select
                onValueChange={handlePaymentMethodChange}
                defaultValue="all"
              >
                <SelectTrigger id="payment-filter" className="mt-1">
                  <SelectValue placeholder="All Payment Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payment Methods</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Export</Label>
              <div className="flex space-x-2 mt-1">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleExportPdf}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleExportExcel}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
