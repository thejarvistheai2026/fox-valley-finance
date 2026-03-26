import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VendorList } from '@/components/vendor-list';
import { VendorFormDialog } from '@/components/vendor-form';
import type { Vendor } from '@/types';
import { getVendors, createVendor, archiveVendor, updateVendor } from '@/lib/supabase';

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

  const handleUpdateVendor = async (vendor: Vendor, data: Omit<Vendor, 'id' | 'display_id' | 'project_id' | 'created_at' | 'updated_at'>) => {
    try {
      const updatedVendor = await updateVendor(vendor.id, data);
      setVendors(vendors.map((v) => v.id === vendor.id ? updatedVendor : v));
    } catch (err) {
      console.error('Failed to update vendor:', err);
      setError(err instanceof Error ? err.message : 'Failed to update vendor');
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Vendors</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Manage your contractors and suppliers
          </p>
        </div>

        <VendorFormDialog onSubmit={handleCreateVendor} trigger={
          <Button size="sm" sm:size="lg" className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="sm:hidden">Add</span>
            <span className="hidden sm:inline">Add Vendor</span>
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
          onUpdate={handleUpdateVendor}
        />
      )}
    </div>
  );
}
