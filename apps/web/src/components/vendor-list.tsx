import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Search,
  MoreHorizontal,
  Phone,
  Mail,
  MapPin,
  Archive,
  Edit
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
import { VendorFormDialog } from '@/components/vendor-form';
import type { Vendor } from '@/types';

interface VendorListProps {
  vendors: Vendor[];
  onArchive?: (vendor: Vendor) => void;
  onUpdate?: (vendor: Vendor, data: Omit<Vendor, 'id' | 'display_id' | 'project_id' | 'created_at' | 'updated_at'>) => void;
}

export function VendorList({ vendors, onArchive, onUpdate }: VendorListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredVendors = vendors.filter((vendor) =>
    vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const activeVendors = filteredVendors.filter((v) => !v.is_archived);
  const archivedVendors = filteredVendors.filter((v) => v.is_archived);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      
      <div className="space-y-4">
        {activeVendors.length === 0 && archivedVendors.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No vendors found. Create your first vendor to get started.</p>
          </div>
        )}
        
        {activeVendors.length === 0 && searchQuery && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No vendors match "{searchQuery}"</p>
          </div>
        )}
        
        {activeVendors.map((vendor) => (
          <VendorCard key={vendor.id} vendor={vendor} onArchive={onArchive} onUpdate={onUpdate} />
        ))}
        
        {archivedVendors.length > 0 && (
          <>
            <h3 className="text-sm font-medium text-muted-foreground mt-8">
              Archived Vendors
            </h3>
            {archivedVendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} onArchive={onArchive} onUpdate={onUpdate} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function VendorCard({ vendor, onArchive, onUpdate }: { vendor: Vendor; onArchive?: (vendor: Vendor) => void; onUpdate?: (vendor: Vendor, data: Omit<Vendor, 'id' | 'display_id' | 'project_id' | 'created_at' | 'updated_at'>) => void }) {
  return (
    <div className="group border rounded-lg p-4 hover:border-primary/50 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between">
        {/* Main content - clickable */}
        <Link to={`/vendors/${vendor.display_id}`} className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-lg">{vendor.name}</h3>
            <VendorTypeBadge type={vendor.type} />
            <span className="text-xs text-muted-foreground">
              {vendor.display_id}
            </span>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {vendor.contact_name && (
              <span>{vendor.contact_name}</span>
            )}
            {vendor.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                <span>{vendor.phone}</span>
              </div>
            )}
            {vendor.email && (
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                <span>{vendor.email}</span>
              </div>
            )}
            {vendor.address && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate max-w-[200px]">{vendor.address}</span>
              </div>
            )}
          </div>

          {vendor.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {vendor.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </Link>

        {/* Actions - not clickable via the card link */}
        <div className="text-right space-y-2 ml-4 flex-shrink-0">
          <div className="space-y-1">
            {vendor.type === 'contract' && (vendor.estimated_total || 0) > 0 && (
              <>
                <div className="text-sm">
                  <span className="text-muted-foreground">Estimated: </span>
                  <Currency amount={vendor.estimated_total || 0} />
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Paid: </span>
                  <Currency amount={vendor.paid_total || 0} />
                </div>
                <div className="text-sm font-medium">
                  <span className="text-muted-foreground">Outstanding: </span>
                  <Currency amount={vendor.outstanding || 0} />
                </div>
              </>
            )}
            {vendor.type === 'retail' && (vendor.paid_total || 0) > 0 && (
              <div className="text-sm font-medium">
                <span className="text-muted-foreground">Total Spent: </span>
                <Currency amount={vendor.paid_total || 0} />
              </div>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Link to={`/vendors/${vendor.display_id}`}>
                  View Details
                </Link>
              </DropdownMenuItem>
              {onUpdate && (
                <VendorFormDialog
                  vendor={vendor}
                  onSubmit={(data) => onUpdate(vendor, data)}
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  }
                />
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
