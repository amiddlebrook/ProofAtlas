CREATE INDEX IF NOT EXISTS idx_catalog_claims_cursor ON claims(created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS idx_catalog_documents_cursor ON documents(created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS idx_catalog_investigation_cases_cursor ON investigation_cases(created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS idx_catalog_provenance_snapshots_cursor ON provenance_snapshots(created_at DESC,id DESC);
