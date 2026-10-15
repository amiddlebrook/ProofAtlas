export default {
  "title": "EVIDENCE CARTOGRAPHY",
  "headline": "Every claim has a trail.",
  "tag": "Primary sources, entities, verified claims, and cross-source relations.",
  "layout": "clusters",
  "layers": [
    [
      "documents",
      "documents",
      "Documents"
    ],
    [
      "claims",
      "claims",
      "Claims"
    ],
    [
      "entities",
      "entities",
      "Entities"
    ],
    [
      "relationships",
      "relationships",
      "Relations"
    ]
  ],
  "links": [
    [
      "claims",
      "documents",
      [
        "document_id",
        "document"
      ],
      [
        "id",
        "title"
      ]
    ],
    [
      "relationships",
      "documents",
      [
        "source",
        "target",
        "source_id",
        "target_id"
      ],
      [
        "id",
        "title"
      ]
    ],
    [
      "entities",
      "documents",
      [
        "documents",
        "document_ids"
      ],
      [
        "id",
        "title"
      ]
    ]
  ]
};
