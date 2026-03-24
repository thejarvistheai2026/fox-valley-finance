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
import { cn } from '@/lib/utils';

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
        console.log('Dashboard summary:', summaryData);

        const vendorsData = await getVendorSummaries(dateRangeParam);
        console.log('Vendor summaries:', vendorsData);

        // Fetch recent receipts (limit to 10)
        const receiptsData = await getReceipts(dateRangeParam ? { dateRange: dateRangeParam } : undefined);
        console.log('Receipts:', receiptsData);

        // RPC returns an array, get the first item
        setSummary(Array.isArray(summaryData) ? summaryData[0] : summaryData);
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
    <div className="space-y-8">
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl flex items-center gap-3">
          <span className="font-medium">{error}</span>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your project finances
          </p>
        </div>

        <div className="flex items-center gap-3">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
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
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Vendor Summary</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Vendor</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Estimated</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Paid</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Outstanding</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">HST Paid</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td className="py-4 px-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="py-4 px-4"><Skeleton className="h-4 w-20 ml-auto" /></td>
                      <td className="py-4 px-4"><Skeleton className="h-4 w-20 ml-auto" /></td>
                      <td className="py-4 px-4"><Skeleton className="h-4 w-20 ml-auto" /></td>
                      <td className="py-4 px-4"><Skeleton className="h-4 w-20 ml-auto" /></td>
                    </tr>
                  ))
                ) : (
                  vendors.map((vendor) => (
                    <tr key={vendor.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{vendor.name}</div>
                            <div className="text-xs text-muted-foreground">{vendor.display_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {vendor.type === 'contract' ? (
                          <span className="font-medium"><Currency amount={vendor.estimated_total || 0} /></span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-medium"><Currency amount={vendor.paid_total || 0} /></span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {vendor.type === 'contract' ? (
                          <span className={cn(
                            "font-medium",
                            (vendor.outstanding || 0) > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                          )}>
                            <Currency amount={vendor.outstanding || 0} />
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-sm"><Currency amount={vendor.tax_total || 0} /></span>
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
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-1">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))
            ) : recentReceipts.length === 0 ? (
              <div className="text-center py-12">
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Receipt className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No recent activity</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Receipts will appear here</p>
              </div>
            ) : (
              recentReceipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="flex items-center gap-4 p-3 -mx-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group"
                >
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/10 transition-all">
                    <Receipt className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{receipt.vendor?.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {receipt.payment_type && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-muted">{receipt.payment_type}</span>}
                      <span className="ml-2">{receipt.date}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      <Currency amount={receipt.total} />
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
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
  variant?: 'default' | 'warning' | 'success';
  trend?: string;
  trendUp?: boolean;
}

function SummaryCard({ title, value, icon: Icon, description, loading, variant = 'default', trend, trendUp }: SummaryCardProps) {
  const variantStyles = {
    default: 'bg-card border-border/50',
    warning: 'bg-gradient-to-br from-amber-50/80 to-orange-50/50 border-amber-200/50 dark:from-amber-950/30 dark:to-orange-950/20 dark:border-amber-800/50',
    success: 'bg-gradient-to-br from-emerald-50/80 to-teal-50/50 border-emerald-200/50 dark:from-emerald-950/30 dark:to-teal-950/20 dark:border-emerald-800/50',
  };

  const iconStyles = {
    default: 'bg-primary/10 text-primary',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  };

  return (
    <Card className={cn("border shadow-sm hover:shadow-md transition-shadow", variantStyles[variant])}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-xl", iconStyles[variant])}>
            <Icon className="h-5 w-5" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
            trendUp ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
          )}>
            {trendUp ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend}
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <Skeleton className="h-8 w-32" />
        ) : (
          <>
            <div className="text-3xl font-bold tracking-tight">
              <Currency amount={value} />
            </div>
            <p className="text-sm text-muted-foreground mt-1.5">{description}</p>
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
    <div className="flex items-center gap-4 p-5 border rounded-xl bg-card/50 hover:bg-card transition-colors shadow-sm">
      <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {loading ? (
          <Skeleton className="h-6 w-20 mt-1" />
        ) : (
          <p className="text-xl font-semibold tracking-tight mt-0.5">
            {isCurrency ? <Currency amount={value} /> : value.toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
