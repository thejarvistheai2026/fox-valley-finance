import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DocumentUpload } from '@/components/document-upload';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import type { Estimate, EstimateStatus } from '@/types';

const estimateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  vendor_ref: z.string().min(1, 'Vendor reference is required'),
  date: z.date(),
  subtotal: z.number().min(0, 'Amount must be 0 or greater'),
  hst_amount: z.number().min(0, 'Amount must be 0 or greater'),
  estimated_total: z.number().min(0, 'Amount must be 0 or greater'),
  status: z.enum(['active', 'revised', 'declined', 'completed'] as const),
  notes: z.string().optional(),
});

type EstimateFormData = z.infer<typeof estimateSchema>;

interface EstimateFormDialogProps {
  vendorId: string;
  estimate?: Estimate;
  onSubmit: (data: Omit<Estimate, 'id' | 'display_id' | 'project_id' | 'vendor_id' | 'created_at' | 'updated_at'>, file?: File | null) => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EstimateFormDialog({ vendorId, estimate, onSubmit, trigger, open: controlledOpen, onOpenChange }: EstimateFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [dateOpen, setDateOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const calculateTotal = (subtotal: number, hst: number) => {
    return Number((subtotal + hst).toFixed(2));
  };

  const form = useForm<EstimateFormData>({
    resolver: zodResolver(estimateSchema),
    defaultValues: estimate ? {
      title: estimate.title,
      vendor_ref: estimate.vendor_ref || '',
      date: new Date(estimate.date),
      subtotal: estimate.estimated_total || 0, // Legacy: use total as subtotal
      hst_amount: 0,
      estimated_total: estimate.estimated_total,
      status: estimate.status,
      notes: estimate.notes || '',
    } : {
      title: '',
      vendor_ref: '',
      date: new Date(),
      subtotal: 0,
      hst_amount: 0,
      estimated_total: 0,
      status: 'active',
      notes: '',
    },
  });

  // Watch subtotal and HST to auto-calculate total
  const subtotal = form.watch('subtotal');
  const hstAmount = form.watch('hst_amount');

  useEffect(() => {
    const total = calculateTotal(subtotal || 0, hstAmount || 0);
    form.setValue('estimated_total', total, { shouldValidate: false });
  }, [subtotal, hstAmount, form]);
  
  const handleSubmit = (data: EstimateFormData) => {
    // Only pass valid Estimate fields (exclude form-only fields like subtotal/hst_amount)
    const estimateData = {
      title: data.title,
      vendor_ref: data.vendor_ref,
      date: format(data.date, 'yyyy-MM-dd'),
      estimated_total: data.estimated_total,
      status: data.status,
      notes: data.notes,
      vendor_id: vendorId,
      tags: [],
    } as Omit<Estimate, 'id' | 'display_id' | 'project_id' | 'vendor_id' | 'created_at' | 'updated_at'>;

    onSubmit(estimateData, selectedFile);
    setOpen(false);
    form.reset();
    setSelectedFile(null);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && (
        <DialogTrigger>
          {trigger}
        </DialogTrigger>
      )}

      <DialogContent className="max-w-2xl p-8">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-xl">
            {estimate ? 'Edit Estimate' : 'Add New Estimate'}
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            {estimate
              ? 'Update the estimate details below.'
              : 'Enter the estimate information for this vendor.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          {/* Section: Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Basic Information</h3>
            <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="title">Title/Description *</Label>
              <Input
                id="title"
                {...form.register('title')}
                placeholder="e.g., Kitchen Renovation - Phase 1"
                className="h-11"
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor_ref">Vendor Reference/Quote # *</Label>
              <Input
                id="vendor_ref"
                {...form.register('vendor_ref')}
                placeholder="e.g., Q-2026-001"
                className="h-11"
              />
              {form.formState.errors.vendor_ref && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.vendor_ref.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Date *</Label>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-11",
                      !form.watch('date') && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch('date') ? format(form.watch('date'), 'PPP') : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.watch('date')}
                    onSelect={(date) => {
                      form.setValue('date', date || new Date());
                      setDateOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            </div>
          </div>

          {/* Section: Financial & Status */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Financial & Status</h3>
            <div className="grid grid-cols-3 gap-5">

            <div className="space-y-2">
              <Label htmlFor="subtotal">Subtotal (CAD) *</Label>
              <Input
                id="subtotal"
                type="number"
                step="0.01"
                {...form.register('subtotal', {
                  setValueAs: (v) => (v === '' || v === undefined ? 0 : parseFloat(v))
                })}
                placeholder="0.00"
                className="h-11"
              />
              {form.formState.errors.subtotal && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.subtotal.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="hst_amount">HST / Tax (CAD) <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                id="hst_amount"
                type="number"
                step="0.01"
                {...form.register('hst_amount', {
                  setValueAs: (v) => (v === '' || v === undefined ? 0 : parseFloat(v))
                })}
                placeholder="0.00"
                className="h-11"
              />
              {form.formState.errors.hst_amount && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.hst_amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_total">Estimated Total (CAD)</Label>
              <Input
                id="estimated_total"
                type="number"
                step="0.01"
                {...form.register('estimated_total', {
                  setValueAs: (v) => (v === '' || v === undefined ? 0 : parseFloat(v))
                })}
                placeholder="0.00"
                className="h-11 bg-muted"
                readOnly
              />
              <p className="text-xs text-muted-foreground mt-1">Auto-calculated from subtotal + tax</p>
            </div>
            </div>

            <div className="grid grid-cols-2 gap-5 mt-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={form.watch('status')}
                onValueChange={(value) => form.setValue('status', value as EstimateStatus)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent side="bottom">
                  <SelectItem value="active">In Progress</SelectItem>
                  <SelectItem value="revised">Revised</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            </div>
          </div>

          {/* Section: Notes */}
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...form.register('notes')}
                placeholder="Any additional details about this estimate..."
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          {/* Section: Document Upload */}
          <div className="space-y-4 pt-4 border-t">
            <DocumentUpload
              onFileSelect={setSelectedFile}
              selectedFile={selectedFile}
            />
          </div>

          <DialogFooter className="gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-11 px-6">
              Cancel
            </Button>
            <Button type="submit" className="h-11 px-6">
              {estimate ? 'Update Estimate' : 'Create Estimate'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
