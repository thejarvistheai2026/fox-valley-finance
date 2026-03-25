import { useState, useEffect } from 'react'; // Deploy timestamp: 2026-03-25
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  ArrowLeft,
  FileText,
  Receipt as ReceiptIcon,
  Upload,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit,
  ExternalLink,
  Trash2,
  Link2Off,
  Eye,
  Download,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { VendorTypeBadge, ReceiptStatusBadge } from '@/components/badge';
import { Currency } from '@/components/currency';
import { VendorFormDialog } from '@/components/vendor-form';
import { EstimateFormDialog } from '@/components/estimate-form';
import { ReceiptFormDialog } from '@/components/receipt-form';
import { DocumentUploadDialog } from '@/components/document-upload-dialog';
import { getVendorByDisplayId, getEstimates, getReceipts, getDocuments, getDocumentByReceiptId, createEstimate, updateEstimate, createReceipt, createDocument, uploadDocument, getDocumentPublicUrl, updateVendor, deleteDocument } from '@/lib/supabase';
import type { Vendor, Estimate, Receipt, Document } from '@/types';


export function VendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [receiptDocument, setReceiptDocument] = useState<Document | null>(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [documentUploadOpen, setDocumentUploadOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVendorData() {
      if (!id) return;

      setLoading(true);
      try {
        // Fetch vendor by display_id (e.g., "VEN-0005")
        const vendorData = await getVendorByDisplayId(id);
        setVendor(vendorData);

        // Fetch related data
        const [estimatesData, receiptsData, docsData] = await Promise.all([
          getEstimates(vendorData.id),
          getReceipts({ vendorId: vendorData.id }),
          getDocuments(vendorData.id),
        ]);

        setEstimates(estimatesData);
        setReceipts(receiptsData);
        setDocuments(docsData);
      } catch (err) {
        console.error('Failed to fetch vendor:', err);
        setVendor(null);
      } finally {
        setLoading(false);
      }
    }

    fetchVendorData();
  }, [id]);

  // Fetch document when viewing a receipt
  useEffect(() => {
    async function fetchReceiptDocument() {
      if (selectedReceipt) {
        try {
          const doc = await getDocumentByReceiptId(selectedReceipt.id);
          setReceiptDocument(doc);
        } catch (err) {
          console.error('Failed to fetch receipt document:', err);
          setReceiptDocument(null);
        }
      }
    }
    fetchReceiptDocument();
  }, [selectedReceipt, receiptDialogOpen]);

  const handleUpdateVendor = async (data: Omit<Vendor, 'id' | 'display_id' | 'project_id' | 'created_at' | 'updated_at'>) => {
    if (!vendor) return;
    try {
      const updatedVendor = await updateVendor(vendor.id, data);
      setVendor(updatedVendor);
    } catch (err) {
      console.error('Failed to update vendor:', err);
      alert('Failed to update vendor: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const [estimateError, setEstimateError] = useState<string | null>(null);

  const handleCreateEstimate = async (
    data: Omit<Estimate, 'id' | 'display_id' | 'project_id' | 'vendor_id' | 'created_at' | 'updated_at'>,
    file?: File | null
  ) => {
    if (!vendor) return;

    setEstimateError(null);
    try {
      // Create the estimate first
      const newEstimate = await createEstimate({
        ...data,
        vendor_id: vendor.id,
      });

      // If there's a file, upload it and create a document
      if (file) {
        console.log('File to upload:', file.name, file.size, file.type);
        try {
          const { path } = await uploadDocument(
            file,
            vendor.project_id,
            'estimates',
            newEstimate.id
          );
          console.log('File uploaded successfully to:', path);

          await createDocument({
            project_id: vendor.project_id,
            vendor_id: vendor.id,
            estimate_id: newEstimate.id,
            display_name: file.name,
            original_file_name: file.name,
            storage_path: path,
            file_type: file.type,
            file_size_bytes: file.size,
            tags: [],
          });
          console.log('Document record created');

          // Refresh documents
          const docsData = await getDocuments(vendor.id);
          setDocuments(docsData);
        } catch (uploadErr) {
          console.error('Upload failed:', uploadErr);
          alert('File upload failed: ' + (uploadErr instanceof Error ? uploadErr.message : 'Unknown error'));
        }
      }

      // Refresh estimates list
      const estimatesData = await getEstimates(vendor.id);
      setEstimates(estimatesData);
    } catch (err) {
      console.error('Failed to create estimate:', err);
      setEstimateError(err instanceof Error ? err.message : 'Failed to create estimate');
    }
  };

  const handleUpdateEstimate = async (
    estimateId: string,
    data: Omit<Estimate, 'id' | 'display_id' | 'project_id' | 'vendor_id' | 'created_at' | 'updated_at'>,
    file?: File | null
  ) => {
    if (!vendor) return;

    setEstimateError(null);
    try {
      // Update the estimate
      await updateEstimate(estimateId, {
        ...data,
        vendor_id: vendor.id,
      });

      // If there's a file, upload it and create a document
      if (file) {
        const { path } = await uploadDocument(
          file,
          vendor.project_id,
          'estimates',
          estimateId
        );

        await createDocument({
          project_id: vendor.project_id,
          vendor_id: vendor.id,
          estimate_id: estimateId,
          display_name: file.name.replace(/\\.[^/.]+$/, ''),
          original_file_name: file.name,
          storage_path: path,
          file_type: file.type,
          file_size_bytes: file.size,
          tags: [],
        });

        // Refresh documents
        const docsData = await getDocuments(vendor.id);
        setDocuments(docsData);
      }

      // Refresh estimates list
      const estimatesData = await getEstimates(vendor.id);
      setEstimates(estimatesData);
    } catch (err) {
      console.error('Failed to update estimate:', err);
      setEstimateError(err instanceof Error ? err.message : 'Failed to update estimate');
    }
  };

  const handleCreateReceipt = async (
    data: Omit<Receipt, 'id' | 'display_id' | 'project_id' | 'vendor_id' | 'created_at' | 'updated_at' | 'status' | 'created_by' | 'tax_total'>,
    file?: File | null
  ) => {
    if (!vendor) return;

    console.log('Creating receipt with data:', data);
    console.log('estimate_id:', data.estimate_id);
    console.log('File received:', file);

    try {
      const receiptData = {
        ...data,
        vendor_id: vendor.id,
        status: 'confirmed' as const,
      };
      console.log('Sending to createReceipt:', receiptData);
      const newReceipt = await createReceipt(receiptData);

      // If there's a file, upload it and create a document
      if (file) {
        console.log('Uploading file:', file.name);
        const { path } = await uploadDocument(
          file,
          vendor.project_id,
          'receipts',
          newReceipt.id
        );

        console.log('File uploaded to:', path);

        try {
          const newDoc = await createDocument({
            project_id: vendor.project_id,
            vendor_id: vendor.id,
            receipt_id: newReceipt.id,
            display_name: file.name,
            original_file_name: file.name,
            storage_path: path,
            file_type: file.type,
            file_size_bytes: file.size,
            tags: [],
          });
          console.log('Document record created:', newDoc);
        } catch (docErr) {
          console.error('Failed to create document record:', docErr);
          alert('Receipt created but document metadata failed: ' + (docErr instanceof Error ? docErr.message : 'Unknown error'));
        }
      }

      // Refresh receipts list
      const receiptsData = await getReceipts({ vendorId: vendor.id });
      setReceipts(receiptsData);

      // Refresh documents to include the new receipt document
      const docsData = await getDocuments(vendor.id);
      setDocuments(docsData);

      // Refresh estimates to update paid/outstanding amounts
      const estimatesData = await getEstimates(vendor.id);
      setEstimates(estimatesData);
    } catch (err) {
      console.error('Failed to create receipt:', err);
      alert('Failed to create receipt: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleViewReceipt = async (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setReceiptDialogOpen(true);

    // Try to find associated document
    try {
      const docs = await getDocuments(vendor!.id);
      const receiptDoc = docs.find(d => d.receipt_id === receipt.id);
      setReceiptDocument(receiptDoc || null);
    } catch (err) {
      console.error('Failed to fetch receipt document:', err);
      setReceiptDocument(null);
    }
  };

  const handleDeleteEstimate = async (estimateId: string) => {
    if (!vendor) return;
    if (!confirm('Are you sure you want to delete this estimate? This will also unlink any associated receipts.')) return;

    try {
      const { deleteEstimate } = await import('@/lib/supabase');
      await deleteEstimate(estimateId);
      // Refresh estimates
      const estimatesData = await getEstimates(vendor.id);
      setEstimates(estimatesData);
      // Refresh receipts (in case any were unlinked)
      const receiptsData = await getReceipts({ vendorId: vendor.id });
      setReceipts(receiptsData);
    } catch (err) {
      console.error('Failed to delete estimate:', err);
      alert('Failed to delete estimate: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleDeleteReceipt = async (receiptId: string) => {
    if (!vendor) return;
    if (!confirm('Are you sure you want to delete this receipt?')) return;

    try {
      const { deleteReceipt } = await import('@/lib/supabase');
      await deleteReceipt(receiptId);
      // Refresh receipts
      const receiptsData = await getReceipts({ vendorId: vendor.id });
      setReceipts(receiptsData);
      // Close dialog if open
      setReceiptDialogOpen(false);
      setSelectedReceipt(null);
    } catch (err) {
      console.error('Failed to delete receipt:', err);
      alert('Failed to delete receipt: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleUnlinkReceipt = async (receiptId: string) => {
    if (!vendor) return;
    if (!confirm('Unlink this receipt from the estimate? The receipt will still be available.')) return;

    try {
      const { unlinkReceiptFromEstimate } = await import('@/lib/supabase');
      await unlinkReceiptFromEstimate(receiptId);
      // Refresh receipts
      const receiptsData = await getReceipts({ vendorId: vendor.id });
      setReceipts(receiptsData);
    } catch (err) {
      console.error('Failed to unlink receipt:', err);
      alert('Failed to unlink receipt: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleDeleteDocument = (documentId: string) => {
    setDocumentToDelete(documentId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteDocument = async () => {
    if (!vendor || !documentToDelete) return;

    try {
      await deleteDocument(documentToDelete);
      // Refresh documents
      const docsData = await getDocuments(vendor.id);
      setDocuments(docsData);
    } catch (err) {
      console.error('Failed to delete document:', err);
      alert('Failed to delete document: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setDeleteConfirmOpen(false);
      setDocumentToDelete(null);
    }
  };

  const handleDocumentsUpdated = async () => {
    if (!vendor) return;
    const docsData = await getDocuments(vendor.id);
    setDocuments(docsData);
  };

  const getLinkedReceipts = (estimateId: string) => {
    return receipts.filter(r => r.estimate_id === estimateId);
  };

  const getUnlinkedReceipts = () => {
    return receipts.filter(r => !r.estimate_id);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold mb-2">Vendor not found</h2>
        <p className="text-muted-foreground mb-4">The vendor you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/vendors')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Vendors
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {estimateError && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <span className="font-medium">Error: {estimateError}</span>
        </div>
      )}

      {/* Back Navigation */}
      <Button variant="ghost" onClick={() => navigate('/vendors')} className="-ml-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Vendors
      </Button>

      {/* Header with Contact Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold">{vendor.name}</h1>
                <VendorTypeBadge type={vendor.type} />
                {vendor.is_archived && (
                  <Badge variant="secondary">Archived</Badge>
                )}
              </div>
              <p className="text-muted-foreground">{vendor.display_id}</p>
            </div>
            
            <div className="flex gap-2">
              <VendorFormDialog 
                vendor={vendor} 
                onSubmit={handleUpdateVendor}
                trigger={
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                }
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Contact Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {vendor.contact_name && (
              <div className="flex items-start gap-2">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Contact</p>
                  <p className="text-sm text-muted-foreground">{vendor.contact_name}</p>
                </div>
              </div>
            )}
            
            {vendor.phone && (
              <a 
                href={`tel:${vendor.phone}`}
                className="flex items-start gap-2 hover:text-primary transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{vendor.phone}</p>
                </div>
              </a>
            )}
            
            {vendor.email && (
              <a
                href={`mailto:${vendor.email}`}
                className="flex items-start gap-2 hover:text-primary transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground truncate max-w-[150px]">{vendor.email}</p>
                </div>
              </a>
            )}

            {vendor.website && (
              <a
                href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 hover:text-primary transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Website</p>
                  <p className="text-sm text-muted-foreground truncate max-w-[150px]">{vendor.website.replace(/^https?:\/\//, '')}</p>
                </div>
              </a>
            )}

            {vendor.address && (
              <div className="flex items-start gap-2">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">{vendor.address}</p>
                </div>
              </div>
            )}
          </div>
          
          {vendor.notes && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">{vendor.notes}</p>
            </div>
          )}
          
          {vendor.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {vendor.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Summary Bar */}
      {(() => {
        // Calculate totals dynamically from estimates and receipts
        const totalEstimated = vendor.type === 'contract'
          ? estimates.reduce((sum, e) => sum + (e.estimated_total || 0), 0)
          : 0;
        const totalPaid = receipts.reduce((sum, r) => sum + (r.total || 0), 0);
        const totalTax = receipts.reduce((sum, r) => sum + (r.tax_total || 0), 0);
        const outstanding = vendor.type === 'contract'
          ? totalEstimated - totalPaid
          : 0;

        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {vendor.type === 'contract' && (
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total Estimated</p>
                  <p className="text-2xl font-bold">
                    <Currency amount={totalEstimated} />
                  </p>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold">
                  <Currency amount={totalPaid} />
                </p>
              </CardContent>
            </Card>
            {vendor.type === 'contract' && (
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Outstanding</p>
                  <p className="text-2xl font-bold text-amber-600">
                    <Currency amount={outstanding} />
                  </p>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">HST Paid</p>
                <p className="text-2xl font-bold">
                  <Currency amount={totalTax} />
                </p>
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* Vendor Type Specific Layout */}
      {vendor.type === 'contract' ? (
        <ContractVendorLayout
          vendor={vendor}
          estimates={estimates}
          documents={documents}
          onCreateEstimate={handleCreateEstimate}
          onUpdateEstimate={handleUpdateEstimate}
          onCreateReceipt={handleCreateReceipt}
          getLinkedReceipts={getLinkedReceipts}
          getUnlinkedReceipts={getUnlinkedReceipts}
          onViewReceipt={handleViewReceipt}
          onDeleteEstimate={handleDeleteEstimate}
          onDeleteReceipt={handleDeleteReceipt}
          onUnlinkReceipt={handleUnlinkReceipt}
        />
      ) : (
        <RetailVendorLayout
          vendor={vendor}
          receipts={receipts}
          documents={documents}
          onCreateReceipt={handleCreateReceipt}
          onViewReceipt={handleViewReceipt}
          onDeleteReceipt={handleDeleteReceipt}
        />
      )}

      {/* Documents Section (Both Types) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Documents</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setDocumentUploadOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-xl bg-muted/20">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No documents uploaded yet</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setDocumentUploadOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload First Document
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => {
                const docUrl = doc.storage_path ? getDocumentPublicUrl(doc.storage_path) : null;
                return (
                <div
                  key={doc.id}
                  className="border rounded-xl p-4 hover:border-primary/50 hover:shadow-sm transition-all bg-card"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                      {doc.file_type?.includes('pdf') ? (
                        <FileText className="h-5 w-5 text-red-500" />
                      ) : (
                        <ReceiptIcon className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.display_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.display_id} • {formatFileSize(doc.file_size_bytes)}
                      </p>
                      {doc.estimate_id && (
                        <p className="text-xs text-muted-foreground">
                          Linked to {estimates.find(e => e.id === doc.estimate_id)?.display_id}
                        </p>
                      )}
                      {doc.receipt_id && (
                        <p className="text-xs text-muted-foreground">
                          Receipt: {receipts.find(r => r.id === doc.receipt_id)?.display_id}
                        </p>
                      )}
                      {doc.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{doc.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 pt-3 border-t">
                    {docUrl ? (
                      <a
                        href={docUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View
                      </a>
                    ) : (
                      <span className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md border border-input bg-muted text-muted-foreground cursor-not-allowed">
                        No file attached
                      </span>
                    )}
                    {docUrl && (
                      <a
                        href={docUrl}
                        download={doc.display_name}
                        className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-destructive hover:text-destructive-foreground transition-colors text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )})}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Upload Dialog */}
      {vendor && (
        <DocumentUploadDialog
          open={documentUploadOpen}
          onOpenChange={setDocumentUploadOpen}
          vendors={[vendor]}
          defaultVendorId={vendor.id}
          onUploadComplete={handleDocumentsUpdated}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteDocument}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Detail Dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedReceipt?.display_id}</DialogTitle>
            <DialogDescription>
              Receipt details and attached document
            </DialogDescription>
          </DialogHeader>
          {selectedReceipt && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Vendor Reference</Label>
                  <p className="font-medium">{selectedReceipt.vendor_ref || 'N/A'}</p>
                </div>
                <div>
                  <Label>Date</Label>
                  <p className="font-medium">{selectedReceipt.date}</p>
                </div>
                <div>
                  <Label>Subtotal</Label>
                  <p className="font-medium"><Currency amount={selectedReceipt.subtotal} /></p>
                </div>
                <div>
                  <Label>GST/HST</Label>
                  <p className="font-medium"><Currency amount={selectedReceipt.gst_amount} /></p>
                </div>
                <div>
                  <Label>PST/QST</Label>
                  <p className="font-medium"><Currency amount={selectedReceipt.pst_amount} /></p>
                </div>
                <div>
                  <Label>Total</Label>
                  <p className="font-medium text-lg"><Currency amount={selectedReceipt.total} /></p>
                </div>
                {selectedReceipt.payment_type && (
                  <div>
                    <Label>Payment Type</Label>
                    <Badge variant="outline" className="capitalize mt-1">
                      {selectedReceipt.payment_type}
                    </Badge>
                  </div>
                )}
              </div>
              {selectedReceipt.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedReceipt.notes}</p>
                </div>
              )}
              {selectedReceipt.tags?.length > 0 && (
                <div>
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedReceipt.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {receiptDocument ? (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <Label>Attached Document</Label>
                  <div className="flex items-center gap-3 mt-2">
                    {receiptDocument.file_type.includes('pdf') ? (
                      <FileText className="h-8 w-8 text-red-500" />
                    ) : (
                      <ReceiptIcon className="h-8 w-8 text-blue-500" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{receiptDocument.display_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(receiptDocument.file_size_bytes)}
                      </p>
                    </div>
                    <a
                      href={getDocumentPublicUrl(receiptDocument.storage_path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View
                    </a>
                    <a
                      href={getDocumentPublicUrl(receiptDocument.storage_path)}
                      download={receiptDocument.display_name}
                      className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg p-4 bg-muted/30 text-center">
                  <ReceiptIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No document attached</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex gap-2">
            {selectedReceipt && vendor && (
              <ReceiptFormDialog
                vendorId={vendor.id}
                vendorType={vendor.type}
                taxProvince={vendor.tax_province}
                estimates={estimates}
                receipt={selectedReceipt}
                onSubmit={async (data, _file) => {
                  // Close view dialog first
                  setReceiptDialogOpen(false);
                  // Update the receipt
                  const { updateReceipt } = await import('@/lib/supabase');
                  await updateReceipt(selectedReceipt.id, data);
                  // Refresh receipts
                  const receiptsData = await getReceipts({ vendorId: vendor.id });
                  setReceipts(receiptsData);
                }}
                trigger={
                  <Button variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Receipt
                  </Button>
                }
              />
            )}
            <Button variant="outline" onClick={() => setReceiptDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Contract Vendor Layout Component
interface ContractVendorLayoutProps {
  vendor: Vendor;
  estimates: Estimate[];
  documents: Document[];
  onCreateEstimate: (data: Omit<Estimate, 'id' | 'display_id' | 'project_id' | 'vendor_id' | 'created_at' | 'updated_at'>) => void;
  onUpdateEstimate: (estimateId: string, data: Omit<Estimate, 'id' | 'display_id' | 'project_id' | 'vendor_id' | 'created_at' | 'updated_at'>, file?: File | null) => void;
  onCreateReceipt: (data: Omit<Receipt, 'id' | 'display_id' | 'project_id' | 'vendor_id' | 'created_at' | 'updated_at' | 'status' | 'created_by' | 'tax_total'>, file?: File | null) => void;
  getLinkedReceipts: (estimateId: string) => Receipt[];
  getUnlinkedReceipts: () => Receipt[];
  onViewReceipt: (receipt: Receipt) => void;
  onDeleteEstimate: (estimateId: string) => void;
  onDeleteReceipt: (receiptId: string) => void;
  onUnlinkReceipt: (receiptId: string) => void;
}

function ContractVendorLayout({
  vendor,
  estimates,
  documents: _documents,
  onCreateEstimate,
  onUpdateEstimate,
  onCreateReceipt,
  getLinkedReceipts,
  getUnlinkedReceipts,
  onViewReceipt,
  onDeleteEstimate,
  onDeleteReceipt,
  onUnlinkReceipt,
}: ContractVendorLayoutProps) {
  const [expandedEstimate, setExpandedEstimate] = useState<string | null>(null);
  const [editingEstimate, setEditingEstimate] = useState<Estimate | null>(null);
  const unlinkedReceipts = getUnlinkedReceipts();

  return (
    <>
      {/* Estimates Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Estimates</CardTitle>
          <EstimateFormDialog
            vendorId={vendor.id}
            onSubmit={onCreateEstimate}
            trigger={
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Estimate
              </Button>
            }
          />
        </CardHeader>
        <CardContent>
          {estimates.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No estimates yet. Add your first estimate to track costs.
            </p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full table-fixed">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left py-2 px-4 font-medium w-10"></th>
                    <th className="text-left py-2 px-4 font-medium w-20">ID</th>
                    <th className="text-left py-2 px-4 font-medium w-24">Vendor Ref</th>
                    <th className="text-left py-2 px-4 font-medium w-40">Title</th>
                    <th className="text-left py-2 px-4 font-medium w-28">Date</th>
                    <th className="text-right py-2 px-4 font-medium w-24">Est. Total</th>
                    <th className="text-right py-2 px-4 font-medium w-20">Paid</th>
                    <th className="text-right py-2 px-4 font-medium w-24">Outstanding</th>
                    <th className="text-center py-2 px-4 font-medium w-20">Status</th>
                    <th className="text-center py-2 px-4 font-medium w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {estimates.map((estimate) => {
                    const linkedReceipts = getLinkedReceipts(estimate.id);
                    const isExpanded = expandedEstimate === estimate.id;
                    
                    return (
                      <>
                        <tr
                          key={estimate.id}
                          className="border-t hover:bg-muted/50 cursor-pointer"
                          onClick={() => setExpandedEstimate(isExpanded ? null : estimate.id)}
                        >
                          <td className="py-3 px-4">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </td>
                          <td className="py-3 px-4 font-medium">{estimate.display_id}</td>
                          <td className="py-3 px-4 text-muted-foreground">{estimate.vendor_ref}</td>
                          <td className="py-3 px-4">{estimate.title}</td>
                          <td className="py-3 px-4 text-muted-foreground">{estimate.date}</td>
                          <td className="py-3 px-4 text-right">
                            <Currency amount={estimate.estimated_total} />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Currency amount={estimate.paid_to_date || 0} />
                          </td>
                          <td className="py-3 px-4 text-right font-medium">
                            <Currency amount={estimate.outstanding || 0} />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Badge
                                variant={estimate.status === 'active' ? 'default' : 'secondary'}
                                className={
                                  estimate.status === 'active' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' :
                                  estimate.status === 'revised' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' :
                                  'bg-red-100 text-red-800 hover:bg-red-100'
                                }
                              >
                                {estimate.status === 'active' ? 'Active' : estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1)}
                              </Badge>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Find document attached to this estimate
                                  const estimateDoc = _documents.find((d: Document) => d.estimate_id === estimate.id);
                                  if (estimateDoc?.storage_path) {
                                    window.open(getDocumentPublicUrl(estimateDoc.storage_path), '_blank');
                                  } else {
                                    // No document - expand row to show details
                                    setExpandedEstimate(estimate.id);
                                  }
                                }}
                                title={_documents.find((d: Document) => d.estimate_id === estimate.id)?.storage_path ? "View attached document" : "View estimate"}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingEstimate(estimate);
                                }}
                                title="Edit estimate"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteEstimate(estimate.id);
                                }}
                                title="Delete estimate"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={10} className="bg-muted/30 p-4">
                              <div className="space-y-4">
                                <h4 className="font-medium">Linked Receipts</h4>
                                {linkedReceipts.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">
                                    No receipts linked to this estimate yet.
                                  </p>
                                ) : (
                                  <table className="w-full text-sm table-fixed">
                                    <thead>
                                      <tr className="border-b">
                                        <th className="text-left py-2 px-4 font-medium w-10"></th>
                                        <th className="text-left py-2 px-4 font-medium w-20">ID</th>
                                        <th className="text-left py-2 px-4 font-medium w-24">Vendor Ref</th>
                                        <th className="text-left py-2 px-4 font-medium w-40">Type</th>
                                        <th className="text-left py-2 px-4 font-medium w-28">Date</th>
                                        <th className="text-right py-2 px-4 font-medium w-24">Total</th>
                                        <th className="text-right py-2 px-4 font-medium w-20">HST</th>
                                        <th className="text-right py-2 px-4 font-medium w-24"></th>
                                        <th className="text-center py-2 px-4 font-medium w-20">Status</th>
                                        <th className="text-center py-2 px-4 font-medium w-24">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {linkedReceipts.map((receipt) => (
                                        <tr key={receipt.id} className="border-b last:border-0">
                                          <td className="py-2 px-4"></td>
                                          <td className="py-2 px-4">
                                            <span className="font-medium text-sm">
                                              {receipt.display_id}
                                            </span>
                                          </td>
                                          <td className="py-2 px-4 text-muted-foreground">{receipt.vendor_ref}</td>
                                          <td className="py-2 px-4">
                                            {receipt.payment_type && (
                                              <Badge variant="outline" className="capitalize text-xs">
                                                {receipt.payment_type}
                                              </Badge>
                                            )}
                                          </td>
                                          <td className="py-2 px-4 text-muted-foreground">{receipt.date}</td>
                                          <td className="py-2 px-4 text-right">
                                            <Currency amount={receipt.total} />
                                          </td>
                                          <td className="py-2 px-4 text-right">
                                            <Currency amount={receipt.tax_total} />
                                          </td>
                                          <td className="py-2 px-4 text-right"></td>
                                          <td className="py-2 px-4 text-center">
                                            <ReceiptStatusBadge status={receipt.status || 'confirmed'} />
                                          </td>
                                          <td className="py-2 px-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={() => onViewReceipt(receipt)}
                                                title="View receipt"
                                              >
                                                <Eye className="h-3 w-3" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={() => {
                                                  // TODO: Edit receipt
                                                  onViewReceipt(receipt);
                                                }}
                                                title="Edit receipt"
                                              >
                                                <Edit className="h-3 w-3" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={() => onUnlinkReceipt(receipt.id)}
                                                title="Unlink from estimate"
                                              >
                                                <Link2Off className="h-3 w-3" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                                onClick={() => onDeleteReceipt(receipt.id)}
                                                title="Delete receipt"
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                                <div className="pt-2">
                                  <ReceiptFormDialog
                                    vendorId={vendor.id}
                                    vendorType={vendor.type}
                                    taxProvince={vendor.tax_province}
                                    estimates={estimates}
                                    preSelectedEstimateId={estimate.id}
                                    onSubmit={(data) => onCreateReceipt({ ...data, estimate_id: estimate.id })}
                                    trigger={
                                      <Button size="sm">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Link Receipt to This Estimate
                                      </Button>
                                    }
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Estimate Dialog */}
      {editingEstimate && (
        <EstimateFormDialog
          vendorId={vendor.id}
          estimate={editingEstimate}
          onSubmit={(data, file) => {
            onUpdateEstimate(editingEstimate.id, data, file);
            setEditingEstimate(null);
          }}
          open={true}
          onOpenChange={(open) => {
            if (!open) setEditingEstimate(null);
          }}
        />
      )}

      {/* Unlinked Receipts Section */}
      {unlinkedReceipts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Unlinked Receipts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full table-fixed">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left py-2 px-4 font-medium w-20">ID</th>
                    <th className="text-left py-2 px-4 font-medium w-24">Vendor Ref</th>
                    <th className="text-left py-2 px-4 font-medium w-28">Date</th>
                    <th className="text-left py-2 px-4 font-medium w-32">Payment Type</th>
                    <th className="text-right py-2 px-4 font-medium w-24">Total</th>
                    <th className="text-right py-2 px-4 font-medium w-20">HST</th>
                    <th className="text-left py-2 px-4 font-medium">Notes</th>
                    <th className="text-center py-2 px-4 font-medium w-20">Status</th>
                    <th className="text-center py-2 px-4 font-medium w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {unlinkedReceipts.map((receipt) => (
                    <tr key={receipt.id} className="border-t hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <span className="font-medium text-sm">
                          {receipt.display_id}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{receipt.vendor_ref}</td>
                      <td className="py-3 px-4">{receipt.date}</td>
                      <td className="py-3 px-4">
                        {receipt.payment_type && (
                          <Badge variant="outline" className="capitalize text-xs">
                            {receipt.payment_type}
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Currency amount={receipt.total} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Currency amount={receipt.tax_total} />
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{receipt.notes}</td>
                      <td className="py-3 px-4 text-center">
                        <ReceiptStatusBadge status={receipt.status || 'confirmed'} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => onViewReceipt(receipt)}
                            title="View receipt"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => {
                              // TODO: Edit receipt
                              onViewReceipt(receipt);
                            }}
                            title="Edit receipt"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={() => onDeleteReceipt(receipt.id)}
                            title="Delete receipt"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

// Retail Vendor Layout Component
interface RetailVendorLayoutProps {
  vendor: Vendor;
  receipts: Receipt[];
  documents: Document[];
  onCreateReceipt: (data: Omit<Receipt, 'id' | 'display_id' | 'project_id' | 'vendor_id' | 'created_at' | 'updated_at' | 'status' | 'created_by' | 'tax_total'>, file?: File | null) => void;
  onViewReceipt: (receipt: Receipt) => void;
  onDeleteReceipt: (receiptId: string) => void;
}

function RetailVendorLayout({
  vendor,
  receipts,
  documents: _documents,
  onCreateReceipt,
  onViewReceipt,
  onDeleteReceipt,
}: RetailVendorLayoutProps) {
  const sortedReceipts = [...receipts].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Receipts</CardTitle>
        <ReceiptFormDialog
          vendorId={vendor.id}
          vendorType={vendor.type}
          taxProvince={vendor.tax_province}
          onSubmit={onCreateReceipt}
          trigger={
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Receipt
            </Button>
          }
        />
      </CardHeader>
      <CardContent>
        {sortedReceipts.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No receipts yet. Add your first receipt to track purchases.
          </p>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full table-fixed">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left py-2 px-4 font-medium w-20">ID</th>
                  <th className="text-left py-2 px-4 font-medium w-24">Vendor Ref</th>
                  <th className="text-left py-2 px-4 font-medium w-28">Date</th>
                  <th className="text-right py-2 px-4 font-medium w-24">Total</th>
                  <th className="text-right py-2 px-4 font-medium w-20">HST</th>
                  <th className="text-left py-2 px-4 font-medium w-32">Tags</th>
                  <th className="text-left py-2 px-4 font-medium">Notes</th>
                  <th className="text-center py-2 px-4 font-medium w-20">Status</th>
                  <th className="text-center py-2 px-4 font-medium w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedReceipts.map((receipt) => (
                  <tr key={receipt.id} className="border-t hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <span className="font-medium text-sm">
                        {receipt.display_id}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{receipt.vendor_ref}</td>
                    <td className="py-3 px-4">{receipt.date}</td>
                    <td className="py-3 px-4 text-right">
                      <Currency amount={receipt.total} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Currency amount={receipt.tax_total} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {receipt.tags?.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{receipt.notes}</td>
                    <td className="py-3 px-4 text-center">
                      <ReceiptStatusBadge status={receipt.status || 'confirmed'} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => onViewReceipt(receipt)}
                          title="View receipt"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            // TODO: Edit receipt
                            onViewReceipt(receipt);
                          }}
                          title="Edit receipt"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          onClick={() => onDeleteReceipt(receipt.id)}
                          title="Delete receipt"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
