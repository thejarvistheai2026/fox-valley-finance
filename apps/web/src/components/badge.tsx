import { cn } from '@/lib/utils';
import { Badge as UIBadge } from '@/components/ui/badge';
import type { VendorType, EstimateStatus, ReceiptStatus } from '@/types';

interface TypeBadgeProps {
  type: VendorType;
  className?: string;
}

export function VendorTypeBadge({ type, className }: TypeBadgeProps) {
  const variants: Record<VendorType, { variant: 'default' | 'secondary'; label: string }> = {
    contract: { variant: 'default', label: 'Contract' },
    retail: { variant: 'secondary', label: 'Retail' },
  };
  
  const { variant, label } = variants[type];
  
  return (
    <UIBadge variant={variant} className={className}>
      {label}
    </UIBadge>
  );
}

interface EstimateStatusBadgeProps {
  status: EstimateStatus;
  className?: string;
}

export function EstimateStatusBadge({ status, className }: EstimateStatusBadgeProps) {
  const variants: Record<EstimateStatus, { className: string; label: string }> = {
    'in-progress': { className: 'bg-blue-100 text-blue-800 hover:bg-blue-100', label: 'In Progress' },
    'revised': { className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100', label: 'Revised' },
    'archived': { className: 'bg-gray-100 text-gray-800 hover:bg-gray-100', label: 'Archived' },
  };

  const { className: statusClassName, label } = variants[status];

  return (
    <UIBadge className={cn(statusClassName, className)}>
      {label}
    </UIBadge>
  );
}

interface ReceiptStatusBadgeProps {
  status: ReceiptStatus;
  className?: string;
}

export function ReceiptStatusBadge({ status, className }: ReceiptStatusBadgeProps) {
  const variants: Record<ReceiptStatus, { className: string; label: string }> = {
    'completed': { className: 'bg-green-100 text-green-800 hover:bg-green-100', label: 'Completed' },
    'inbox': { className: 'bg-amber-100 text-amber-800 hover:bg-amber-100', label: 'Inbox' },
  };

  const { className: statusClassName, label } = variants[status];

  return (
    <UIBadge className={cn(statusClassName, className)}>
      {label}
    </UIBadge>
  );
}
