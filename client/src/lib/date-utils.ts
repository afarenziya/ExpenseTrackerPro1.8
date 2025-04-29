import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, subQuarters, subYears, startOfDay, endOfDay } from 'date-fns';
import { DateFilter } from '@shared/schema';

export type DateRangeOption = 
  | 'this_month' 
  | 'last_month' 
  | 'this_quarter' 
  | 'last_quarter' 
  | 'last_3_months'
  | 'this_year' 
  | 'last_year'
  | 'last_12_months'
  | 'custom';

export function getDateFilter(option: DateRangeOption, customRange?: { start: Date, end: Date }): DateFilter {
  const now = new Date();
  
  switch (option) {
    case 'this_month':
      // From 1st day of current month to today
      return {
        startDate: startOfMonth(now),
        endDate: now
      };
    case 'last_month':
      const lastMonth = subMonths(now, 1);
      return {
        startDate: startOfMonth(lastMonth),
        endDate: endOfMonth(lastMonth)
      };
    case 'this_quarter':
      // Last 6 months from today
      return {
        startDate: subMonths(now, 6),
        endDate: now
      };
    case 'last_quarter':
      const lastQuarter = subQuarters(now, 1);
      return {
        startDate: startOfQuarter(lastQuarter),
        endDate: endOfQuarter(lastQuarter)
      };
    case 'last_3_months':
      // Last 3 months from today
      return {
        startDate: subMonths(now, 3),
        endDate: now
      };
    case 'this_year':
      // Last 12 months from today
      return {
        startDate: subMonths(now, 12),
        endDate: now
      };
    case 'last_year':
      const lastYear = subYears(now, 1);
      return {
        startDate: startOfYear(lastYear),
        endDate: endOfYear(lastYear)
      };
    case 'last_12_months':
      // Last 12 months from today
      return {
        startDate: subMonths(now, 12),
        endDate: now
      };
    case 'custom':
      if (!customRange) {
        throw new Error('Custom date range is required');
      }
      return {
        startDate: startOfDay(customRange.start),
        endDate: endOfDay(customRange.end)
      };
    default:
      return {
        startDate: startOfMonth(now),
        endDate: now
      };
  }
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), 'dd MMM yyyy');
}

export function formatDateForInput(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function getDateRangeLabel(filter: DateFilter): string {
  return `${formatDate(filter.startDate)} to ${formatDate(filter.endDate)}`;
}
