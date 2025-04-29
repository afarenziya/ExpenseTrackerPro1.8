import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateFilter } from "@shared/schema";
import { DateRangeOption, getDateFilter, formatDateForInput, getDateRangeLabel } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

type DateFilterProps = {
  onFilterChange: (filter: DateFilter) => void;
  initialOption?: DateRangeOption;
};

export function DateFilterComponent({ onFilterChange, initialOption = "this_month" }: DateFilterProps) {
  const [selectedOption, setSelectedOption] = useState<DateRangeOption>(initialOption);
  const [customRange, setCustomRange] = useState<{ start: Date; end: Date }>({
    start: new Date(),
    end: new Date(),
  });

  // Load initial filter
  useEffect(() => {
    const filter = getDateFilter(selectedOption, selectedOption === "custom" ? customRange : undefined);
    onFilterChange(filter);
  }, []);

  const handleOptionChange = (option: DateRangeOption) => {
    setSelectedOption(option);
    
    const filter = getDateFilter(option, option === "custom" ? customRange : undefined);
    onFilterChange(filter);
  };

  const handleCustomRangeChange = (type: "start" | "end", date: Date) => {
    const newRange = { ...customRange, [type]: date };
    setCustomRange(newRange);
    
    if (selectedOption === "custom") {
      const filter = getDateFilter("custom", newRange);
      onFilterChange(filter);
    }
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: "start" | "end") => {
    const date = new Date(e.target.value);
    if (!isNaN(date.getTime())) {
      handleCustomRangeChange(type, date);
    }
  };

  const currentFilter = getDateFilter(selectedOption, selectedOption === "custom" ? customRange : undefined);
  const dateRangeLabel = getDateRangeLabel(currentFilter);

  return (
    <div className="mb-6 bg-card rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between">
      <div className="flex items-center space-x-3 mb-3 md:mb-0">
        <h2 className="font-medium">Quick Filters:</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedOption === "this_month" ? "default" : "outline"}
            size="sm"
            onClick={() => handleOptionChange("this_month")}
            className="rounded-full"
          >
            This Month
          </Button>
          <Button
            variant={selectedOption === "this_quarter" ? "default" : "outline"}
            size="sm"
            onClick={() => handleOptionChange("this_quarter")}
            className="rounded-full"
          >
            This Quarter
          </Button>
          <Button
            variant={selectedOption === "this_year" ? "default" : "outline"}
            size="sm"
            onClick={() => handleOptionChange("this_year")}
            className="rounded-full"
          >
            This Year
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <div className="grid grid-cols-2 gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !customRange.start && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(customRange.start, "yyyy-MM-dd")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={customRange.start}
                onSelect={(date) => date && handleCustomRangeChange("start", date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !customRange.end && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(customRange.end, "yyyy-MM-dd")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={customRange.end}
                onSelect={(date) => date && handleCustomRangeChange("end", date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <Button
          onClick={() => handleOptionChange("custom")}
          variant={selectedOption === "custom" ? "default" : "outline"}
        >
          Apply
        </Button>
      </div>
    </div>
  );
}
