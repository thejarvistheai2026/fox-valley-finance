import { useState } from 'react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DATE_RANGES } from '@/types';

export interface DateRangeValue {
  start: string;
  end: string;
  label: string;
}

interface DateRangeFilterProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const handleRangeChange = (label: string | null) => {
    if (!label) return;
    const range = DATE_RANGES.find(r => r.label === label);
    if (!range) return;
    
    const end = endOfDay(new Date());
    const start = range.days 
      ? startOfDay(subDays(new Date(), range.days))
      : new Date('1900-01-01'); // All time
    
    onChange({
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd'),
      label: range.label,
    });
  };
  
  return (
    <Select value={value.label} onValueChange={handleRangeChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select date range" />
      </SelectTrigger>
      <SelectContent side="bottom">
        {DATE_RANGES.map((range) => (
          <SelectItem key={range.label} value={range.label}>
            {range.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function useDateRange(defaultRange: string = 'All time'): {
  dateRange: DateRangeValue;
  setDateRange: (value: DateRangeValue) => void;
} {
  const defaultValue = DATE_RANGES.find(r => r.label === defaultRange) || DATE_RANGES[4];
  const end = endOfDay(new Date());
  const start = defaultValue.days 
    ? startOfDay(subDays(new Date(), defaultValue.days))
    : new Date('1900-01-01');
  
  const [dateRange, setDateRange] = useState<DateRangeValue>({
    start: format(start, 'yyyy-MM-dd'),
    end: format(end, 'yyyy-MM-dd'),
    label: defaultValue.label,
  });
  
  return { dateRange, setDateRange };
}
