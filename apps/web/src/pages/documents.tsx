import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  ExternalLink,
  Upload,
  Search,
  Trash2,
  Building2,
  Receipt,
  Calculator
} from 'lucide-react';
import { getAllDocuments, getDocumentPublicUrl, deleteDocument, getVendors } from '@/lib/supabase';
import type { Document, Vendor } from '@/types';
import { format } from 'date-fns';
import { DocumentUploadDialog } from '@/components/document-upload-dialog';

export function DocumentsPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [docsData, vendorsData] = await Promise.all([
        getAllDocuments(),
        getVendors()
      ]);
      setDocuments(docsData);
      setVendors(vendorsData);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await deleteDocument(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error('Failed to delete document:', err);
      alert('Failed to delete document');
    }
  };

  const getVendorName = (vendorId: string) => {
    const vendor = vendors.find(v => v.id === vendorId);
    return vendor?.name || 'Unknown Vendor';
  };

  const getDocumentType = (doc: Document) => {
    if (doc.receipt_id) return { label: 'Receipt', icon: Receipt, color: 'text-blue-500' };
    if (doc.estimate_id) return { label: 'Estimate', icon: Calculator, color: 'text-amber-500' };
    return { label: 'Vendor Doc', icon: Building2, color: 'text-emerald-500' };
  };

  const filteredDocuments = documents.filter(doc =>
    doc.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.original_file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.vendor_ref?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getVendorName(doc.vendor_id).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-1">
            All documents across vendors, estimates, and receipts
          </p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search documents by name, vendor, or reference..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-11"
        />
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">
              {searchQuery ? 'No documents found' : 'No documents yet'}
            </h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Upload documents from vendors, estimates, or receipts to see them here'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload First Document
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => {
            const docType = getDocumentType(doc);
            const Icon = docType.icon;

            return (
              <Card
                key={doc.id}
                className="group hover:shadow-md transition-shadow"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                      {doc.file_type.includes('pdf') ? (
                        <FileText className="h-6 w-6 text-red-500" />
                      ) : doc.file_type.includes('image') ? (
                        <div className="h-6 w-6 bg-blue-500 rounded" />
                      ) : (
                        <Icon className={`h-6 w-6 ${docType.color}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate" title={doc.display_name}>
                        {doc.display_name}
                      </h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {getVendorName(doc.vendor_id)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {docType.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(doc.file_size_bytes)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(getDocumentPublicUrl(doc.storage_path), '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    {doc.receipt_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/vendors/${doc.vendor_id}#receipt-${doc.receipt_id}`)}
                      >
                        <Receipt className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(doc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                    <span>{doc.display_id}</span>
                    <span>{format(new Date(doc.created_at), 'MMM d, yyyy')}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload Dialog */}
      <DocumentUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        vendors={vendors}
        onUploadComplete={fetchData}
      />
    </div>
  );
}
