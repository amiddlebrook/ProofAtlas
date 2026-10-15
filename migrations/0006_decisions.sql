CREATE TABLE IF NOT EXISTS investigation_cases(id TEXT PRIMARY KEY,title TEXT NOT NULL,question TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN ('open','closed')),created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS investigation_sources(case_id TEXT NOT NULL REFERENCES investigation_cases(id),document_id TEXT NOT NULL REFERENCES documents(id),rationale TEXT NOT NULL,added_at TEXT NOT NULL,PRIMARY KEY(case_id,document_id));
CREATE TABLE IF NOT EXISTS investigation_notes(id TEXT PRIMARY KEY,case_id TEXT NOT NULL REFERENCES investigation_cases(id),note TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_inv_notes_case ON investigation_notes(case_id,created_at DESC);
