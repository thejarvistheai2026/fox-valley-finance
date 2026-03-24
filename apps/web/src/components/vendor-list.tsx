import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Search,
  MoreHorizontal,
  Phone,
  Mail,
  Globe,
  MapPin,
  Archive,
  Edit,
  X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { VendorTypeBadge } from '@/components/badge';
import { Currency } from '@/components/currency';
import { cn } from '@/lib/utils';
import type { Vendor } from '@/types';

interface VendorListProps {
  vendors: Vendor[];
  onArchive?: (vendor: Vendor) => void;
  onUpdate?: (vendor: Vendor, data: Omit<Vendor, 'id' | 'display_id' | 'project_id' | 'created_at' | 'updated_at'>) => void;
}

export function VendorList({ vendors, onArchive, onUpdate }: VendorListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Get all unique tags from vendors
  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    vendors.forEach(vendor => {
      vendor.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [vendors]);

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.tags?.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag = selectedTag ? vendor.tags?.includes(selectedTag) : true;

    return matchesSearch && matchesTag;
  });

  const activeVendors = filteredVendors.filter((v) => !v.is_archived);
  const archivedVendors = filteredVendors.filter((v) => v.is_archived);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vendors by name or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
        </div>

        {/* Tag Filter */}
        {uniqueTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground mr-1">Filter by:</span>
            {uniqueTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={cn(
                  "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                  selectedTag === tag
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {tag}
              </button>
            ))}
            {selectedTag && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setSelectedTag(null)}
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {activeVendors.length === 0 && archivedVendors.length === 0 && (
          <div className="text-center py-16 px-4">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-foreground">No vendors yet</p>
            <p className="text-muted-foreground mt-1">Create your first vendor to get started</p>
          </div>
        )}

        {activeVendors.length === 0 && searchQuery && (
          <div className="text-center py-16 px-4">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-foreground">No vendors found</p>
            <p className="text-muted-foreground mt-1">No results for "{searchQuery}"</p>
          </div>
        )}

        <div className="space-y-3">
          {activeVendors.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} onArchive={onArchive} onUpdate={onUpdate} />
          ))}
        </div>

        {archivedVendors.length > 0 && (
          <>
            <div className="pt-6 mt-6 border-t border-border/50">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Archived Vendors
              </h3>
            </div>
            <div className="space-y-3 opacity-75">
              {archivedVendors.map((vendor) => (
                <VendorCard key={vendor.id} vendor={vendor} onArchive={onArchive} onUpdate={onUpdate} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function VendorCard({ vendor, onArchive, onUpdate }: { vendor: Vendor; onArchive?: (vendor: Vendor) => void; onUpdate?: (vendor: Vendor, data: Omit<Vendor, 'id' | 'display_id' | 'project_id' | 'created_at' | 'updated_at'>) => void }) {
  return (
    <div className="group bg-card border rounded-xl p-5 hover:shadow-md hover:border-primary/20 transition-all duration-200">
      <div className="flex items-start justify-between gap-4">
        {/* Main content - clickable */}
        <Link to={`/vendors/${vendor.display_id}`} className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-lg truncate">{vendor.name}</h3>
              <div className="flex items-center gap-2">
                <VendorTypeBadge type={vendor.type} />
                <span className="text-xs text-muted-foreground font-medium">
                  {vendor.display_id}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {vendor.contact_name && (
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-foreground">{vendor.contact_name}</span>
              </div>
            )}
            {vendor.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                <span>{vendor.phone}</span>
              </div>
            )}
            {vendor.email && (
              <div className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate max-w-[200px]">{vendor.email}</span>
              </div>
            )}
            {vendor.website && (
              <div className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                <a
                  href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate max-w-[200px] hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {vendor.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
            {vendor.address && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate max-w-[250px]">{vendor.address}</span>
              </div>
            )}
          </div>

          {vendor.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {vendor.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs font-medium px-2.5 py-1 rounded-full">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </Link>

        {/* Actions - not clickable via the card link */}
        <div className="text-right space-y-3 flex-shrink-0">
          <div className="space-y-1 min-w-[140px]">
            {vendor.type === 'contract' && (vendor.estimated_total || 0) > 0 && (
              <>
                <div className="text-sm">
                  <span className="text-muted-foreground">Estimated: </span>
                  <span className="font-medium"><Currency amount={vendor.estimated_total || 0} /></span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Paid: </span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400"><Currency amount={vendor.paid_total || 0} /></span>
                </div>
                <div className="text-sm font-medium">
                  <span className="text-muted-foreground">Outstanding: </span>
                  <span className={cn(
                    "font-semibold",
                    (vendor.outstanding || 0) > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                  )}>
                    <Currency amount={vendor.outstanding || 0} />
                  </span>
                </div>
              </>
            )}
            {vendor.type === 'retail' && (vendor.paid_total || 0) > 0 && (
              <div className="text-sm">
                <span className="text-muted-foreground">Total Spent: </span>
                <span className="font-semibold"><Currency amount={vendor.paid_total || 0} /></span>
              </div>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg hover:bg-muted"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem>
                <Link to={`/vendors/${vendor.display_id}`} className="flex items-center w-full">
                  View Details
                </Link>
              </DropdownMenuItem>
              {onUpdate && (
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    const event = new CustomEvent('edit-vendor', { detail: vendor });
                    document.dispatchEvent(event);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {!vendor.is_archived && onArchive && (
                <DropdownMenuItem onClick={() => onArchive(vendor)}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
