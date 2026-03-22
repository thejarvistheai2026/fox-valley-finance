// Fox Valley Finance Tracker - Mobile Types

export interface Vendor {
  id: string;
  display_id: string;
  name: string;
  type: 'contract' | 'retail';
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  tags?: string[];
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Receipt {
  id: string;
  display_id: string;
  vendor_id: string;
  estimate_id?: string | null;
  vendor_ref?: string;
  date: string;
  subtotal: number;
  gst_amount: number;
  pst_amount: number;
  tax_total: number;
  total: number;
  payment_type?: string;
  status: 'inbox' | 'confirmed';
  notes?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  documents?: Document[];
}

export interface Estimate {
  id: string;
  display_id: string;
  vendor_id: string;
  vendor_ref?: string;
  title: string;
  date: string;
  estimated_total: number;
  status: 'active' | 'revised' | 'declined';
  notes?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  display_id: string;
  vendor_id: string;
  estimate_id?: string | null;
  receipt_id?: string | null;
  display_name?: string;
  original_file_name: string;
  storage_path: string;
  file_type: string;
  file_size_bytes: number;
  notes?: string;
  created_at: string;
}

export interface OCResult {
  vendor_name?: string | null;
  vendor_type?: 'contract' | 'retail' | null;
  date?: string | null;
  subtotal?: number | null;
  gst_amount?: number | null;
  pst_amount?: number | null;
  tax_total?: number | null;
  total?: number | null;
  vendor_ref?: string | null;
  confidence: 'high' | 'medium' | 'low' | 'failed';
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export type RootStackParamList = {
  Main: undefined;
  // Capture Flow
  SelectVendor: undefined;
  Camera: {
    vendorId?: string;
  };
  Review: {
    imageUri: string;
    vendorId?: string;
  };
  ReceiptDetail: {
    receiptId: string;
  };
  VendorDetail: {
    vendorId: string;
  };
  // Legacy capture route (for backwards compatibility)
  Capture: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Inbox: undefined;
};