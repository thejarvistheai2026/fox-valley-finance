import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VendorList } from '@/components/vendor-list';
import { VendorFormDialog } from '@/components/vendor-form';
import type { Vendor } from '@/types';
import { getVendors, createVendor, archiveVendor } from '@/lib/supabase';

export function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchVendors() {
      setLoading(true);
      setError(null);
      try {
        const data = await getVendors({ archived: false });
        setVendors(data || []);
      } catch (err) {
        console.error('Failed to fetch vendors:', err);
        setError(err instanceof Error ? err.message : 'Failed to load vendors');
      } finally {
        setLoading(false);
      }
    }
    
    fetchVendors();
  }, []);
  
  const handleCreateVendor = async (data: Omit<Vendor, 'id' | 'display_id' | 'project_id' | 'created_at' | 'updated_at'>) => {
    try {
      const newVendor = await createVendor(data);
      setVendors([...vendors, newVendor]);
    } catch (err) {
      console.error('Failed to create vendor:', err);
      setError(err instanceof Error ? err.message : 'Failed to create vendor');
    }
  };
  
  const handleArchiveVendor = async (vendor: Vendor) => {
    try {
      await archiveVendor(vendor.id);
      setVendors(vendors.map((v) => 
        v.id === vendor.id ? { ...v, is_archived: true } : v
      ));
    } catch (err) {
      console.error('Failed to archive vendor:', err);
      setError(err instanceof Error ? err.message : 'Failed to archive vendor');
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vendors</h1>
          <p className="text-muted-foreground">
            Manage your contractors and suppliers
          </p>
        </div>
        
        <VendorFormDialog onSubmit={handleCreateVendor} trigger={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
        } />
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <span className="font-medium">Error: {error}</span>
        </div>
      )}
      
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 animate-pulse">
              <div className="h-6 w-48 bg-muted rounded mb-2" />
              <div className="h-4 w-32 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : (
        <VendorList 
          vendors={vendors} 
          onArchive={handleArchiveVendor}
        />
      )}
    </div>
  );
}
