import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, FileText, X } from 'lucide-react';
import { createDocument, uploadDocument } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { Vendor } from '@/types';

const DOCUMENT_TAGS = [
  { value: 'estimate', label: 'Estimate', color: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
  { value: 'receipt', label: 'Receipt', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
  { value: 'forms', label: 'Forms', color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
  { value: 'core', label: 'Core', color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
];

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendors: Vendor[];
  onUploadComplete: () => void;
  defaultVendorId?: string;
}

const DEFAULT_PROJECT_ID = '11111111-1111-1111-1111-111111111111';

export function DocumentUploadDialog({
  open,
  onOpenChange,
  vendors,
  onUploadComplete,
  defaultVendorId
}: DocumentUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string>(defaultVendorId || '');
  const [displayName, setDisplayName] = useState('');
  const [vendorRef, setVendorRef] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleTag = (tagValue: string) => {
    setSelectedTags(prev =>
      prev.includes(tagValue)
        ? prev.filter(t => t !== tagValue)
        : [...prev, tagValue]
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-fill display name from file name if empty
      if (!displayName) {
        setDisplayName(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

      if (validTypes.includes(file.type) || validExtensions.includes(fileExtension)) {
        setSelectedFile(file);
        if (!displayName) {
          setDisplayName(file.name.replace(/\.[^/.]+$/, ''));
        }
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedVendorId || !displayName) return;

    setUploading(true);
    try {
      // Upload file to storage
      const { path: storagePath } = await uploadDocument(
        selectedFile,
        DEFAULT_PROJECT_ID,
        'vendors',
        selectedVendorId
      );

      // Create document record
      await createDocument({
        project_id: DEFAULT_PROJECT_ID,
        vendor_id: selectedVendorId,
        display_name: displayName,
        original_file_name: selectedFile.name,
        storage_path: storagePath,
        file_type: selectedFile.type || 'application/octet-stream',
        file_size_bytes: selectedFile.size,
        vendor_ref: vendorRef || undefined,
        notes: notes || undefined,
        tags: selectedTags
      });

      // Reset form
      setSelectedFile(null);
      setSelectedVendorId(defaultVendorId || '');
      setDisplayName('');
      setVendorRef('');
      setNotes('');
      setSelectedTags([]);

      onOpenChange(false);
      onUploadComplete();
    } catch (err) {
      console.error('Failed to upload document:', err);
      alert('Failed to upload document: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const canSubmit = selectedFile && selectedVendorId && displayName.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-8">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-xl">Upload Document</DialogTitle>
          <DialogDescription className="text-base mt-2">
            Upload a document and associate it with a vendor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8">
          {/* File Upload Area */}
          <div className="space-y-4">
            <Label>Document File *</Label>
            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 bg-muted/20 hover:border-primary/50 hover:bg-muted/30"
                )}
              >
                <Upload className={cn(
                  "h-10 w-10 mx-auto mb-3 transition-colors",
                  isDragging ? "text-primary" : "text-muted-foreground"
                )} />
                <p className="text-sm font-medium mb-1">
                  {isDragging ? 'Drop file here' : 'Click or drag to upload PDF or image'}
                </p>
                <p className="text-xs text-muted-foreground">Max size: 10MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="border rounded-xl p-5 bg-muted/20">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                    {selectedFile.type.includes('pdf') ? (
                      <FileText className="h-6 w-6 text-red-500" />
                    ) : (
                      <FileText className="h-6 w-6 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Document Details */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Document Details
            </h3>
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor *</Label>
                <Select
                  value={selectedVendorId}
                  onValueChange={(value) => setSelectedVendorId(value || '')}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor_ref">Vendor Reference #</Label>
                <Input
                  id="vendor_ref"
                  value={vendorRef}
                  onChange={(e) => setVendorRef(e.target.value)}
                  placeholder="e.g., DOC-2026-001"
                  className="h-11"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="display_name">Display Name *</Label>
                <Input
                  id="display_name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g., Kitchen Contract, Floor Plans"
                  className="h-11"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes about this document..."
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {DOCUMENT_TAGS.map((tag) => (
                    <button
                      key={tag.value}
                      type="button"
                      onClick={() => toggleTag(tag.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                        selectedTags.includes(tag.value)
                          ? tag.color
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-11 px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!canSubmit || uploading}
            className="h-11 px-6"
          >
            {uploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
