CREATE TABLE IF NOT EXISTS claims (id TEXT PRIMARY KEY,document_id TEXT NOT NULL REFERENCES documents(id),chunk_id TEXT NOT NULL REFERENCES chunks(id),quote TEXT NOT NULL,assertion TEXT NOT NULL,sha256 TEXT NOT NULL,source_classification TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_claims_doc ON claims(document_id,created_at DESC);
