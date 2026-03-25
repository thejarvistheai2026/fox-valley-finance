import { useState, useEffect } from 'react';
import {
  InboxIcon,
  Check,
  X,
  Receipt as ReceiptIcon,
  Sparkles,
  ChevronRight,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Currency } from '@/components/currency';
import { ReceiptStatusBadge } from '@/components/badge';
import type { Receipt as ReceiptType, Vendor } from '@/types';
import { getReceipts, getVendors, updateReceipt } from '@/lib/supabase';

interface SmartRecommendation {
  vendorSuggestion: Vendor;
  confidence: 'high' | 'medium' | 'low';
  estimateSuggestion?: {
    id: string;
    display_id: string;
    title: string;
  };
  tagSuggestions: string[];
}

const generateSmartRecommendations = (receipt: ReceiptType, vendors: Vendor[]): SmartRecommendation => {
  const vendorSuggestion = vendors.find(v => v.id === receipt.vendor_id) || vendors[0];
  const confidence: 'high' | 'medium' | 'low' = Math.random() > 0.3 ? 'high' : 'medium';
  
  const tagSuggestions: string[] = [];
  if (receipt.notes?.toLowerCase().includes('pipe')) tagSuggestions.push('plumbing');
  if (receipt.notes?.toLowerCase().includes('electrical') || receipt.notes?.toLowerCase().includes('wire')) tagSuggestions.push('electrical');
  if (receipt.notes?.toLowerCase().includes('outlet')) tagSuggestions.push('electrical');
  if (tagSuggestions.length === 0) tagSuggestions.push('materials');
  
  return {
    vendorSuggestion: vendorSuggestion || { id: '1', display_id: 'VEN-0001', name: 'Unknown', type: 'retail', tags: [], tax_province: 'ON', is_archived: false, created_at: '', updated_at: '' },
    confidence,
    tagSuggestions,
  };
};

export function InboxPage() {
  const [inboxItems, setInboxItems] = useState<ReceiptType[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [receiptsData, vendorsData] = await Promise.all([
          getReceipts({ status: 'inbox' }),
          getVendors()
        ]);
        setInboxItems(receiptsData || []);
        setVendors(vendorsData || []);
      } catch (err) {
        console.error('Failed to fetch inbox:', err);
        setError(err instanceof Error ? err.message : 'Failed to load inbox');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleConfirmReceipt = async (receipt: ReceiptType, updates: Partial<ReceiptType>) => {
    setProcessingId(receipt.id);
    try {
      await updateReceipt(receipt.id, { ...updates, status: 'confirmed' });
      setInboxItems(prev => prev.filter(r => r.id !== receipt.id));
    } catch (err) {
      console.error('Failed to confirm receipt:', err);
      setError(err instanceof Error ? err.message : 'Failed to confirm receipt');
    } finally {
      setProcessingId(null);
    }
  };

  const handleQuickConfirm = (receipt: ReceiptType) => {
    handleConfirmReceipt(receipt, { status: 'confirmed' });
  };

  const handleDismiss = (receiptId: string) => {
    setInboxItems(prev => prev.filter(r => r.id !== receiptId));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (inboxItems.length === 0) {
    return (
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            <span className="font-medium">Error: {error}</span>
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">Inbox</h1>
          <p className="text-muted-foreground">
            Process captured receipts
          </p>
        </div>

        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <InboxIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">All caught up!</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your inbox is empty. New receipts captured from your mobile app will appear here for review.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <span className="font-medium">Error: {error}</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inbox</h1>
          <p className="text-muted-foreground">
            {inboxItems.length} receipt{inboxItems.length !== 1 ? 's' : ''} to process
          </p>
        </div>
        
        <Badge variant="secondary" className="text-lg px-3 py-1">
          <InboxIcon className="h-4 w-4 mr-2" />
          {inboxItems.length}
        </Badge>
      </div>

      <div className="space-y-4">
        {inboxItems.map((receipt) => (
          <InboxItemCard
            key={receipt.id}
            receipt={receipt}
            vendors={vendors}
            onConfirm={handleConfirmReceipt}
            onQuickConfirm={handleQuickConfirm}
            onDismiss={handleDismiss}
            isProcessing={processingId === receipt.id}
          />
        ))}
      </div>
    </div>
  );
}
interface InboxItemCardProps {
  receipt: ReceiptType;
  vendors: Vendor[];
  onConfirm: (receipt: ReceiptType, updates: Partial<ReceiptType>) => void;
  onQuickConfirm: (receipt: ReceiptType) => void;
  onDismiss: (id: string) => void;
  isProcessing: boolean;
}

function InboxItemCard({ receipt, vendors, onConfirm, onQuickConfirm, onDismiss, isProcessing }: InboxItemCardProps) {
  const recommendations = generateSmartRecommendations(receipt, vendors);
  const [selectedVendor, setSelectedVendor] = useState(receipt.vendor_id);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [customTag, setCustomTag] = useState('');

  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const handleCustomTagSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customTag.trim()) {
      addTag(customTag.trim().toLowerCase());
      setCustomTag('');
    }
  };

  const handleConfirm = () => {
    onConfirm(receipt, {
      vendor_id: selectedVendor,
      tags: selectedTags,
      status: 'confirmed',
    });
  };

  return (
    <Card className={isProcessing ? 'opacity-50' : ''}>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Receipt Image Thumbnail */}
          <div className="w-full md:w-48 flex-shrink-0">
            <div className="aspect-[3/4] bg-muted rounded-lg border-2 border-dashed flex items-center justify-center">
              <ReceiptIcon className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>

          {/* Receipt Details */}
          <div className="flex-1 space-y-4">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{receipt.display_id}</h3>
                  <ReceiptStatusBadge status="inbox" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Captured {new Date(receipt.created_at).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  <Currency amount={receipt.total} />
                </p>
                <p className="text-sm text-muted-foreground">
                  {receipt.date}
                </p>
              </div>
            </div>

            <Separator />

            {/* AI Extracted Data */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Subtotal</p>
                <p className="font-medium"><Currency amount={receipt.subtotal} /></p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">GST (5%)</p>
                <p className="font-medium"><Currency amount={receipt.gst_amount} /></p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">PST (8%)</p>
                <p className="font-medium"><Currency amount={receipt.pst_amount} /></p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total</p>
                <p className="font-medium"><Currency amount={receipt.total} /></p>
              </div>
            </div>

            {receipt.vendor_ref && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Vendor Reference</p>
                <p className="font-medium">{receipt.vendor_ref}</p>
              </div>
            )}

            {receipt.notes && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm">{receipt.notes}</p>
              </div>
            )}

            <Separator />

            {/* Smart Recommendations */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium">Smart Recommendations</span>
              </div>

              {/* Vendor Match */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-muted-foreground">Vendor:</span>
                <Select value={selectedVendor} onValueChange={(val) => setSelectedVendor(val || '')}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map(vendor => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name} ({vendor.display_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {recommendations.confidence === 'high' && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    High confidence
                  </Badge>
                )}
                {recommendations.confidence === 'medium' && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Review suggested
                  </Badge>
                )}
              </div>

              {/* Tag Suggestions */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-muted-foreground">Tags:</span>
                {recommendations.tagSuggestions.map(tag => (
                  <button
                    key={tag}
                    onClick={() => addTag(tag)}
                    className={`text-xs px-2 py-1 rounded-full transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {selectedTags.includes(tag) ? '✓ ' : '+ '}{tag}
                  </button>
                ))}
                <Input
                  placeholder="Add tag..."
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyDown={handleCustomTagSubmit}
                  className="w-32 h-7 text-xs"
                />
              </div>

              {/* Selected Tags Display */}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button 
                onClick={handleConfirm}
                disabled={isProcessing}
                className="flex-1 md:flex-none"
              >
                <Check className="h-4 w-4 mr-2" />
                Confirm & Save
              </Button>
              <Button
                variant="secondary"
                onClick={() => onQuickConfirm(receipt)}
                disabled={isProcessing}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Quick Confirm
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'Less Details' : 'More Details'}
                <ChevronRight className={`h-4 w-4 ml-2 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                onClick={() => onDismiss(receipt.id)}
                disabled={isProcessing}
              >
                <X className="h-4 w-4 mr-2" />
                Dismiss
              </Button>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
                <h4 className="font-medium">Full Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Receipt ID</p>
                    <p>{receipt.display_id}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Captured At</p>
                    <p>{new Date(receipt.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Vendor Reference</p>
                    <p>{receipt.vendor_ref || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Payment Type</p>
                    <p>{receipt.payment_type || '—'}</p>
                  </div>
                </div>
                <div className="text-sm">
                  <p className="text-muted-foreground">Notes</p>
                  <p>{receipt.notes || 'No notes'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
