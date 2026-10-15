# ProofAtlas — Phase 26: Ground-truth retrieval evaluation

## Purpose

Computes macro and micro document-level precision@k and recall@k against explicit ground truth, without invoking inference or persisting benchmarks. This is evaluation, not an accuracy guarantee.

## Production API

`POST /api/retrieval/evaluate`

Example: `{"k":5,"checks":[{"query":"renewal","expected_document_ids":["document-id"]}]}`

The endpoint is authenticated through the existing Cloudflare Worker authorization layer. No paid dependency or new mandatory Cloudflare resource is introduced. Production defaults to remote inference disabled; limits and account-wide quotas still apply.

## Interface

The product-specific UI integrates this operation in its existing workflow via `lab-retrieval`. Interactions provide explicit labels and status messages and reuse the application's own visual language.

## Verification

- `npm run check` and `npm run verify:release`
- `npm test`, including `tests/phase26.test.mjs`
- CI and deployment contract checks for the Phase 26 UI and API
- Do not claim browser-level UX acceptance from API smoke tests.

## Not a final enterprise certification

Missing: tenant-level authorization, independent penetration testing, failover/load validation, recoverability drills, realistic end-to-end browser automation and an accessibility audit. These require explicit measured acceptance before any enterprise-production claim.
