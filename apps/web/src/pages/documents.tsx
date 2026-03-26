import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  ExternalLink,
  Upload,
  Search,
  Trash2,
  Building2,
  Receipt,
  Calculator,
  Download,
  StickyNote,
  X
} from 'lucide-react';

export const DOCUMENT_TAGS = [
  { value: 'estimate', label: 'Estimate', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'receipt', label: 'Receipt', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'forms', label: 'Forms', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'core', label: 'Core', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
];
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getAllDocuments, getDocumentViewUrl, getDocumentPublicUrl, downloadDocument, deleteDocument, updateDocument, getVendors } from '@/lib/supabase';
import type { Document, Vendor } from '@/types';
import { format } from 'date-fns';
import { DocumentUploadDialog } from '@/components/document-upload-dialog';

export function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [selectedDocumentForNotes, setSelectedDocumentForNotes] = useState<Document | null>(null);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

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

  const handleDelete = (id: string) => {
    setDocumentToDelete(id);
    setDeleteConfirmOpen(true);
  };

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

  const handleViewNotes = (doc: Document) => {
    setSelectedDocumentForNotes(doc);
    setEditedNotes(doc.notes || '');
    setEditedTags(doc.tags || []);
    setIsEditingNotes(false);
    setNotesDialogOpen(true);
  };

  const toggleEditedTag = (tagValue: string) => {
    setEditedTags(prev =>
      prev.includes(tagValue)
        ? prev.filter(t => t !== tagValue)
        : [...prev, tagValue]
    );
  };

  const handleSaveNotes = async () => {
    if (!selectedDocumentForNotes) return;
    setIsSavingNotes(true);
    try {
      const updated = await updateDocument(selectedDocumentForNotes.id, {
        notes: editedNotes || undefined,
        tags: editedTags
      });
      // Update the documents list
      setDocuments(prev =>
        prev.map(d => d.id === updated.id ? updated : d)
      );
      setSelectedDocumentForNotes(updated);
      setIsEditingNotes(false);
    } catch (err) {
      console.error('Failed to save document:', err);
      alert('Failed to save changes');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const confirmDeleteDocument = async () => {
    if (!documentToDelete) return;
    try {
      await deleteDocument(documentToDelete);
      setDocuments(prev => prev.filter(d => d.id !== documentToDelete));
    } catch (err) {
      console.error('Failed to delete document:', err);
      alert('Failed to delete document');
    } finally {
      setDeleteConfirmOpen(false);
      setDocumentToDelete(null);
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

  const toggleTag = (tagValue: string) => {
    setSelectedTags(prev =>
      prev.includes(tagValue)
        ? prev.filter(t => t !== tagValue)
        : [...prev, tagValue]
    );
  };

  const clearTagFilters = () => {
    setSelectedTags([]);
  };

  const filteredDocuments = documents.filter(doc => {
    // Search filter
    const matchesSearch = searchQuery === '' ||
      doc.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.original_file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.vendor_ref?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getVendorName(doc.vendor_id).toLowerCase().includes(searchQuery.toLowerCase());

    // Tag filter - document must have ALL selected tags
    const matchesTags = selectedTags.length === 0 ||
      selectedTags.every(tag => doc.tags?.includes(tag));

    return matchesSearch && matchesTags;
  });

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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            All documents across vendors, estimates, and receipts
          </p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)} className="w-full sm:w-auto">
          <Upload className="h-4 w-4 mr-2" />
          <span className="sm:hidden">Upload</span>
          <span className="hidden sm:inline">Upload Document</span>
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

      {/* Tag Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground mr-1 hidden sm:inline">Filter by tags:</span>
        <span className="text-sm text-muted-foreground mr-1 sm:hidden">Filter:</span>
        {DOCUMENT_TAGS.map((tag) => (
          <button
            key={tag.value}
            onClick={() => toggleTag(tag.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              selectedTags.includes(tag.value)
                ? tag.color
                : 'bg-muted text-muted-foreground border-transparent hover:bg-muted/80'
            }`}
          >
            {tag.label}
          </button>
        ))}
        {selectedTags.length > 0 && (
          <button
            onClick={clearTagFilters}
            className="flex items-center gap-1 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
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
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {docType.label}
                        </Badge>
                        {doc.tags?.map((tag) => {
                          const tagConfig = DOCUMENT_TAGS.find(t => t.value === tag);
                          if (!tagConfig) return null;
                          return (
                            <Badge
                              key={tag}
                              className={`text-xs ${tagConfig.color} border`}
                            >
                              {tagConfig.label}
                            </Badge>
                          );
                        })}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatFileSize(doc.file_size_bytes)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1.5 sm:gap-2 mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs sm:text-sm"
                      onClick={() => handleViewDocument(doc.storage_path, doc.file_type)}
                    >
                      <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                      onClick={() => handleViewNotes(doc)}
                      title="Notes"
                    >
                      <StickyNote className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                      onClick={() => handleDownloadDocument(doc.storage_path, doc.display_name)}
                      title="Download"
                    >
                      <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(doc.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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

      {/* Notes/Edit Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={(open) => {
        if (!open) setIsEditingNotes(false);
        setNotesDialogOpen(open);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditingNotes ? 'Edit Document' : 'Document Notes'}</DialogTitle>
            <DialogDescription>
              {selectedDocumentForNotes?.display_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Tags Section - Always visible */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              {isEditingNotes ? (
                <div className="flex flex-wrap gap-2">
                  {DOCUMENT_TAGS.map((tag) => (
                    <button
                      key={tag.value}
                      type="button"
                      onClick={() => toggleEditedTag(tag.value)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                        editedTags.includes(tag.value)
                          ? tag.color
                          : 'bg-muted text-muted-foreground border-transparent hover:bg-muted/80'
                      }`}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedDocumentForNotes?.tags?.length ? (
                    selectedDocumentForNotes.tags.map((tag) => {
                      const tagConfig = DOCUMENT_TAGS.find(t => t.value === tag);
                      if (!tagConfig) return null;
                      return (
                        <Badge key={tag} className={`text-xs ${tagConfig.color} border`}>
                          {tagConfig.label}
                        </Badge>
                      );
                    })
                  ) : (
                    <span className="text-sm text-muted-foreground italic">No tags</span>
                  )}
                </div>
              )}
            </div>

            {/* Notes Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              {isEditingNotes ? (
                <Textarea
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  placeholder="Add notes about this document..."
                  rows={4}
                  className="resize-none"
                />
              ) : (
                <div className="bg-muted/50 rounded-lg p-3 min-h-[80px]">
                  {selectedDocumentForNotes?.notes ? (
                    <p className="text-sm text-foreground whitespace-pre-wrap">{selectedDocumentForNotes.notes}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No notes added to this document.</p>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            {isEditingNotes ? (
              <>
                <Button variant="outline" onClick={() => {
                  setIsEditingNotes(false);
                  setEditedNotes(selectedDocumentForNotes?.notes || '');
                  setEditedTags(selectedDocumentForNotes?.tags || []);
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSaveNotes} disabled={isSavingNotes}>
                  {isSavingNotes ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setNotesDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => setIsEditingNotes(true)}>
                  Edit
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
