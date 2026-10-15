# Phase 28 — Fail-closed evidence ingestion

ProofAtlas ingests text, splits it into searchable passages, indexes extracted entities and can attach source-linked claims. Previously these writes occurred one at a time while a new document was immediately visible to retrieval, risking incomplete search evidence after an interrupted indexing request.

The `0014_document_ingestion.sql` migration now introduces a `document_ingestion` state table and `ready_documents` SQL view, preserving the original document table and every previously stored record. Ingest requests reserve a hidden staging identifier **before** writing document content. Passage/entity indexing runs while the document is staging; only once all writes succeed does it become `ready`. Search, retrieval evaluation, evidence, investigation, catalog, and application overview reads use the ready view, so partially indexed documents do not become valid sources.

Daily free-tier maintenance prunes staging entries older than 24 hours, including abandoned content, chunks and entities. The maintenance is idempotent: a failed cleanup may leave hidden rows for the next run but cannot make an unfinished document searchable.

Three SQL-backed tests prove success, staging exclusion, and interrupted indexing with eventual cleanup. Deployment requires release migration checks, authenticated live API checks and production desktop/mobile Chromium verification. **No new paid Cloudflare service is required.**

Limits: Cloudflare Workers and D1 free quotas bound document size and ingest volume. This is not an OCR/PDF parser, document-specific user ACL, transactionally guaranteed external storage, or immutable signed source manifest.
