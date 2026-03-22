import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DollarSign, 
  Building2, 
  Receipt, 
  TrendingUp,
  TrendingDown,
  Download
} from 'lucide-react';
import { Currency } from '@/components/currency';
import { DateRangeFilter, useDateRange } from '@/components/date-range-filter';
import type { DashboardSummary, Receipt as ReceiptType, Vendor } from '@/types';
import { 
  getDashboardSummary, 
  getVendorSummaries, 
  getReceipts,
  generateCSVReceipts, 
  downloadCSV 
} from '@/lib/supabase';

export function DashboardPage() {
  const { dateRange, setDateRange } = useDateRange('All time');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [recentReceipts, setRecentReceipts] = useState<ReceiptType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        // Build date range for API
        const dateRangeParam = dateRange.label !== 'All time' ? {
          start: dateRange.start,
          end: dateRange.end
        } : undefined;
        
        // Fetch dashboard summary and vendor summaries
        const summaryData = await getDashboardSummary(dateRangeParam);
        const vendorsData = await getVendorSummaries(dateRangeParam);
        
        // Fetch recent receipts (limit to 10)
        const receiptsData = await getReceipts(dateRangeParam ? { dateRange: dateRangeParam } : undefined);
        
        setSummary(summaryData);
        setVendors(vendorsData || []);
        setRecentReceipts((receiptsData || []).slice(0, 10));
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [dateRange]);
  
  const handleExport = () => {
    const csv = generateCSVReceipts(recentReceipts);
    downloadCSV(csv, `receipts-${dateRange.label.replace(/\s+/g, '-').toLowerCase()}.csv`);
  };
  
  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <span className="font-medium">Error: {error}</span>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your project finances
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Estimated"
          value={summary?.total_estimated || 0}
          icon={TrendingUp}
          description="Across all contract vendors"
          loading={loading}
        />
        <SummaryCard
          title="Total Paid"
          value={summary?.total_paid || 0}
          icon={DollarSign}
          description={`In ${dateRange.label}`}
          loading={loading}
        />
        
        <SummaryCard
          title="Outstanding"
          value={summary?.total_outstanding || 0}
          icon={TrendingDown}
          description="Remaining to pay"
          loading={loading}
          variant="warning"
        />
        
        <SummaryCard
          title="Total HST Paid"
          value={summary?.total_tax || 0}
          icon={Receipt}
          description={`In ${dateRange.label}`}
          loading={loading}
        />
      </div>
      
      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Vendors"
          value={summary?.vendor_count || 0}
          icon={Building2}
          loading={loading}
        />
        <StatCard
          label="Receipts"
          value={summary?.receipt_count || 0}
          icon={Receipt}
          loading={loading}
        />
        <StatCard
          label="GST (Federal)"
          value={summary?.total_gst || 0}
          icon={Receipt}
          loading={loading}
          isCurrency
        />
        <StatCard
          label="Provincial Tax"
          value={summary?.total_pst || 0}
          icon={Receipt}
          loading={loading}
          isCurrency
        />
      </div>
      
      {/* Vendor Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 font-medium">Vendor</th>
                  <th className="text-right py-2 px-4 font-medium">Estimated</th>
                  <th className="text-right py-2 px-4 font-medium">Paid</th>
                  <th className="text-right py-2 px-4 font-medium">Outstanding</th>
                  <th className="text-right py-2 px-4 font-medium">HST Paid</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td className="py-2 px-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="py-2 px-4"><Skeleton className="h-4 w-20 ml-auto" /></td>
                      <td className="py-2 px-4"><Skeleton className="h-4 w-20 ml-auto" /></td>
                      <td className="py-2 px-4"><Skeleton className="h-4 w-20 ml-auto" /></td>
                      <td className="py-2 px-4"><Skeleton className="h-4 w-20 ml-auto" /></td>
                    </tr>
                  ))
                ) : (
                  vendors.map((vendor) => (
                    <tr key={vendor.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{vendor.name}</div>
                        <div className="text-xs text-muted-foreground">{vendor.display_id}</div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {vendor.type === 'contract' ? (
                          <Currency amount={vendor.estimated_total || 0} />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Currency amount={vendor.paid_total || 0} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        {vendor.type === 'contract' ? (
                          <Currency amount={vendor.outstanding || 0} />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Currency amount={vendor.tax_total || 0} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))
            ) : recentReceipts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No recent activity
              </p>
            ) : (
              recentReceipts.map((receipt) => (
                <div key={receipt.id} className="flex items-center gap-4 py-2 border-b last:border-0">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Receipt className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{receipt.vendor?.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {receipt.payment_type && `${receipt.payment_type} • `}
                      {receipt.date}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      <Currency amount={receipt.total} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {receipt.display_id}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  description: string;
  loading: boolean;
  variant?: 'default' | 'warning';
}

function SummaryCard({ title, value, icon: Icon, description, loading, variant = 'default' }: SummaryCardProps) {
  return (
    <Card className={variant === 'warning' ? 'border-amber-200 bg-amber-50/50' : ''}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-32" />
        ) : (
          <>
            <div className="text-2xl font-bold">
              <Currency amount={value} />
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  loading: boolean;
  isCurrency?: boolean;
}

function StatCard({ label, value, icon: Icon, loading, isCurrency }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 p-4 border rounded-lg">
      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        {loading ? (
          <Skeleton className="h-6 w-20" />
        ) : (
          <p className="text-lg font-semibold">
            {isCurrency ? <Currency amount={value} /> : value.toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
