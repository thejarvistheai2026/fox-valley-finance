import { cn } from '@/lib/utils';

interface CurrencyProps {
  amount: number;
  className?: string;
  showSign?: boolean;
}

export function Currency({ amount, className, showSign = true }: CurrencyProps) {
  const formatted = new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    signDisplay: showSign ? 'auto' : 'never',
  }).format(amount);
  
  return (
    <span className={cn('tabular-nums', className)}>
      {formatted}
    </span>
  );
}

interface PercentageProps {
  value: number;
  className?: string;
}

export function Percentage({ value, className }: PercentageProps) {
  const formatted = new Intl.NumberFormat('en-CA', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
  
  return (
    <span className={cn('tabular-nums', className)}>
      {formatted}
    </span>
  );
}
