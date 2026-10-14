# ProofAtlas | Architecture decision and design review

**Scope:** Evidence-grounded document intelligence. Standalone deployment on Cloudflare Workers, static assets, D1 and optionally Workers AI within the free allowances.

## System boundaries

D1 holds raw text and FTS5 chunks, deterministic entity extraction. Proof ledger stores source chunk identity, exact quote, and SHA-256 hash. Source mutation is detectable on verification.

All persistent data is stored in per-application D1. The application frontend and API are deployed together via one Worker; no external hosted DB or paid queue is assumed. GitHub Actions runs TypeScript checks, smoke/integration tests, D1 migrations and Wrangler deployment. The deployment runs a live HTTP smoke check of the Worker URL.

## API integrity

- All `/api/*` routes except `/api/health` are protected by a Worker `ADMIN_TOKEN` bearer secret for the current **single-administrator demo**.
- State-changing methods use parameterized SQL and validation. Detailed `400`, `409`, and `422` responses avoid ambiguous success.
- Existing D1 rows survive deploys; each migration is additive and idempotently tracked by Wrangler.
- The new `0002_advanced.sql` migration installs the application-specific governance and reliability tables.
- JSON responses are uncached. The UI uses `sessionStorage` for the token, not checked-in configuration.

## Domain failure modes

- Prompt injection in source docs: retrieved text is untrusted data, not system instructions.
- Ungrounded LLM claims: linked evidence is inspected and independently verified by quote presence.
- Source tampering: SHA-256 of the stored chunk detects changes.
- Classification leakage: all endpoints currently require a single admin credential; no multi-principal ACLs yet.

## Verification

- `npm run check`: TypeScript strict-mode compilation and frontend syntax.
- `npm test`: SQLite-backed integration tests using a deterministic Workers AI test adapter; never conflated with production provider responses.
- `npm run verify:live`: health, static site, and unauthorized API contract after deployment.
- Provisioning script reuses D1 databases and applies migrations before each deployment.

## Design tradeoffs

Free-tier hosting deliberately limits scope. This is not a horizontally scalable, multi-tenant production system; global SLAs, audited governance and paid provider budgets cannot be validated with tiny synthetic workloads. No paid upgrade should occur automatically.
