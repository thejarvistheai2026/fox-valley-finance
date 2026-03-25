import { createClient } from '@supabase/supabase-js';
import JSZip from 'jszip';
import type { Vendor, Estimate, Receipt, Document, Todo } from '@/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to get auth user
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Vendor queries
export async function getVendors(options?: { archived?: boolean; search?: string }) {
  let query = supabase
    .from('vendors')
    .select('*')
    .order('name');
  
  if (options?.archived === false) {
    query = query.eq('is_archived', false);
  }
  
  if (options?.search) {
    query = query.ilike('name', `%${options.search}%`);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data as Vendor[];
}

export async function getVendorById(id: string) {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as Vendor;
}

export async function getVendorByDisplayId(displayId: string) {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('display_id', displayId)
    .single();
  
  if (error) throw error;
  return data as Vendor;
}

// Default project ID for single-project setup
const DEFAULT_PROJECT_ID = '11111111-1111-1111-1111-111111111111';

export async function createVendor(vendor: Omit<Vendor, 'id' | 'display_id' | 'project_id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('vendors')
    .insert({ ...vendor, project_id: DEFAULT_PROJECT_ID })
    .select()
    .single();
  
  if (error) throw error;
  return data as Vendor;
}

export async function updateVendor(id: string, updates: Partial<Vendor>) {
  const { data, error } = await supabase
    .from('vendors')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Vendor;
}

export async function archiveVendor(id: string) {
  return updateVendor(id, { is_archived: true });
}

// Estimate queries
export async function getEstimates(vendorId?: string) {
  let query = supabase
    .from('estimate_with_balance')
    .select('*, linked_receipts:receipts(*)')
    .order('date', { ascending: false });

  if (vendorId) {
    query = query.eq('vendor_id', vendorId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Estimate[];
}

export async function getEstimateById(id: string) {
  const { data, error } = await supabase
    .from('estimates')
    .select('*, linked_receipts:receipts(*)')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as Estimate;
}

export async function createEstimate(estimate: Omit<Estimate, 'id' | 'display_id' | 'project_id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('estimates')
    .insert({ ...estimate, project_id: DEFAULT_PROJECT_ID })
    .select()
    .single();
  
  if (error) throw error;
  return data as Estimate;
}

export async function updateEstimate(id: string, updates: Partial<Estimate>) {
  const { data, error } = await supabase
    .from('estimates')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Estimate;
}

export async function deleteEstimate(id: string) {
  const { error } = await supabase
    .from('estimates')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Receipt queries
export async function getReceipts(options?: { 
  vendorId?: string; 
  estimateId?: string; 
  status?: string;
  dateRange?: { start: string; end: string };
}) {
  let query = supabase
    .from('receipts')
    .select('*, vendor:vendors(*), estimate:estimates(*)')
    .order('date', { ascending: false });
  
  if (options?.vendorId) {
    query = query.eq('vendor_id', options.vendorId);
  }
  
  if (options?.estimateId) {
    query = query.eq('estimate_id', options.estimateId);
  }
  
  if (options?.status) {
    query = query.eq('status', options.status);
  }
  
  if (options?.dateRange) {
    query = query
      .gte('date', options.dateRange.start)
      .lte('date', options.dateRange.end);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data as Receipt[];
}

export async function getReceiptById(id: string) {
  const { data, error } = await supabase
    .from('receipts')
    .select('*, vendor:vendors(*), estimate:estimates(*)')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as Receipt;
}

export async function createReceipt(receipt: Omit<Receipt, 'id' | 'display_id' | 'project_id' | 'created_at' | 'updated_at' | 'created_by' | 'tax_total'>) {
  // Get current user to set created_by
  const { data: { user } } = await supabase.auth.getUser();

  // Remove tax_total if present - it's a generated column
  const { tax_total, ...receiptData } = receipt as any;

  const { data, error } = await supabase
    .from('receipts')
    .insert({
      ...receiptData,
      project_id: DEFAULT_PROJECT_ID,
      created_by: user?.id || null
    })
    .select()
    .single();

  if (error) {
    console.error('Supabase error creating receipt:', error);
    throw new Error(`Database error: ${error.message} (${error.code})`);
  }
  return data as Receipt;
}

export async function updateReceipt(id: string, updates: Partial<Receipt>) {
  const { data, error } = await supabase
    .from('receipts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Receipt;
}

export async function archiveReceipt(id: string) {
  return updateReceipt(id, { status: 'confirmed' as const });
}

export async function deleteReceipt(id: string) {
  const { error } = await supabase
    .from('receipts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function unlinkReceiptFromEstimate(receiptId: string) {
  const { error } = await supabase
    .from('receipts')
    .update({ estimate_id: null })
    .eq('id', receiptId);

  if (error) throw error;
}

// Dashboard queries
export async function getDashboardSummary(dateRange?: { start: string; end: string }) {
  const { data, error } = await supabase.rpc('get_dashboard_summary', {
    p_start_date: dateRange?.start || null,
    p_end_date: dateRange?.end || null
  });
  if (error) throw error;
  return data;
}

export async function getVendorSummaries(dateRange?: { start: string; end: string }) {
  const { data, error } = await supabase.rpc('get_vendor_summaries', {
    p_start_date: dateRange?.start || null,
    p_end_date: dateRange?.end || null
  });
  if (error) throw error;
  return data as Vendor[];
}

// Document queries
export async function getDocuments(vendorId: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('*, vendor:vendors(*)')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Document[];
}

export async function getAllDocuments(options?: { limit?: number }) {
  const { data, error } = await supabase
    .from('documents')
    .select('*, vendor:vendors(*)')
    .order('created_at', { ascending: false })
    .limit(options?.limit || 100);

  if (error) throw error;
  return data as Document[];
}

export async function getDocumentByReceiptId(receiptId: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('receipt_id', receiptId)
    .single();

  if (error) return null;
  return data as Document;
}

export async function createDocument(document: Omit<Document, 'id' | 'display_id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('documents')
    .insert(document)
    .select()
    .single();

  if (error) throw error;
  return data as Document;
}

// Upload file to Supabase Storage
export async function uploadDocument(
  file: File,
  projectId: string,
  entityType: 'vendors' | 'estimates' | 'receipts',
  entityId: string
): Promise<{ path: string; url: string }> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const storagePath = `${projectId}/${entityType}/${entityId}/${fileName}`;

  console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
  console.log('Storage path:', storagePath);

  const { error: uploadError, data: uploadData } = await supabase.storage
    .from('documents')
    .upload(storagePath, file, {
      upsert: false,
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    throw uploadError;
  }

  console.log('Upload successful:', uploadData);
  console.log('Full path:', storagePath);

  const { data: { publicUrl } } = supabase.storage
    .from('documents')
    .getPublicUrl(storagePath);

  return { path: storagePath, url: publicUrl };
}

export async function deleteDocument(id: string) {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Get URL for viewing a document (uses signed URL for all file types)
export async function getDocumentViewUrl(storagePath: string): Promise<string> {
  // For PDFs and other non-image files, we need a signed URL
  // Images can use public URL, but PDFs require signed URLs
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(storagePath, 3600); // 1 hour expiry

  if (error) {
    console.error('Error creating signed URL:', error);
    throw error;
  }
  return data.signedUrl;
}

// Get public URL for a document (uses render/image endpoint which works for public buckets)
export function getDocumentPublicUrl(storagePath: string): string {
  // Use the render/image endpoint which actually works for public access
  const supabaseUrl = 'https://nhngmcypqwfuvgzewrij.supabase.co';
  return `${supabaseUrl}/storage/v1/render/image/public/documents/${storagePath}`;
}

// Download document by fetching as blob and triggering download
export async function downloadDocument(storagePath: string, fileName: string): Promise<void> {
  // Fetch the file as a blob
  const { data, error } = await supabase.storage
    .from('documents')
    .download(storagePath);

  if (error) {
    console.error('Error downloading document:', error);
    throw error;
  }

  // Create a blob URL and trigger download
  const blobUrl = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
}

// Create signed URL for secure document access (expires in 1 hour)
export async function createSignedDocumentUrl(storagePath: string): Promise<string> {
  console.log('Creating signed URL for:', storagePath);
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(storagePath, 3600); // 1 hour expiry

  if (error) {
    console.error('Error creating signed URL:', error);
    throw error;
  }
  console.log('Signed URL created:', data?.signedUrl?.substring(0, 50) + '...');
  return data.signedUrl;
}

// Export all documents as a zip file
export async function exportAllDocuments(): Promise<void> {
  // Fetch all documents
  const { data: documents, error: docsError } = await supabase
    .from('documents')
    .select('*, vendor:vendors(name)')
    .order('created_at', { ascending: false });

  if (docsError) {
    console.error('Error fetching documents:', docsError);
    throw docsError;
  }

  if (!documents || documents.length === 0) {
    throw new Error('No documents found to export');
  }

  const zip = new JSZip();

  // Download each document and add to zip
  for (const doc of documents) {
    try {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('documents')
        .download(doc.storage_path);

      if (downloadError) {
        console.error(`Failed to download ${doc.display_name}:`, downloadError);
        continue;
      }

      // Create a folder structure: vendor_name/file_name
      const vendorName = doc.vendor?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown';
      const fileName = doc.display_name || doc.original_file_name || 'document';
      zip.file(`${vendorName}/${fileName}`, fileData);
    } catch (err) {
      console.error(`Error processing ${doc.display_name}:`, err);
    }
  }

  // Generate zip file
  const zipContent = await zip.generateAsync({ type: 'blob' });

  // Trigger download
  const zipUrl = URL.createObjectURL(zipContent);
  const link = document.createElement('a');
  link.href = zipUrl;
  link.download = `documents-export-${new Date().toISOString().split('T')[0]}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(zipUrl);
}

export async function searchAll(query: string) {
  const { data, error } = await supabase
    .rpc('search_all', { query_text: query, p_project_id: DEFAULT_PROJECT_ID });

  if (error) throw error;
  return data;
}

// Get all unique tags
export async function getAllTags() {
  const { data, error } = await supabase
    .rpc('get_all_tags');

  if (error) throw error;
  return data as string[];
}

// Todos API
export async function getTodos() {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('project_id', DEFAULT_PROJECT_ID)
    .order('due_date', { ascending: true, nullsFirst: true })
    .order('sort_order')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Todo[];
}

export async function createTodo(todo: Omit<Todo, 'id' | 'display_id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('todos')
    .insert({ ...todo, project_id: DEFAULT_PROJECT_ID })
    .select()
    .single();

  if (error) throw error;
  return data as Todo;
}

export async function updateTodo(id: string, updates: Partial<Todo>) {
  const { data, error } = await supabase
    .from('todos')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Todo;
}

export async function toggleTodoComplete(id: string, isCompleted: boolean) {
  const updates: Partial<Todo> = {
    is_completed: isCompleted,
    completed_at: isCompleted ? new Date().toISOString() : null,
  };

  const { data, error } = await supabase
    .from('todos')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Todo;
}

export async function deleteTodo(id: string) {
  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// CSV Export
export function generateCSVReceipts(receipts: Receipt[]) {
  const headers = [
    'display_id',
    'vendor_name',
    'vendor_ref',
    'date',
    'subtotal',
    'gst_amount',
    'pst_amount',
    'tax_total',
    'total',
    'payment_type',
    'tags',
    'notes'
  ];
  
  const rows = receipts.map(r => [
    r.display_id,
    r.vendor?.name || '',
    r.vendor_ref || '',
    r.date,
    r.subtotal,
    r.gst_amount,
    r.pst_amount,
    r.tax_total,
    r.total,
    r.payment_type || '',
    r.tags.join(', '),
    r.notes || ''
  ]);
  
  // Add totals row
  const totals = receipts.reduce((acc, r) => ({
    subtotal: acc.subtotal + r.subtotal,
    gst: acc.gst + r.gst_amount,
    pst: acc.pst + r.pst_amount,
    tax: acc.tax + r.tax_total,
    total: acc.total + r.total
  }), { subtotal: 0, gst: 0, pst: 0, tax: 0, total: 0 });
  
  rows.push([
    'TOTALS',
    '',
    '',
    '',
    totals.subtotal,
    totals.gst,
    totals.pst,
    totals.tax,
    totals.total,
    '',
    '',
    ''
  ]);
  
  return [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
