CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY,title TEXT NOT NULL,source TEXT NOT NULL,classification TEXT NOT NULL,content TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS chunks (id TEXT PRIMARY KEY,document_id TEXT NOT NULL REFERENCES documents(id),ordinal INTEGER NOT NULL,body TEXT NOT NULL);
CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(body,content='chunks',content_rowid='rowid');
CREATE TRIGGER IF NOT EXISTS chunks_ai AFTER INSERT ON chunks BEGIN INSERT INTO chunks_fts(rowid,body) VALUES(new.rowid,new.body); END;
CREATE TRIGGER IF NOT EXISTS chunks_ad AFTER DELETE ON chunks BEGIN INSERT INTO chunks_fts(chunks_fts,rowid,body) VALUES('delete',old.rowid,old.body); END;
CREATE TABLE IF NOT EXISTS entities (id TEXT PRIMARY KEY,document_id TEXT NOT NULL REFERENCES documents(id),kind TEXT NOT NULL,value TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS chunk_doc ON chunks(document_id);
CREATE INDEX IF NOT EXISTS entity_value ON entities(value,kind);
