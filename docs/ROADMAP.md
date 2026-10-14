# ProofAtlas | Production-readiness backlog

These are outstanding engineering requirements, not completed capabilities.

1. Per-document ACL and authorization filtering before retrieval, tenant scope.
2. Versioned immutable blob storage with R2 and signed provenance manifests.
3. OCR/structured parser pipeline with controlled batch ingestion.
4. Retrieval evaluation set with precision@k and answer faithfulness measurements.

5. External security assessment, threat-model review and scoped tenant identities.
6. Load testing on realistic datasets at stated quotas; baseline p95/p99 and error budgets.
7. Backup/restore drills, deletion/data retention policies, GDPR-related controls where applicable.
8. Accessibility audit, keyboard-only testing, browser E2E and cross-device coverage.
9. SBOM, dependency review, branch protection and deployment provenance/rollback.
10. Production observability and alerting with measured owner response times.
