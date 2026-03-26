import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DollarSign,
  Receipt,
  TrendingUp,
  TrendingDown,
  Download,
  Trash2,
  Eye,
  FileText,
  ArrowRight,
  StickyNote,
  Store
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Currency } from '@/components/currency';
import { DateRangeFilter, useDateRange } from '@/components/date-range-filter';
import type { DashboardSummary, Receipt as ReceiptType, Document } from '@/types';
import {
  getDashboardSummary,
  getReceipts,
  getAllDocuments,
  getDocumentViewUrl,
  getDocumentPublicUrl,
  downloadDocument,
  deleteDocument
} from '@/lib/supabase';
import { cn } from '@/lib/utils';

export function DashboardPage() {
  const navigate = useNavigate();
  const { dateRange, setDateRange } = useDateRange('All time');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentReceipts, setRecentReceipts] = useState<ReceiptType[]>([]);
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [selectedDocumentForNotes, setSelectedDocumentForNotes] = useState<Document | null>(null);
  
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
        
        // Fetch dashboard summary
        const summaryData = await getDashboardSummary(dateRangeParam);
        console.log('Dashboard summary:', summaryData);

        // Fetch recent receipts (limit to 10)
        const receiptsData = await getReceipts(dateRangeParam ? { dateRange: dateRangeParam } : undefined);
        console.log('Receipts:', receiptsData);

        // Fetch recent documents (limit to 5)
        const documentsData = await getAllDocuments({ limit: 5 });
        console.log('Documents:', documentsData);

        // RPC returns an array, get the first item
        setSummary(Array.isArray(summaryData) ? summaryData[0] : summaryData);
        setRecentReceipts((receiptsData || []).slice(0, 10));
        setRecentDocuments(documentsData || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [dateRange]);
  
  const handleViewDocument = async (storagePath: string, fileType: string) => {
    // Images use /render/image/public/, PDFs use signed URLs
    const isImage = fileType?.includes('image') || storagePath.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    if (isImage) {
      const imageUrl = getDocumentPublicUrl(storagePath);
      window.open(imageUrl, '_blank');
    } else {
      // PDFs need signed URLs
      try {
        const signedUrl = await getDocumentViewUrl(storagePath);
        window.open(signedUrl, '_blank');
      } catch (err) {
        console.error('Failed to get document URL:', err);
        alert('Failed to open document');
      }
    }
  };

  const handleDownloadDocument = async (storagePath: string, fileName: string) => {
    try {
      await downloadDocument(storagePath, fileName);
    } catch (err) {
      console.error('Failed to download document:', err);
      alert('Failed to download document');
    }
  };

  const handleDeleteDocument = (id: string) => {
    setDocumentToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleViewNotes = (doc: Document) => {
    setSelectedDocumentForNotes(doc);
    setNotesDialogOpen(true);
  };

  const confirmDeleteDocument = async () => {
    if (!documentToDelete) return;
    try {
      await deleteDocument(documentToDelete);
      setRecentDocuments(prev => prev.filter(d => d.id !== documentToDelete));
    } catch (err) {
      console.error('Failed to delete document:', err);
      alert('Failed to delete document');
    } finally {
      setDeleteConfirmOpen(false);
      setDocumentToDelete(null);
    }
  };
  
  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl flex items-center gap-3">
          <span className="font-medium">{error}</span>
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Overview of your project finances
          </p>
        </div>

        <div className="flex items-center gap-3">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        <SummaryCard
          title="Total - All Estimates"
          value={summary?.total_estimated || 0}
          icon={TrendingUp}
          description="Draft + In Progress"
          loading={loading}
        />
        <SummaryCard
          title="Total - In-Progress"
          value={summary?.current_total_estimate || 0}
          icon={TrendingUp}
          description="Active estimates"
          loading={loading}
          variant="success"
        />
        <SummaryCard
          title="Total Paid"
          value={summary?.total_paid || 0}
          icon={DollarSign}
          description="Receipts to active estimates"
          loading={loading}
        />

        <SummaryCard
          title="Outstanding"
          value={summary?.total_outstanding || 0}
          icon={TrendingDown}
          description="In-Progress minus Paid"
          loading={loading}
          variant="warning"
        />

        <SummaryCard
          title="Total - Individual Receipts"
          value={summary?.total_individual_receipts || 0}
          icon={Store}
          description="Retail (no estimate)"
          loading={loading}
          variant="info"
        />

        <SummaryCard
          title="Total - HST (Individual)"
          value={summary?.total_hst_individual_receipts || 0}
          icon={Receipt}
          description="HST from retail receipts"
          loading={loading}
        />

        <SummaryCard
          title="Total - HST (Estimates)"
          value={summary?.total_hst_estimates || 0}
          icon={Receipt}
          description="HST from completed estimates"
          loading={loading}
          variant="success"
        />
      </div>
      
      {/* Two Column Layout: Recent Activity & Documents */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
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
                    className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 -mx-2 sm:-mx-3 rounded-xl hover:bg-muted/50 transition-colors group"
                  >
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/10 transition-all flex-shrink-0">
                      <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-sm sm:text-base">{receipt.vendor?.name}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground flex flex-wrap items-center gap-1 sm:gap-2">
                        {receipt.payment_type && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-muted">{receipt.payment_type}</span>}
                        <span>{receipt.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <div className="text-right mr-1 sm:mr-2">
                        <div className="font-semibold text-sm sm:text-base">
                          <Currency amount={receipt.total} />
                        </div>
                        <div className="text-xs text-muted-foreground font-medium hidden sm:block">
                          {receipt.display_id}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0"
                        onClick={() => navigate(`/vendors/${receipt.vendor?.display_id}`)}
                        title="Go to vendor"
                      >
                        <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Documents */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Recent Documents</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/documents')}>
              View All
            </Button>
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
              ) : recentDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">No documents yet</p>
                  <p className="text-sm text-muted-foreground/60 mt-1">Upload documents from vendors</p>
                </div>
              ) : (
                recentDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 -mx-2 sm:-mx-3 rounded-xl hover:bg-muted/50 transition-colors group"
                  >
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center group-hover:from-emerald-200 group-hover:to-emerald-100 transition-all flex-shrink-0">
                      {doc.file_type.includes('pdf') ? (
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                      ) : (
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-sm sm:text-base" title={doc.display_name}>{doc.display_name}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground truncate">
                        {doc.vendor?.name}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8"
                        onClick={() => handleViewDocument(doc.storage_path, doc.file_type)}
                        title="View document"
                      >
                        <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8"
                        onClick={() => handleViewNotes(doc)}
                        title="View notes"
                      >
                        <StickyNote className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8"
                        onClick={() => handleDownloadDocument(doc.storage_path, doc.display_name)}
                        title="Download document"
                      >
                        <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteDocument(doc.id)}
                        title="Delete document"
                      >
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteDocument}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Document Notes</DialogTitle>
            <DialogDescription>
              {selectedDocumentForNotes?.display_name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedDocumentForNotes?.notes ? (
              <p className="text-sm text-foreground whitespace-pre-wrap">{selectedDocumentForNotes.notes}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No notes added to this document.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  description: string;
  loading: boolean;
  variant?: 'default' | 'warning' | 'success' | 'info';
  trend?: string;
  trendUp?: boolean;
}

function SummaryCard({ title, value, icon: Icon, description, loading, variant = 'default', trend, trendUp }: SummaryCardProps) {
  const variantStyles = {
    default: 'bg-card border-border/50',
    warning: 'bg-gradient-to-br from-amber-50/80 to-orange-50/50 border-amber-200/50 dark:from-amber-950/30 dark:to-orange-950/20 dark:border-amber-800/50',
    success: 'bg-gradient-to-br from-emerald-50/80 to-teal-50/50 border-emerald-200/50 dark:from-emerald-950/30 dark:to-teal-950/20 dark:border-emerald-800/50',
    info: 'bg-gradient-to-br from-blue-50/80 to-cyan-50/50 border-blue-200/50 dark:from-blue-950/30 dark:to-cyan-950/20 dark:border-blue-800/50',
  };

  const iconStyles = {
    default: 'bg-primary/10 text-primary',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  };

  return (
    <Card className={cn("border shadow-sm hover:shadow-md transition-shadow", variantStyles[variant])}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={cn("p-2 sm:p-2.5 rounded-xl flex-shrink-0", iconStyles[variant])}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <span className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</span>
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
          <Skeleton className="h-6 sm:h-8 w-24 sm:w-32" />
        ) : (
          <>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
              <Currency amount={value} />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">{description}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

