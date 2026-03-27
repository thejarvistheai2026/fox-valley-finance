import { useState, useRef, useEffect } from 'react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DateRangeValue {
  start: string;
  end: string;
  label: string;
}

interface DateRangeFilterProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
}

const PRESET_RANGES = [
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 3 months', days: 90 },
  { label: 'All time', days: null },
] as const;

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [customRangeOpen, setCustomRangeOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const customButtonRef = useRef<HTMLDivElement>(null);

  const handleRangeChange = (label: string | null) => {
    if (label === 'custom') {
      setCustomRangeOpen(true);
      return;
    }

    const range = PRESET_RANGES.find(r => r.label === label);
    if (!range) return;

    let start: Date;
    let end: Date;

    if (range.days) {
      end = endOfDay(new Date());
      start = startOfDay(subDays(new Date(), range.days));
    } else {
      // All time
      start = new Date('1900-01-01');
      end = endOfDay(new Date());
    }

    onChange({
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd'),
      label: range.label,
    });
  };

  // Helper to format date as YYYY-MM-DD without timezone issues
  const formatDateToString = (date: Date): string => {
    // Use local date components to avoid timezone shift
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const applyCustomRange = () => {
    if (dateRange.from && dateRange.to) {
      onChange({
        start: formatDateToString(dateRange.from),
        end: formatDateToString(dateRange.to),
        label: 'Custom range',
      });
      setCustomRangeOpen(false);
      setDateRange({}); // Reset for next time
    }
  };

  const isCustomRange = value.label === 'Custom range';
  const displayLabel = isCustomRange
    ? `${format(new Date(value.start + 'T12:00:00'), 'MMM d')} - ${format(new Date(value.end + 'T12:00:00'), 'MMM d')}`
    : value.label;

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customButtonRef.current && !customButtonRef.current.contains(event.target as Node)) {
        setCustomRangeOpen(false);
      }
    };
    if (customRangeOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [customRangeOpen]);

  return (
    <div className="relative" ref={customButtonRef}>
      <Select
        value={isCustomRange ? 'custom' : value.label}
        onValueChange={handleRangeChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select date range">
            {displayLabel}
          </SelectValue>
        </SelectTrigger>
        {/* Force dropdown to open downward */}
        <SelectContent
          side="bottom"
          align="start"
          sideOffset={4}
          className="dashboard-date-range"
        >
          {PRESET_RANGES.map((range) => (
            <SelectItem key={range.label} value={range.label}>
              {range.label}
            </SelectItem>
          ))}
          {/* Custom range as a SelectItem so it works properly */}
          <SelectItem value="custom" className={cn(isCustomRange && "bg-accent")}>
            <div className="flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Custom range...
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Custom Range Popover - separate from Select */}
      {customRangeOpen && (
        <div
          className="absolute z-50 mt-2 w-auto p-4 rounded-lg bg-popover shadow-md border border-border"
          style={{ top: '100%', right: 0 }}
        >
          <div className="space-y-4">
            <div className="text-sm font-medium">Select date range</div>
            <Calendar
              mode="range"
              selected={{
                from: dateRange.from,
                to: dateRange.to,
              }}
              onSelect={(range) => {
                setDateRange({
                  from: range?.from,
                  to: range?.to,
                });
              }}
              numberOfMonths={2}
            />
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground">
                {dateRange.from && dateRange.to ? (
                  <>
                    {formatDateToString(dateRange.from)} - {formatDateToString(dateRange.to)}
                  </>
                ) : (
                  'Select start and end dates'
                )}
              </div>
              <Button
                size="sm"
                onClick={applyCustomRange}
                disabled={!dateRange.from || !dateRange.to}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function useDateRange(defaultRange: string = 'All time'): {
  dateRange: DateRangeValue;
  setDateRange: (value: DateRangeValue) => void;
} {
  const defaultPreset = PRESET_RANGES.find(r => r.label === defaultRange) || PRESET_RANGES[PRESET_RANGES.length - 1];

  const getInitialValue = (): DateRangeValue => {
    if (defaultPreset.days) {
      return {
        start: format(startOfDay(subDays(new Date(), defaultPreset.days)), 'yyyy-MM-dd'),
        end: format(endOfDay(new Date()), 'yyyy-MM-dd'),
        label: defaultPreset.label,
      };
    } else {
      return {
        start: '1900-01-01',
        end: format(endOfDay(new Date()), 'yyyy-MM-dd'),
        label: defaultPreset.label,
      };
    }
  };

  const [dateRange, setDateRange] = useState<DateRangeValue>(getInitialValue());

  return { dateRange, setDateRange };
}
