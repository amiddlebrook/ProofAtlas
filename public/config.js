export default {
  "name": "ProofAtlas",
  "tagline": "Evidence-grounded document intelligence",
  "accent": "#6fc7b2",
  "icon": "⌁",
  "sections": [
    {"id":"citationlab","label":"Citation Ledger","custom":"domainlab"},
    {"id":"mission","label":"Reading Room","custom":"mission"},
    {"id":"registry","label":"Records Explorer","custom":"registry"},
    {
      "id": "atlas",
      "label": "Live Atlas",
      "custom": "atlas"
    },
    {
      "id": "agent",
      "label": "Research Agent",
      "custom": "agent"
    },
    {
      "id": "decisions",
      "label": "Casebooks",
      "custom": "decisions"
    },
    {
      "id": "ops",
      "label": "API Activity",
      "custom": "ops"
    },
    {
      "id": "studio",
      "label": "Evidence Atlas",
      "custom": "studio"
    },
    {
      "id": "documents",
      "label": "Documents",
      "endpoint": "/api/documents",
      "fields": [
        {
          "name": "title",
          "type": "text"
        },
        {
          "name": "source",
          "type": "text",
          "default": "manual"
        },
        {
          "name": "classification",
          "type": "select",
          "options": [
            "public",
            "internal",
            "confidential"
          ]
        },
        {
          "name": "content",
          "type": "textarea",
          "default": "Agreement CTR-1041\nVendor: Example Software, Inc.\nAnnual renewal: 2027-01-01.\nTotal: $15,000. Contact procurement@example.com."
        }
      ],
      "columns": [
        "title",
        "source",
        "classification",
        "characters",
        "created_at"
      ]
    },
    {
      "id": "search",
      "label": "Search & Q&A",
      "custom": "ask"
    },
    {
      "id": "entities",
      "label": "Entities",
      "endpoint": "/api/entities",
      "columns": [
        "kind",
        "value",
        "document_count",
        "documents"
      ]
    },
    {
      "id": "relationships",
      "label": "Knowledge Graph",
      "endpoint": "/api/relationships",
      "columns": [
        "source",
        "target",
        "shared_entities"
      ]
    },
    {
      "id": "claims",
      "label": "Verified Claims",
      "endpoint": "/api/claims",
      "columns": [
        "assertion",
        "document",
        "quote",
        "source_classification",
        "created_at"
      ]
    },
    {
      "id": "evidence-review",
      "label": "Evidence Review",
      "custom": "claims"
    },
    {
      "id": "custody",
      "label": "Chain of Custody",
      "endpoint": "/api/provenance/snapshots",
      "columns": [
        "label",
        "document_count",
        "claim_count",
        "created_at"
      ],
      "fields": [
        {
          "name": "label",
          "type": "text",
          "default": "Quarterly evidence anchor"
        }
      ],
      "action": {
        "title": "Verify evidence anchor",
        "endpoint": "/api/provenance/snapshots/{id}/verify",
        "input": []
      }
    }
  ]
};
