-- Two-phase visibility gate for fully indexed documents, preserving all legacy records.
CREATE TABLE IF NOT EXISTS document_ingestion (
  document_id TEXT PRIMARY KEY,
  state TEXT NOT NULL CHECK(state IN ('staging','ready')),
  started_at TEXT NOT NULL,
  finished_at TEXT
);
CREATE INDEX IF NOT EXISTS document_ingestion_state ON document_ingestion(state,started_at);
CREATE VIEW IF NOT EXISTS ready_documents AS
 SELECT d.* FROM documents d
 WHERE NOT EXISTS (SELECT 1 FROM document_ingestion i WHERE i.document_id=d.id AND i.state='staging');
