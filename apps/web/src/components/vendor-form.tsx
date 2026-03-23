import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Building2 } from 'lucide-react';
import type { Vendor, VendorType, TaxProvince } from '@/types';

const vendorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['contract', 'retail'] as const),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  contact_name: z.string().optional(),
  notes: z.string().optional(),
  tax_province: z.enum(['ON', 'QC'] as const),
  tags: z.array(z.string()),
});

type VendorFormData = z.infer<typeof vendorSchema>;

interface VendorFormDialogProps {
  vendor?: Vendor;
  onSubmit: (data: Omit<Vendor, 'id' | 'display_id' | 'project_id' | 'created_at' | 'updated_at'>) => void;
  trigger?: React.ReactNode;
}

export function VendorFormDialog({ vendor, onSubmit, trigger }: VendorFormDialogProps) {
  const [open, setOpen] = useState(false);
  
  const form = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema),
    defaultValues: vendor ? {
      name: vendor.name,
      type: vendor.type,
      email: vendor.email || '',
      phone: vendor.phone || '',
      address: vendor.address || '',
      contact_name: vendor.contact_name || '',
      notes: vendor.notes || '',
      tax_province: vendor.tax_province,
      tags: vendor.tags || [],
    } : {
      name: '',
      type: 'contract',
      email: '',
      phone: '',
      address: '',
      contact_name: '',
      notes: '',
      tax_province: 'ON',
      tags: [],
    },
  });
  
  const handleSubmit = (data: VendorFormData) => {
    onSubmit({
      ...data,
      is_archived: false,
      tags: data.tags || [],
    } as Omit<Vendor, 'id' | 'display_id' | 'project_id' | 'created_at' | 'updated_at'>);
    setOpen(false);
    form.reset();
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        {trigger || (
          <Button>
            <Building2 className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {vendor ? 'Edit Vendor' : 'Add New Vendor'}
          </DialogTitle>
          <DialogDescription>
            {vendor 
              ? 'Update the vendor information below.' 
              : 'Enter the details for your new vendor.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Vendor Name *</Label>
              <Input
                id="name"
                {...form.register('name')}
                placeholder="e.g., Home Depot, Elite Electric"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="type">Vendor Type *</Label>
              <Select
                value={form.watch('type')}
                onValueChange={(value) => form.setValue('type', value as VendorType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contract">Contract (with estimates)</SelectItem>
                  <SelectItem value="retail">Retail (receipts only)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="tax_province">Tax Province *</Label>
              <Select
                value={form.watch('tax_province')}
                onValueChange={(value) => form.setValue('tax_province', value as TaxProvince)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ON">Ontario (HST)</SelectItem>
                  <SelectItem value="QC">Quebec (GST + QST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="contact_name">Contact Name</Label>
              <Input
                id="contact_name"
                {...form.register('contact_name')}
                placeholder="e.g., John Smith"
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register('email')}
                placeholder="contact@example.com"
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                {...form.register('phone')}
                placeholder="(555) 123-4567"
              />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                {...form.register('address')}
                placeholder="123 Main St, Toronto, ON M5A 1A1"
                rows={2}
              />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...form.register('notes')}
                placeholder="Any additional notes about this vendor..."
                rows={3}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                onChange={(e) => {
                  const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                  form.setValue('tags', tags, { shouldValidate: true });
                }}
                value={form.watch('tags')?.join(', ') || ''}
                placeholder="e.g., plumbing, kitchen, materials (comma separated)"
              />
              <p className="text-xs text-muted-foreground mt-1">Separate tags with commas</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {vendor ? 'Update Vendor' : 'Create Vendor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
