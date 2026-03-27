import { useState } from 'react';
import { format, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent } from '@/components/ui/popover';
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
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 3 months', days: 90 },
  { label: 'Last 6 months', days: 180 },
  { label: 'Last 730 days', days: 730 },
  { label: 'This month', getRange: () => {
    const now = new Date();
    return {
      start: format(startOfMonth(now), 'yyyy-MM-dd'),
      end: format(endOfMonth(now), 'yyyy-MM-dd'),
    };
  }},
  { label: 'Last month', getRange: () => {
    const lastMonth = subMonths(new Date(), 1);
    return {
      start: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
      end: format(endOfMonth(lastMonth), 'yyyy-MM-dd'),
    };
  }},
  { label: 'All time', days: null },
] as const;

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [customRangeOpen, setCustomRangeOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  const handleRangeChange = (label: string | null) => {
    if (!label) return;

    if (label === 'Custom range') {
      setCustomRangeOpen(true);
      return;
    }

    const range = PRESET_RANGES.find(r => r.label === label);
    if (!range) return;

    let start: Date;
    let end: Date;

    if ('getRange' in range) {
      // Month-based presets
      const result = range.getRange();
      onChange({
        start: result.start,
        end: result.end,
        label: range.label,
      });
      return;
    } else if (range.days) {
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

  const applyCustomRange = () => {
    if (dateRange.from && dateRange.to) {
      onChange({
        start: format(startOfDay(dateRange.from), 'yyyy-MM-dd'),
        end: format(endOfDay(dateRange.to), 'yyyy-MM-dd'),
        label: 'Custom range',
      });
      setCustomRangeOpen(false);
    }
  };

  const isCustomRange = value.label === 'Custom range';
  const displayLabel = isCustomRange
    ? `${format(new Date(value.start), 'MMM d')} - ${format(new Date(value.end), 'MMM d')}`
    : value.label;

  return (
    <Popover open={customRangeOpen} onOpenChange={setCustomRangeOpen}>
      <Select
        value={isCustomRange ? undefined : value.label}
        onValueChange={handleRangeChange}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={displayLabel}>
            {displayLabel}
          </SelectValue>
        </SelectTrigger>
        <SelectContent side="bottom" align="start">
          {PRESET_RANGES.map((range) => (
            <SelectItem key={range.label} value={range.label}>
              {range.label}
            </SelectItem>
          ))}
          <div
            className={cn(
              "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
              isCustomRange && "bg-accent text-accent-foreground"
            )}
            onClick={() => setCustomRangeOpen(true)}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            Custom range...
          </div>
        </SelectContent>
      </Select>

      <PopoverContent className="w-auto p-4" align="end">
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
                  {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')}
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
      </PopoverContent>
    </Popover>
  );
}

export function useDateRange(defaultRange: string = 'All time'): {
  dateRange: DateRangeValue;
  setDateRange: (value: DateRangeValue) => void;
} {
  const defaultPreset = PRESET_RANGES.find(r => r.label === defaultRange) || PRESET_RANGES[PRESET_RANGES.length - 1];

  const getInitialValue = (): DateRangeValue => {
    if ('getRange' in defaultPreset) {
      const result = defaultPreset.getRange();
      return {
        start: result.start,
        end: result.end,
        label: defaultPreset.label,
      };
    } else if (defaultPreset.days) {
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
