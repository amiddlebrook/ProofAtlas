<div align="center">

# ProofAtlas

### Know exactly what supports a claim.

Traceable evidence retrieval and claim integrity.

[![CI](https://github.com/amiddlebrook/ProofAtlas/actions/workflows/ci.yml/badge.svg)](https://github.com/amiddlebrook/ProofAtlas/actions/workflows/ci.yml) [![Cloudflare deployment](https://github.com/amiddlebrook/ProofAtlas/actions/workflows/deploy.yml/badge.svg)](https://github.com/amiddlebrook/ProofAtlas/actions/workflows/deploy.yml) [![MIT License](https://img.shields.io/badge/license-MIT-2381C5)](LICENSE) [![Zero mandatory cost](https://img.shields.io/badge/hosting-free--tier%20only-129E80)](docs/ZERO_COST_POLICY.md)

**[Launch application](https://portfolio-proofatlas.averymiddlebrook2014.workers.dev)** · **[▶ WATCH THE 20-SECOND DEMO WITH SOUND](https://portfolio-proofatlas.averymiddlebrook2014.workers.dev/showcase/index.html)** · [Architecture](docs/ARCHITECTURE.md) · [Security](docs/SECURITY.md) · [Roadmap](docs/ROADMAP.md)

[![ProofAtlas — 20-second animated README preview; click to watch the complete narrated video with audio](docs/media/brag-inline.gif)](https://portfolio-proofatlas.averymiddlebrook2014.workers.dev/showcase/index.html)

*The preview loops silently on GitHub. **Click the animation to watch the full 20-second version with spoken narration and sound in your browser**—no download or account required. Real public Cloudflare UI captures with illustrative guest-mode records; no paid AI execution is claimed.*

</div>

---

## The problem

Finding a matching document is not the same as proving a claim. References can drift, excerpts can change, and interrupted indexing can leave a misleading corpus. ProofAtlas binds claims to exact source text and integrity fingerprints, with staged ingestion and measurable retrieval checks.

**ProofAtlas** is an engineering platform for traceable evidence retrieval and claim integrity. Its primary audience is **Researchers, analysts and teams reviewing evidence-heavy decisions**. Investigate source documents, cite precise excerpts and detect evidence drift.

> [!IMPORTANT]
> **Production-deployed engineering portfolio project, not an audited enterprise SaaS.** The Worker, D1-backed API, access-control tests and deployment checks are operational. Single-workspace database ownership is enforced. This is **not** multitenant SSO, third-party security certification, a validated production D1 restore, or an unlimited-cost-free SLA.

## See it work

**[▶ Play the full narrated 20-second product demo (sound + captions)](https://portfolio-proofatlas.averymiddlebrook2014.workers.dev/showcase/index.html).** The animation above remains an autoplaying preview. GitHub cannot attach audio to GIFs; the linked player has native video and audio controls.

**[↗ Try the live guest demo](https://portfolio-proofatlas.averymiddlebrook2014.workers.dev)** · [Storyboard and reproduction](docs/BRAG_DEMO.md) · [Optional high-resolution MP4](docs/media/brag.mp4)

ProofAtlas starts with an illustrative, read-only guest experience. **Authenticated operations require the administrator's API credential**; the README does not publish or distribute access keys.

### The end-to-end path

1. Ingest trusted-by-the-user source text as untrusted input.
2. Stage document chunks and expose the document only after indexing completes.
3. Find relevant source passages in the reading room.
4. Record a claim linked to exact evidence; verify text, hash and classification.
5. Inspect custody snapshots and retrieval-quality ground-truth evaluations.

## Engineering highlights

| Capability | Design decision |
|---|---|
| **Staged ingestion** | Interrupted indexing cannot expose an incomplete document as complete evidence. |
| **Source-specific claims** | Quotes link to exact documents and fail verification if changed. |
| **Custody fingerprints** | Persisted SHA-256 corpus digests expose modifications. |
| **Retrieval quality** | Precision/recall evaluation uses explicit relevance ground truth. |

## Architecture

```mermaid
flowchart LR
  D[Document import] --> S[(D1 staging)]
  S --> I[Complete indexing]
  I --> C[(Searchable corpus)]
  C --> Q[Retriever]
  Q --> V[Source-linked claims]
  V --> P[(Provenance snapshots)]
  P --> K[Integrity verification]
```

**Frontend:** responsive JavaScript/CSS on Cloudflare Workers static assets.  
**API:** TypeScript Cloudflare Worker with validated, scoped endpoints.  
**Persistence:** a dedicated Cloudflare D1 database for this single-workspace application.  
**Automation:** GitHub Actions for tests, migration integrity, live Cloudflare deployment, authenticated smoke checks and Chromium browser verification.  
**AI inference:** optional Workers AI, disabled in production by default; budget enforced if deliberately enabled.

**The engineering emphasis:** Fail-closed staged indexing, source digest validation, classification drift checks, immutable reference linkage and corpus-level custody snapshots.

## Run your own instance

**Requirements:** Node.js 22+, npm, a GitHub account and a Cloudflare account with available Free-plan capacity.

```bash
git clone https://github.com/amiddlebrook/ProofAtlas.git
cd ProofAtlas
npm ci
npm run check
npm test
npm run db:local
npm run dev
```

Open the local URL printed by Wrangler. Local development uses a **local D1 instance**, not the live portfolio database. To deploy your own environment, create a unique D1 database, configure `wrangler.jsonc` to reference **your own account and database**, set a secret administrator token with `wrangler secret put ADMIN_TOKEN`, run `npm run db:remote`, then `npm run deploy`. **Never reuse the portfolio project's deployment target or publish secrets.**

Production deployments require the account's GitHub Actions repository secrets for Cloudflare authentication and the application administrator; see [`docs/OPERATIONS.md`](docs/OPERATIONS.md) and [`docs/SECURITY.md`](docs/SECURITY.md).

## Verification and operational controls

| Gate | Command or workflow | What it establishes |
|---|---|---|
| TypeScript and syntax | `npm run check` | Type soundness and frontend syntax |
| Domain and security tests | `npm test` | Isolated SQLite/D1-style integration and negative cases |
| Reproducible build | `npm run verify:release` | Locked dependencies, migration and asset integrity |
| Database restore drill | `npm run verify:recovery` | Synthetic schema/data backup→restore integrity |
| Scoped live credentials | `npm run verify:auth-live` | Production key creation, restriction and revocation |
| Live browser acceptance | `npm run verify:browser` | Cloudflare desktop/mobile guest and authenticated navigation |
| Edge latency sample | `npm run verify:edge` | 24 bounded read-only health requests; **not** a load SLA |

Every push to `main` triggers GitHub CI and Cloudflare deployment. Production-release checks include a dedicated Worker/D1 ownership fence, scoped credential lifecycle, free-tier budget policy, browser screens, and restoration rehearsal. [Inspect the deploy workflow](.github/workflows/deploy.yml).

## Zero-cost operating model

This repository uses **only free-tier-compatible Cloudflare and GitHub services** and adds application-level daily quotas. Remote AI is disabled by default. When a supported quota is exceeded, the operation is rejected rather than silently falling back to a paid service. Cloudflare's provider-side allocations are shared across the account where applicable; **unlimited use for $0 is not promised**. [Quota design and limitations](docs/ZERO_COST_POLICY.md).

## Security boundaries and trade-offs

- Each product has its own Worker, database binding and immutable runtime workspace ownership record.
- Private API routes require an administrator credential or appropriately scoped, expiring delegated key; credentials are never embedded in the frontend.
- Revocation, approvals and other security-critical transitions are guarded by atomic SQLite state changes and audited where implemented.
- The public guest experience displays **illustrative data**, not real customer information.
- **Out of scope today:** Document ACLs, production OCR pipeline and signed artifact storage remain future scope. Production restoration from real customer data and third-party penetration testing have not been demonstrated.

See the explicit [security model](docs/SECURITY.md), [architecture trade-offs](docs/ARCHITECTURE.md) and [production-readiness backlog](docs/ROADMAP.md).

## Repository map

```text
public/         Distinctive product interface, styles and static assets
src/            Cloudflare Worker, domain APIs, security and free-tier policy
migrations/     Versioned D1 schema and transactional safeguards
tests/          Domain regression, security and contract tests
scripts/        Release checks, browser verification and BRAG video renderer
.github/        CI, Cloudflare deployment and demo publication workflows
docs/           Architecture, operations, decisions, media and demos
```

## What's next

- [ ] Per-document read ACLs
- [ ] OCR/PDF ingestion with parsing QA
- [ ] Immutable R2 blobs and signed provenance manifests

**License:** [MIT](LICENSE). **Demo method:** [BRAG-slim](https://github.com/latent-spaces/brag/tree/main/skills/brag-slim), using actual guest UI captures and a reproducible, no-paid-service video renderer. [Full video](docs/media/brag.mp4).
