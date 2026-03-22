import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Receipt, CalendarIcon, X, Upload } from 'lucide-react';
import type { Receipt as ReceiptType, Estimate, TaxProvince } from '@/types';
import { PAYMENT_TYPES } from '@/types';

const receiptSchema = z.object({
  vendor_ref: z.string().optional(),
  date: z.date(),
  subtotal: z.number().min(0, 'Amount must be positive'),
  gst_amount: z.number().min(0),
  pst_amount: z.number().min(0),
  total: z.number().min(0),
  payment_type: z.string().optional(),
  estimate_id: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()),
});

type ReceiptFormData = z.infer<typeof receiptSchema>;

interface ReceiptFormDialogProps {
  vendorId: string;
  vendorType: 'contract' | 'retail';
  taxProvince: TaxProvince;
  estimates?: Estimate[];
  receipt?: ReceiptType;
  preSelectedEstimateId?: string;
  onSubmit: (data: Omit<ReceiptType, 'id' | 'display_id' | 'project_id' | 'vendor_id' | 'created_at' | 'updated_at' | 'status' | 'created_by'>) => void;
  trigger?: React.ReactNode;
}

export function ReceiptFormDialog({
  vendorId,
  vendorType,
  taxProvince,
  estimates = [],
  receipt,
  preSelectedEstimateId,
  onSubmit,
  trigger
}: ReceiptFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const form = useForm<ReceiptFormData>({
    resolver: zodResolver(receiptSchema),
    defaultValues: receipt ? {
      vendor_ref: receipt.vendor_ref || '',
      date: new Date(receipt.date),
      subtotal: receipt.subtotal,
      gst_amount: receipt.gst_amount,
      pst_amount: receipt.pst_amount,
      total: receipt.total,
      payment_type: receipt.payment_type || '',
      estimate_id: receipt.estimate_id || '',
      notes: receipt.notes || '',
      tags: receipt.tags || [],
    } : {
      vendor_ref: '',
      date: new Date(),
      subtotal: 0,
      gst_amount: 0,
      pst_amount: 0,
      total: 0,
      payment_type: '',
      estimate_id: preSelectedEstimateId || '',
      notes: '',
      tags: [],
    },
  });
  
  // Auto-calculate total when tax amounts change
  const subtotal = useWatch({ control: form.control, name: 'subtotal' });
  const gstAmount = useWatch({ control: form.control, name: 'gst_amount' });
  const pstAmount = useWatch({ control: form.control, name: 'pst_amount' });
  
  useEffect(() => {
    const total = (subtotal || 0) + (gstAmount || 0) + (pstAmount || 0);
    form.setValue('total', total);
  }, [subtotal, gstAmount, pstAmount, form]);
  
  const handleSubmit = (data: ReceiptFormData) => {
    console.log('Receipt form submitting:', data);
    console.log('estimate_id from form:', data.estimate_id);
    const submitData = {
      ...data,
      vendor_id: vendorId,
      estimate_id: data.estimate_id || undefined,
      date: format(data.date, 'yyyy-MM-dd'),
      tax_total: (data.gst_amount || 0) + (data.pst_amount || 0),
    };
    console.log('Submitting to parent:', submitData);
    onSubmit(submitData as Omit<ReceiptType, 'id' | 'display_id' | 'project_id' | 'vendor_id' | 'created_at' | 'updated_at' | 'status' | 'created_by'>);
    setOpen(false);
    form.reset();
    setSelectedFile(null);
  };
  
  const addTag = () => {
    if (tagInput.trim() && !form.getValues('tags').includes(tagInput.trim())) {
      form.setValue('tags', [...form.getValues('tags'), tagInput.trim().toLowerCase()]);
      setTagInput('');
    }
  };
  
  const removeTag = (tag: string) => {
    form.setValue('tags', form.getValues('tags').filter((t) => t !== tag));
  };
  
  const taxLabels = {
    ON: { gst: 'HST (Federal 5%)', pst: 'HST (Provincial 8%)' },
    QC: { gst: 'GST (5%)', pst: 'QST (9.975%)' },
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        {trigger || (
          <Button variant="outline" size="sm">
            <Receipt className="h-4 w-4 mr-2" />
            Add Receipt
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {receipt ? 'Edit Receipt' : 'Add New Receipt'}
          </DialogTitle>
          <DialogDescription>
            {receipt 
              ? 'Update the receipt details below.' 
              : 'Enter the receipt information.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vendor_ref">Vendor Reference/Invoice #</Label>
              <Input
                id="vendor_ref"
                {...form.register('vendor_ref')}
                placeholder="e.g., INV-2026-001"
              />
            </div>
            
            <div>
              <Label>Date *</Label>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
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
            
            <div>
              <Label htmlFor="subtotal">Subtotal (CAD) *</Label>
              <Input
                id="subtotal"
                type="number"
                step="0.01"
                {...form.register('subtotal', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
            
            <div>
              <Label htmlFor="gst_amount">{taxLabels[taxProvince].gst}</Label>
              <Input
                id="gst_amount"
                type="number"
                step="0.01"
                {...form.register('gst_amount', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
            
            <div>
              <Label htmlFor="pst_amount">{taxLabels[taxProvince].pst}</Label>
              <Input
                id="pst_amount"
                type="number"
                step="0.01"
                {...form.register('pst_amount', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
            
            <div>
              <Label htmlFor="total">Total (CAD)</Label>
              <Input
                id="total"
                type="number"
                step="0.01"
                {...form.register('total', { valueAsNumber: true })}
                readOnly
                className="bg-muted"
              />
            </div>
            
            <div>
              <Label htmlFor="payment_type">Payment Type</Label>
              <Select
                value={form.watch('payment_type') || undefined}
                onValueChange={(value) => form.setValue('payment_type', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {vendorType === 'contract' && estimates.length > 0 && (
              <div>
                <Label htmlFor="estimate_id">Link to Estimate</Label>
                <Select
                  value={form.watch('estimate_id') || undefined}
                  onValueChange={(value) => form.setValue('estimate_id', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select estimate (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None (unlinked)</SelectItem>
                    {estimates.map((estimate) => (
                      <SelectItem key={estimate.id} value={estimate.id}>
                        {estimate.display_id} - {estimate.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="col-span-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add a tag and press Enter"
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>
              {form.getValues('tags').length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {form.getValues('tags').map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...form.register('notes')}
                placeholder="Any additional details..."
                rows={3}
              />
            </div>
            
            <div className="col-span-2">
              <Label>Attach Document</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  {selectedFile ? selectedFile.name : 'Drag and drop or click to upload'}
                </p>
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="file-upload"
                />
                <Button type="button" variant="outline" size="sm">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Select File
                  </label>
                </Button>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {receipt ? 'Update Receipt' : 'Create Receipt'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
