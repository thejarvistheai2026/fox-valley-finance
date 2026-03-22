-- Fox Valley Finance Tracker - Initial Database Schema
-- Migration: 000001_initial_schema.sql
-- Description: Creates core tables, sequences, triggers, and indexes

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy text search
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- For UUID generation

-- ============================================================================
-- SEQUENCES FOR DISPLAY IDs
-- ============================================================================

-- Vendor display IDs: VEN-0001, VEN-0002, etc.
CREATE SEQUENCE IF NOT EXISTS seq_vendor_display_id START 1;

-- Estimate display IDs: EST-0001, EST-0002, etc.
CREATE SEQUENCE IF NOT EXISTS seq_estimate_display_id START 1;

-- Receipt display IDs: REC-0001, REC-0002, etc.
CREATE SEQUENCE IF NOT EXISTS seq_receipt_display_id START 1;

-- Document display IDs: DOC-0001, DOC-0002, etc.
CREATE SEQUENCE IF NOT EXISTS seq_document_display_id START 1;

-- ============================================================================
-- HELPER FUNCTION: Update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TABLE: projects
-- Shared project for all members (2 users)
-- ============================================================================

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'Fox Valley Build',
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for updated_at
CREATE TRIGGER projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: project_members
-- Join table linking auth.users to projects
-- ============================================================================

CREATE TABLE IF NOT EXISTS project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'member', etc.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Each user can only be a member of a project once
    UNIQUE(project_id, user_id)
);

CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);

-- Trigger for updated_at
CREATE TRIGGER project_members_updated_at
    BEFORE UPDATE ON project_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: vendors
-- Vendors can be Contract (estimate-driven) or Retail (receipt-only)
-- ============================================================================

CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_id TEXT UNIQUE NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Basic info
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('contract', 'retail')),
    
    -- Contact info
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    address TEXT,
    
    -- Tax province for proper HST/GST+QST handling
    tax_province TEXT DEFAULT 'ON' CHECK (tax_province IN ('ON', 'QC')),
    
    -- Notes and tags
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    
    -- Soft delete (archiving)
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Full-text search vector
    search_vector TSVECTOR,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_vendors_project_id ON vendors(project_id);
CREATE INDEX idx_vendors_type ON vendors(type);
CREATE INDEX idx_vendors_is_archived ON vendors(is_archived) WHERE NOT is_archived;
CREATE INDEX idx_vendors_search_vector ON vendors USING GIN (search_vector);

-- Trigger for updated_at
CREATE TRIGGER vendors_updated_at
    BEFORE UPDATE ON vendors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-generate display_id on insert
CREATE OR REPLACE FUNCTION generate_vendor_display_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.display_id IS NULL THEN
        NEW.display_id := 'VEN-' || LPAD(nextval('seq_vendor_display_id')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vendors_generate_display_id
    BEFORE INSERT ON vendors
    FOR EACH ROW
    EXECUTE FUNCTION generate_vendor_display_id();

-- Trigger to update search_vector
CREATE OR REPLACE FUNCTION update_vendor_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.contact_name, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.email, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.notes, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.display_id, '')), 'A');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vendors_search_vector_update
    BEFORE INSERT OR UPDATE ON vendors
    FOR EACH ROW
    EXECUTE FUNCTION update_vendor_search_vector();

-- ============================================================================
-- TABLE: estimates
-- Estimates are only for Contract vendors
-- ============================================================================

CREATE TABLE IF NOT EXISTS estimates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_id TEXT UNIQUE NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    
    -- Vendor's own estimate/quote number
    vendor_ref TEXT NOT NULL,
    
    -- Estimate details
    title TEXT NOT NULL,
    date DATE NOT NULL,
    estimated_total NUMERIC(12,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revised', 'declined')),
    
    -- Additional info
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    
    -- Soft delete
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Full-text search
    search_vector TSVECTOR,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint: vendor can't have two estimates with same ref
    UNIQUE(vendor_id, vendor_ref)
);

-- Indexes
CREATE INDEX idx_estimates_project_id ON estimates(project_id);
CREATE INDEX idx_estimates_vendor_id ON estimates(vendor_id);
CREATE INDEX idx_estimates_status ON estimates(status);
CREATE INDEX idx_estimates_is_archived ON estimates(is_archived) WHERE NOT is_archived;
CREATE INDEX idx_estimates_search_vector ON estimates USING GIN (search_vector);

-- Trigger for updated_at
CREATE TRIGGER estimates_updated_at
    BEFORE UPDATE ON estimates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for auto-generating display_id
CREATE OR REPLACE FUNCTION generate_estimate_display_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.display_id IS NULL THEN
        NEW.display_id := 'EST-' || LPAD(nextval('seq_estimate_display_id')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER estimates_generate_display_id
    BEFORE INSERT ON estimates
    FOR EACH ROW
    EXECUTE FUNCTION generate_estimate_display_id();

-- Trigger for search vector
CREATE OR REPLACE FUNCTION update_estimate_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.vendor_ref, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.notes, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.display_id, '')), 'A');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER estimates_search_vector_update
    BEFORE INSERT OR UPDATE ON estimates
    FOR EACH ROW
    EXECUTE FUNCTION update_estimate_search_vector();

-- ============================================================================
-- TABLE: receipts
-- Receipts can be linked to estimates (for Contract vendors) or standalone
-- ============================================================================

CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_id TEXT UNIQUE NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    estimate_id UUID REFERENCES estimates(id) ON DELETE SET NULL, -- Nullable: unlinked receipts allowed
    
    -- Vendor's invoice number or auto-generated for retail
    vendor_ref TEXT NOT NULL,
    
    -- Financial details
    date DATE NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL, -- Pre-tax amount
    gst_amount NUMERIC(12,2) NOT NULL DEFAULT 0, -- Federal GST (or HST federal portion)
    pst_amount NUMERIC(12,2) NOT NULL DEFAULT 0, -- Provincial tax (HST provincial or QST)
    tax_total NUMERIC(12,2) GENERATED ALWAYS AS (gst_amount + pst_amount) STORED,
    total NUMERIC(12,2) NOT NULL, -- Final paid amount
    
    -- Categorization
    payment_type TEXT, -- 'deposit', 'progress', 'final', 'additional', or freeform
    
    -- Status: 'inbox' (mobile capture, pending) or 'confirmed' (processed)
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('inbox', 'confirmed')),
    
    -- Who captured/created this receipt (track for inbox features)
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Additional info
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    
    -- Soft delete
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Full-text search
    search_vector TSVECTOR,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint: vendor can't have two receipts with same ref
    UNIQUE(vendor_id, vendor_ref)
);

-- Indexes
CREATE INDEX idx_receipts_project_id ON receipts(project_id);
CREATE INDEX idx_receipts_vendor_id ON receipts(vendor_id);
CREATE INDEX idx_receipts_estimate_id ON receipts(estimate_id) WHERE estimate_id IS NOT NULL;
CREATE INDEX idx_receipts_status ON receipts(status);
CREATE INDEX idx_receipts_created_by ON receipts(created_by);
CREATE INDEX idx_receipts_is_archived ON receipts(is_archived) WHERE NOT is_archived;
CREATE INDEX idx_receipts_date ON receipts(date);
CREATE INDEX idx_receipts_search_vector ON receipts USING GIN (search_vector);

-- Trigger for updated_at
CREATE TRIGGER receipts_updated_at
    BEFORE UPDATE ON receipts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for auto-generating display_id
CREATE OR REPLACE FUNCTION generate_receipt_display_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.display_id IS NULL THEN
        NEW.display_id := 'REC-' || LPAD(nextval('seq_receipt_display_id')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER receipts_generate_display_id
    BEFORE INSERT ON receipts
    FOR EACH ROW
    EXECUTE FUNCTION generate_receipt_display_id();

-- Trigger for search vector
CREATE OR REPLACE FUNCTION update_receipt_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.vendor_ref, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.notes, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.payment_type, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.display_id, '')), 'A');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER receipts_search_vector_update
    BEFORE INSERT OR UPDATE ON receipts
    FOR EACH ROW
    EXECUTE FUNCTION update_receipt_search_vector();

-- ============================================================================
-- TABLE: documents
-- File attachments for vendors, estimates, and receipts
-- ============================================================================

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_id TEXT UNIQUE NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    estimate_id UUID REFERENCES estimates(id) ON DELETE SET NULL,
    receipt_id UUID REFERENCES receipts(id) ON DELETE SET NULL,
    
    -- Vendor's document number if applicable
    vendor_ref TEXT,
    
    -- User-editable display name
    display_name TEXT NOT NULL,
    
    -- Original upload info
    original_file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL, -- Path in Supabase Storage bucket
    file_type TEXT NOT NULL, -- MIME type: 'application/pdf', 'image/jpeg', etc.
    file_size_bytes INTEGER NOT NULL,
    
    -- Additional info
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    
    -- Full-text search
    search_vector TSVECTOR,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint: document can be linked to vendor alone, or vendor+estimate, or vendor+receipt
    -- but not both estimate AND receipt simultaneously
    CONSTRAINT check_single_parent CHECK (
        NOT (estimate_id IS NOT NULL AND receipt_id IS NOT NULL)
    )
);

-- Indexes
CREATE INDEX idx_documents_project_id ON documents(project_id);
CREATE INDEX idx_documents_vendor_id ON documents(vendor_id);
CREATE INDEX idx_documents_estimate_id ON documents(estimate_id) WHERE estimate_id IS NOT NULL;
CREATE INDEX idx_documents_receipt_id ON documents(receipt_id) WHERE receipt_id IS NOT NULL;
CREATE INDEX idx_documents_search_vector ON documents USING GIN (search_vector);

-- Trigger for auto-generating display_id
CREATE OR REPLACE FUNCTION generate_document_display_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.display_id IS NULL THEN
        NEW.display_id := 'DOC-' || LPAD(nextval('seq_document_display_id')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documents_generate_display_id
    BEFORE INSERT ON documents
    FOR EACH ROW
    EXECUTE FUNCTION generate_document_display_id();

-- Trigger for search vector
CREATE OR REPLACE FUNCTION update_document_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.display_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.vendor_ref, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.original_file_name, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.notes, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.display_id, '')), 'A');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documents_search_vector_update
    BEFORE INSERT OR UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_document_search_vector();

-- ============================================================================
-- UNIFIED SEARCH FUNCTION
-- Returns ranked search results across all entity types
-- ============================================================================

CREATE OR REPLACE FUNCTION search_all(
    query_text TEXT,
    p_project_id UUID
)
RETURNS TABLE (
    entity_type TEXT,
    entity_id UUID,
    display_id TEXT,
    title TEXT,
    headline TEXT,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    
    -- Search vendors
    SELECT 
        'vendor'::TEXT,
        v.id,
        v.display_id,
        v.name,
        ts_headline('english', v.name || ' ' || COALESCE(v.notes, ''), plainto_tsquery(query_text)),
        ts_rank(v.search_vector, plainto_tsquery(query_text))::REAL
    FROM vendors v
    WHERE v.project_id = p_project_id 
      AND v.search_vector @@ plainto_tsquery(query_text)
    
    UNION ALL
    
    -- Search estimates
    SELECT 
        'estimate'::TEXT,
        e.id,
        e.display_id,
        e.title,
        ts_headline('english', e.title || ' ' || COALESCE(e.notes, ''), plainto_tsquery(query_text)),
        ts_rank(e.search_vector, plainto_tsquery(query_text))::REAL
    FROM estimates e
    WHERE e.project_id = p_project_id 
      AND e.search_vector @@ plainto_tsquery(query_text)
    
    UNION ALL
    
    -- Search receipts
    SELECT 
        'receipt'::TEXT,
        r.id,
        r.display_id,
        COALESCE(r.vendor_ref, 'Receipt ' || r.display_id),
        ts_headline('english', COALESCE(r.notes, '') || ' ' || COALESCE(r.payment_type, ''), plainto_tsquery(query_text)),
        ts_rank(r.search_vector, plainto_tsquery(query_text))::REAL
    FROM receipts r
    WHERE r.project_id = p_project_id 
      AND r.search_vector @@ plainto_tsquery(query_text)
    
    UNION ALL
    
    -- Search documents
    SELECT 
        'document'::TEXT,
        d.id,
        d.display_id,
        d.display_name,
        ts_headline('english', COALESCE(d.display_name, '') || ' ' || COALESCE(d.notes, ''), plainto_tsquery(query_text)),
        ts_rank(d.search_vector, plainto_tsquery(query_text))::REAL
    FROM documents d
    WHERE d.project_id = p_project_id 
      AND d.search_vector @@ plainto_tsquery(query_text)
    
    ORDER BY rank DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- HELPER VIEW: Vendor Financial Summary
-- Provides computed totals for dashboard and vendor detail pages
-- ============================================================================

CREATE OR REPLACE VIEW vendor_financial_summary AS
SELECT 
    v.id AS vendor_id,
    v.project_id,
    v.type AS vendor_type,
    v.name AS vendor_name,
    v.display_id AS vendor_display_id,
    
    -- Total estimated (Contract vendors only, active estimates)
    COALESCE(
        (SELECT SUM(e.estimated_total) 
         FROM estimates e 
         WHERE e.vendor_id = v.id 
           AND e.status = 'active' 
           AND NOT e.is_archived),
        0
    ) AS total_estimated,
    
    -- Total paid (confirmed receipts only)
    COALESCE(
        (SELECT SUM(r.total) 
         FROM receipts r 
         WHERE r.vendor_id = v.id 
           AND r.status = 'confirmed' 
           AND NOT r.is_archived),
        0
    ) AS total_paid,
    
    -- GST total
    COALESCE(
        (SELECT SUM(r.gst_amount) 
         FROM receipts r 
         WHERE r.vendor_id = v.id 
           AND r.status = 'confirmed' 
           AND NOT r.is_archived),
        0
    ) AS total_gst,
    
    -- PST total
    COALESCE(
        (SELECT SUM(r.pst_amount) 
         FROM receipts r 
         WHERE r.vendor_id = v.id 
           AND r.status = 'confirmed' 
           AND NOT r.is_archived),
        0
    ) AS total_pst,
    
    -- Tax total
    COALESCE(
        (SELECT SUM(r.tax_total) 
         FROM receipts r 
         WHERE r.vendor_id = v.id 
           AND r.status = 'confirmed' 
           AND NOT r.is_archived),
        0
    ) AS total_tax,
    
    -- Outstanding (Contract only: estimated - paid)
    CASE 
        WHEN v.type = 'contract' THEN
            COALESCE(
                (SELECT SUM(e.estimated_total) 
                 FROM estimates e 
                 WHERE e.vendor_id = v.id 
                   AND e.status = 'active' 
                   AND NOT e.is_archived),
                0
            ) - COALESCE(
                (SELECT SUM(r.total) 
                 FROM receipts r 
                 WHERE r.vendor_id = v.id 
                   AND r.status = 'confirmed' 
                   AND NOT r.is_archived),
                0
            )
        ELSE NULL -- Not meaningful for retail vendors
    END AS outstanding
    
FROM vendors v
WHERE NOT v.is_archived;

-- ============================================================================
-- HELPER VIEW: Estimate with Outstanding Balance
-- ============================================================================

CREATE OR REPLACE VIEW estimate_with_balance AS
SELECT 
    e.*,
    COALESCE(
        (SELECT SUM(r.total) 
         FROM receipts r 
         WHERE r.estimate_id = e.id 
           AND r.status = 'confirmed' 
           AND NOT r.is_archived),
        0
    ) AS paid_to_date,
    e.estimated_total - COALESCE(
        (SELECT SUM(r.total) 
         FROM receipts r 
         WHERE r.estimate_id = e.id 
           AND r.status = 'confirmed' 
           AND NOT r.is_archived),
        0
    ) AS outstanding
FROM estimates e
WHERE NOT e.is_archived;

-- ============================================================================
-- HELPER VIEW: Project Summary (Dashboard KPIs)
-- ============================================================================

CREATE OR REPLACE VIEW project_summary AS
SELECT 
    p.id AS project_id,
    p.name AS project_name,
    
    -- Total estimated across all contract vendors
    COALESCE(
        (SELECT SUM(e.estimated_total) 
         FROM estimates e 
         JOIN vendors v ON e.vendor_id = v.id
         WHERE e.project_id = p.id 
           AND e.status = 'active' 
           AND NOT e.is_archived 
           AND NOT v.is_archived
           AND v.type = 'contract'),
        0
    ) AS total_estimated,
    
    -- Total paid (all confirmed receipts)
    COALESCE(
        (SELECT SUM(r.total) 
         FROM receipts r 
         WHERE r.project_id = p.id 
           AND r.status = 'confirmed' 
           AND NOT r.is_archived),
        0
    ) AS total_paid,
    
    -- Total GST paid
    COALESCE(
        (SELECT SUM(r.gst_amount) 
         FROM receipts r 
         WHERE r.project_id = p.id 
           AND r.status = 'confirmed' 
           AND NOT r.is_archived),
        0
    ) AS total_gst,
    
    -- Total PST paid
    COALESCE(
        (SELECT SUM(r.pst_amount) 
         FROM receipts r 
         WHERE r.project_id = p.id 
           AND r.status = 'confirmed' 
           AND NOT r.is_archived),
        0
    ) AS total_pst,
    
    -- Total tax paid
    COALESCE(
        (SELECT SUM(r.tax_total) 
         FROM receipts r 
         WHERE r.project_id = p.id 
           AND r.status = 'confirmed' 
           AND NOT r.is_archived),
        0
    ) AS total_tax,
    
    -- Outstanding (contract only)
    COALESCE(
        (SELECT SUM(e.estimated_total) 
         FROM estimates e 
         JOIN vendors v ON e.vendor_id = v.id
         WHERE e.project_id = p.id 
           AND e.status = 'active' 
           AND NOT e.is_archived 
           AND NOT v.is_archived
           AND v.type = 'contract'),
        0
    ) - COALESCE(
        (SELECT SUM(r.total) 
         FROM receipts r 
         JOIN vendors v ON r.vendor_id = v.id
         WHERE r.project_id = p.id 
           AND r.status = 'confirmed' 
           AND NOT r.is_archived
           AND v.type = 'contract'),
        0
    ) AS total_outstanding,
    
    -- Active vendor count
    (SELECT COUNT(*) FROM vendors v WHERE v.project_id = p.id AND NOT v.is_archived) AS vendor_count,
    
    -- Confirmed receipt count
    (SELECT COUNT(*) FROM receipts r WHERE r.project_id = p.id AND r.status = 'confirmed' AND NOT r.is_archived) AS receipt_count,
    
    -- Inbox count (unprocessed receipts)
    (SELECT COUNT(*) FROM receipts r WHERE r.project_id = p.id AND r.status = 'inbox' AND NOT r.is_archived) AS inbox_count
    
FROM projects p;

-- ============================================================================
-- COMMENTS (for documentation)
-- ============================================================================

COMMENT ON TABLE projects IS 'Shared project container - all data is scoped to a project';
COMMENT ON TABLE project_members IS 'Join table linking auth.users to projects for access control';
COMMENT ON TABLE vendors IS 'Vendors can be Contract (estimate-driven) or Retail (receipt-only)';
COMMENT ON TABLE estimates IS 'Estimates are only for Contract vendors';
COMMENT ON TABLE receipts IS 'Receipts can be linked to estimates or standalone; status tracks inbox vs confirmed';
COMMENT ON TABLE documents IS 'File attachments for vendors, estimates, and receipts';
COMMENT ON COLUMN vendors.tax_province IS 'ON for Ontario HST (13%), QC for Quebec GST+QST (14.975%)';
COMMENT ON COLUMN receipts.gst_amount IS 'Federal portion - 5% of GST or 5/13 of Ontario HST';
COMMENT ON COLUMN receipts.pst_amount IS 'Provincial portion - 8/13 of Ontario HST or 9.975% Quebec QST';
COMMENT ON COLUMN receipts.status IS 'inbox = mobile capture pending review, confirmed = processed and counted in totals';
COMMENT ON FUNCTION search_all IS 'Full-text search across all entity types, returns ranked results';
COMMENT ON VIEW vendor_financial_summary IS 'Computed financial totals per vendor for dashboard and detail pages';
COMMENT ON VIEW estimate_with_balance IS 'Estimates with computed paid_to_date and outstanding balance';
COMMENT ON VIEW project_summary IS 'Project-level KPIs for dashboard';
