import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, FileText, Building2, Receipt, X, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Currency } from '@/components/currency';
import { VendorTypeBadge } from '@/components/badge';
import type { Vendor, Receipt as ReceiptType, Estimate } from '@/types';
import { getVendors, getReceipts, getEstimates } from '@/lib/supabase';

interface SearchResult {
  type: 'vendor' | 'receipt' | 'estimate';
  data: Vendor | ReceiptType | Estimate;
  score: number;
}

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    setError(null);

    try {
      // Fetch all data and do client-side search for better results
      const [vendors, receipts, estimates] = await Promise.all([
        getVendors(),
        getReceipts(),
        getEstimates()
      ]);

      const searchLower = searchQuery.toLowerCase();
      const matchedResults: SearchResult[] = [];

      // Search vendors
      vendors.forEach(vendor => {
        if (
          vendor.name.toLowerCase().includes(searchLower) ||
          vendor.display_id.toLowerCase().includes(searchLower) ||
          vendor.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
          vendor.notes?.toLowerCase().includes(searchLower)
        ) {
          matchedResults.push({ type: 'vendor', data: vendor, score: 1 });
        }
      });

      // Search receipts
      receipts.forEach(receipt => {
        if (
          receipt.display_id.toLowerCase().includes(searchLower) ||
          receipt.vendor_ref?.toLowerCase().includes(searchLower) ||
          receipt.vendor?.name.toLowerCase().includes(searchLower) ||
          receipt.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
          receipt.notes?.toLowerCase().includes(searchLower)
        ) {
          matchedResults.push({ type: 'receipt', data: receipt, score: 1 });
        }
      });

      // Search estimates
      estimates.forEach(estimate => {
        if (
          estimate.title.toLowerCase().includes(searchLower) ||
          estimate.display_id.toLowerCase().includes(searchLower) ||
          estimate.vendor_ref?.toLowerCase().includes(searchLower) ||
          estimate.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
          estimate.notes?.toLowerCase().includes(searchLower)
        ) {
          matchedResults.push({ type: 'estimate', data: estimate, score: 1 });
        }
      });

      setResults(matchedResults);
    } catch (err) {
      console.error('Search failed:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setError(null);
  };

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (query) handleSearch(query);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Search</h1>
        <p className="text-muted-foreground">
          Find vendors, receipts, and estimates
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <span className="font-medium">Error: {error}</span>
        </div>
      )}

      <div className="relative max-w-2xl">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search by vendor name, receipt number, or tag..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10 py-6 text-lg"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : hasSearched && results.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <SearchIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No results found</h2>
          <p className="text-muted-foreground">
            Try searching for a vendor name, receipt number, or tag
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((result) => (
            <SearchResultCard key={`${result.type}-${result.data.id}`} result={result} />
          ))}
        </div>
      )}
    </div>
  );
}

function SearchResultCard({ result }: { result: SearchResult }) {
  const navigate = useNavigate();

  if (result.type === 'vendor') {
    const vendor = result.data as Vendor;
    return (
      <Card
        className="hover:border-primary/50 transition-colors cursor-pointer group"
        onClick={() => navigate(`/vendors/${vendor.display_id}`)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">{vendor.name}</h3>
                <VendorTypeBadge type={vendor.type} />
              </div>
              <p className="text-sm text-muted-foreground">{vendor.display_id}</p>
              {vendor.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {vendor.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              )}
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (result.type === 'receipt') {
    const receipt = result.data as ReceiptType;
    return (
      <Card
        className="hover:border-primary/50 transition-colors cursor-pointer group"
        onClick={() => {
          if (receipt.vendor?.display_id) {
            navigate(`/vendors/${receipt.vendor.display_id}`);
          }
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold">{receipt.display_id}</h3>
                <Currency amount={receipt.total} className="font-semibold" />
              </div>
              <p className="text-sm text-muted-foreground">
                {(receipt as any).vendor?.name || 'Unknown vendor'} • {receipt.date}
              </p>
              {receipt.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {receipt.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              )}
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (result.type === 'estimate') {
    const estimate = result.data as Estimate;
    return (
      <Card
        className="hover:border-primary/50 transition-colors cursor-pointer group"
        onClick={() => {
          if (estimate.vendor?.display_id) {
            navigate(`/vendors/${estimate.vendor.display_id}`);
          }
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold">{estimate.title}</h3>
                <Currency amount={estimate.estimated_total} className="font-semibold" />
              </div>
              <p className="text-sm text-muted-foreground">
                {estimate.display_id} • {estimate.date}
              </p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
