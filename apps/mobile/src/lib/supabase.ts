import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { Vendor, Receipt, Estimate, OCResult } from '~/types';

// NOTE: Replace with your actual Supabase credentials
// These should be stored in environment variables for production
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

// Create Supabase client with persistent session storage
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Get the proper redirect URL for OAuth
// Uses Linking.createURL which automatically handles:
// - Expo Go: exp://192.168.x.x:8081/--/auth/callback
// - Standalone: foxvalley://auth/callback (based on scheme in app.json)
export const getRedirectUrl = (): string => {
  return Linking.createURL('auth/callback');
};

// Auth helpers
export const signInWithEmail = async (email: string) => {
  const redirectUrl = getRedirectUrl();
  console.log('Magic link redirect URL:', redirectUrl);

  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectUrl,
    },
  });
  return { data, error };
};

export const signInWithGoogle = async () => {
  const redirectUrl = getRedirectUrl();
  console.log('Google OAuth redirect URL:', redirectUrl);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: true, // Important: Return URL instead of redirecting
    },
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
};

// Vendor queries
export const getVendors = async (search?: string): Promise<Vendor[]> => {
  let query = supabase
    .from('vendors')
    .select('*')
    .eq('is_archived', false)
    .order('name');

  if (search) {
    query = query.or(`name.ilike.%${search}%,display_id.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const getVendorById = async (id: string): Promise<Vendor | null> => {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const createVendor = async (name: string, type: 'contract' | 'retail'): Promise<Vendor> => {
  const { data, error } = await supabase
    .from('vendors')
    .insert({ name, type })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Receipt queries
export const getReceiptById = async (id: string): Promise<Receipt | null> => {
  const { data, error } = await supabase
    .from('receipts')
    .select(`
      *,
      documents:documents(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const createReceipt = async (receiptData: Partial<Receipt>): Promise<Receipt> => {
  const { data, error } = await supabase
    .from('receipts')
    .insert(receiptData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getInboxReceipts = async (): Promise<Receipt[]> => {
  const { data, error } = await supabase
    .from('receipts')
    .select(`
      *,
      vendors:vendor_id (name, display_id)
    `)
    .eq('status', 'inbox')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Estimate queries
export const getEstimatesByVendor = async (vendorId: string): Promise<Estimate[]> => {
  const { data, error } = await supabase
    .from('estimates')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('status', 'active')
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
};

// OCR Edge Function
export const callOCFunction = async (imageBase64: string): Promise<OCResult> => {
  const { data, error } = await supabase.functions.invoke('ocr-extract', {
    body: { image: imageBase64 },
  });

  if (error) {
    console.error('OC function error:', error);
    // Return fallback result on failure
    return {
      confidence: 'failed',
      vendor_name: null,
      date: null,
      subtotal: null,
      gst_amount: null,
      pst_amount: null,
      tax_total: null,
      total: null,
      vendor_ref: null,
    };
  }

  return data;
};

// Helper to convert base64 to Uint8Array (React Native compatible)
const base64ToUint8Array = (base64: string): Uint8Array => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }

  const len = base64.length;
  const padding = base64.charAt(len - 1) === '=' ? (base64.charAt(len - 2) === '=' ? 2 : 1) : 0;
  const bytesLen = (len * 0.75) - padding;
  const arr = new Uint8Array(bytesLen);

  let i = 0, j = 0;
  for (; i < len; i += 4) {
    const encoded1 = lookup[base64.charCodeAt(i)];
    const encoded2 = lookup[base64.charCodeAt(i + 1)];
    const encoded3 = lookup[base64.charCodeAt(i + 2)];
    const encoded4 = lookup[base64.charCodeAt(i + 3)];

    arr[j++] = (encoded1 << 2) | (encoded2 >> 4);
    arr[j++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    arr[j++] = ((encoded3 & 3) << 6) | encoded4;
  }

  return arr;
};

// Storage helpers
export const uploadReceiptImage = async (
  fileName: string,
  base64Data: string,
  contentType: string = 'image/jpeg'
): Promise<string> => {
  // Convert base64 to Uint8Array for React Native
  const bytes = base64ToUint8Array(base64Data);

  const { data, error } = await supabase
    .storage
    .from('receipts')
    .upload(fileName, bytes, {
      contentType,
      upsert: false,
    });

  if (error) throw error;
  return data.path;
};

export const getPublicUrl = (path: string): string => {
  const { data } = supabase.storage.from('receipts').getPublicUrl(path);
  return data.publicUrl;
};

// Alias for OCR function
export const getOCRResults = callOCFunction;

// Get receipts with filters
export const getReceipts = async (options?: {
  dateRange?: { start: string; end: string };
}): Promise<Receipt[]> => {
  let query = supabase
    .from('receipts')
    .select(`
      *,
      vendors:vendor_id (*)
    `)
    .order('created_at', { ascending: false });

  if (options?.dateRange) {
    query = query
      .gte('date', options.dateRange.start)
      .lte('date', options.dateRange.end);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

// Upload document and create document record
export const uploadDocument = async (
  imageUri: string,
  fileName: string,
  fileType: string,
  projectId: string,
  vendorId?: string | null
): Promise<{ id: string; storage_path: string }> => {
  // Convert image to base64
  const response = await fetch(imageUri);
  const blob = await response.blob();

  // Read file as base64
  const reader = new FileReader();
  const base64Promise = new Promise<string>((resolve) => {
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.readAsDataURL(blob);
  });
  const base64Data = await base64Promise;

  // Upload to storage
  const storagePath = `${projectId}/documents/${Date.now()}_${fileName}`;
  const bytes = base64ToUint8Array(base64Data);

  const { error: uploadError } = await supabase
    .storage
    .from('documents')
    .upload(storagePath, bytes, {
      contentType: fileType,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  // Create document record
  const { data, error: docError } = await supabase
    .from('documents')
    .insert({
      project_id: projectId,
      vendor_id: vendorId,
      display_name: fileName,
      original_file_name: fileName,
      storage_path: storagePath,
      file_type: fileType,
      file_size_bytes: bytes.length,
    })
    .select('id, storage_path')
    .single();

  if (docError) throw docError;
  return data;
};
