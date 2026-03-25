export type VendorType = 'contract' | 'retail';
export type EstimateStatus = 'draft' | 'active' | 'completed' | 'declined';
export type ReceiptStatus = 'inbox' | 'confirmed';
export type PaymentType = 'deposit' | 'final' | 'additional';
export type TaxProvince = 'ON' | 'QC';

export interface Vendor {
  id: string;
  display_id: string;
  project_id: string;
  name: string;
  type: VendorType;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  contact_name?: string;
  notes?: string;
  tags: string[];
  tax_province: TaxProvince;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  // Computed fields
  estimated_total?: number;
  paid_total?: number;
  outstanding?: number;
  gst_total?: number;
  pst_total?: number;
  tax_total?: number;
}

export interface Estimate {
  id: string;
  display_id: string;
  project_id: string;
  vendor_id: string;
  vendor?: Vendor;
  vendor_ref?: string;
  title: string;
  date: string;
  estimated_total: number;
  status: EstimateStatus;
  notes?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  // Computed fields
  paid_to_date?: number;
  outstanding?: number;
  linked_receipts?: Receipt[];
}

export interface Receipt {
  id: string;
  display_id: string;
  project_id: string;
  vendor_id: string;
  estimate_id?: string;
  vendor_ref?: string;
  date: string;
  subtotal: number;
  gst_amount: number;
  pst_amount: number;
  tax_total: number;
  total: number;
  payment_type?: PaymentType;
  status: ReceiptStatus;
  notes?: string;
  tags: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Relations
  vendor?: Vendor;
  estimate?: Estimate;
  document?: Document;
}

export interface Document {
  id: string;
  display_id: string;
  project_id: string;
  vendor_id: string;
  vendor?: Vendor;
  estimate_id?: string;
  receipt_id?: string;
  vendor_ref?: string;
  display_name: string;
  original_file_name: string;
  storage_path: string;
  file_type: string;
  file_size_bytes: number;
  notes?: string;
  tags: string[];
  created_at: string;
  // Relations
  estimate?: Estimate;
  receipt?: Receipt;
}

export interface DashboardSummary {
  total_estimated: number;           // draft + in progress
  current_total_estimate: number;  // in progress only
  total_paid: number;
  total_outstanding: number;
  total_gst: number;
  total_pst: number;
  total_tax: number;
  vendor_count: number;
  receipt_count: number;
}

export interface DateRange {
  label: string;
  days: number | null;
}

export const DATE_RANGES: DateRange[] = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 3 months', days: 90 },
  { label: 'Last 6 months', days: 180 },
  { label: 'All time', days: null },
];

export const PAYMENT_TYPES: { value: PaymentType; label: string }[] = [
  { value: 'deposit', label: 'Deposit' },
  { value: 'final', label: 'Final Payment' },
  { value: 'additional', label: 'Additional' },
];
