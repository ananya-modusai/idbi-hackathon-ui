export const linkagesData = {
  networkOverview: {
    total_connections: 400,
    high_risk_connections: 0,
    id: "2c720d1b-7a9f-4133-bdb0-8a477e99bee8",
    directors_count: 14,
    network_risk_score: 0,
    merchant_id: "ba297a48-1a40-4204-83e5-edd28772362b",
    created_at: "2025-01-12T18:01:56.238941",
  },
  firstDegreeCommunity: {
    entities: [
      {
        merchant_id: "ba297a48-1a40-4204-83e5-edd28772362b",
        id: "first-1",
        relationship_type: "SAME_PHONE",
        related_entity_id: "entity-1",
        related_entity_name: "Britannia Industries",
        created_at: "2025-01-12T18:01:56.232653",
      },
      {
        merchant_id: "ba297a48-1a40-4204-83e5-edd28772362b",
        id: "first-2",
        relationship_type: "SAME_EMAIL",
        related_entity_id: "entity-2",
        related_entity_name: "MDH Spices",
        created_at: "2025-01-12T18:01:56.232673",
      },
      {
        merchant_id: "ba297a48-1a40-4204-83e5-edd28772362b",
        id: "first-3",
        relationship_type: "SAME_ADDRESS",
        related_entity_id: "entity-3",
        related_entity_name: "Haldiram's",
        created_at: "2025-01-12T18:01:56.232673",
      },
      {
        merchant_id: "ba297a48-1a40-4204-83e5-edd28772362b",
        id: "first-4",
        relationship_type: "SAME_PHONE",
        related_entity_id: "entity-4",
        related_entity_name: "Parle Agro",
        created_at: "2025-01-12T18:01:56.232673",
      }
    ],
    edges: [
      {
        fromNode: "ba297a48-1a40-4204-83e5-edd28772362b",
        toNode: "entity-1",
        relationship_type: "SAME_PHONE"
      },
      {
        fromNode: "ba297a48-1a40-4204-83e5-edd28772362b",
        toNode: "entity-2",
        relationship_type: "SAME_EMAIL"
      },
      {
        fromNode: "ba297a48-1a40-4204-83e5-edd28772362b",
        toNode: "entity-3",
        relationship_type: "SAME_ADDRESS"
      },
      {
        fromNode: "ba297a48-1a40-4204-83e5-edd28772362b",
        toNode: "entity-4",
        relationship_type: "SAME_PHONE"
      }
    ]
  },
  secondDegreeCommunity: {
    entities: [
      {
        merchant_id: "ba297a48-1a40-4204-83e5-edd28772362b",
        id: "first-1",
        relationship_type: "SAME_PHONE",
        related_entity_id: "entity-1",
        related_entity_name: "Britannia Industries",
        created_at: "2025-01-12T18:01:56.232653",
      },
      {
        merchant_id: "ba297a48-1a40-4204-83e5-edd28772362b",
        id: "first-2",
        relationship_type: "SAME_EMAIL",
        related_entity_id: "entity-2",
        related_entity_name: "MDH Spices",
        created_at: "2025-01-12T18:01:56.232673",
      },
      {
        merchant_id: "ba297a48-1a40-4204-83e5-edd28772362b",
        id: "first-3",
        relationship_type: "SAME_ADDRESS",
        related_entity_id: "entity-3",
        related_entity_name: "Haldiram's",
        created_at: "2025-01-12T18:01:56.232673",
      },
      {
        merchant_id: "ba297a48-1a40-4204-83e5-edd28772362b",
        id: "first-4",
        relationship_type: "SAME_PHONE",
        related_entity_id: "entity-4",
        related_entity_name: "Parle Agro",
        created_at: "2025-01-12T18:01:56.232673",
      },
      {
        merchant_id: "ba297a48-1a40-4204-83e5-edd28772362b",
        id: "second-1",
        relationship_type: "SAME_EMAIL",
        related_entity_id: "entity-5",
        related_entity_name: "Nestle India",
        created_at: "2025-01-12T18:01:56.232653",
      },
      {
        merchant_id: "ba297a48-1a40-4204-83e5-edd28772362b",
        id: "second-2",
        relationship_type: "SAME_ADDRESS",
        related_entity_id: "entity-6",
        related_entity_name: "Dabur India",
        created_at: "2025-01-12T18:01:56.232653",
      },
      {
        merchant_id: "ba297a48-1a40-4204-83e5-edd28772362b",
        id: "second-3",
        relationship_type: "SAME_PHONE",
        related_entity_id: "entity-7",
        related_entity_name: "Amul",
        created_at: "2025-01-12T18:01:56.232653",
      }
    ],
    edges: [
      {
        fromNode: "ba297a48-1a40-4204-83e5-edd28772362b",
        toNode: "entity-1",
        relationship_type: "SAME_PHONE"
      },
      {
        fromNode: "ba297a48-1a40-4204-83e5-edd28772362b",
        toNode: "entity-2",
        relationship_type: "SAME_EMAIL"
      },
      {
        fromNode: "ba297a48-1a40-4204-83e5-edd28772362b",
        toNode: "entity-3",
        relationship_type: "SAME_ADDRESS"
      },
      {
        fromNode: "ba297a48-1a40-4204-83e5-edd28772362b",
        toNode: "entity-4",
        relationship_type: "SAME_PHONE"
      },
      {
        fromNode: "entity-1",
        toNode: "entity-5",
        relationship_type: "SAME_EMAIL"
      },
      {
        fromNode: "entity-2",
        toNode: "entity-6",
        relationship_type: "SAME_ADDRESS"
      },
      {
        fromNode: "entity-3",
        toNode: "entity-7",
        relationship_type: "SAME_PHONE"
      }
    ]
  },
  thirdDegreeCommunity: {
    entities: [
      {
        merchant_id: "ba297a48-1a40-4204-83e5-edd28772362b",
        id: "first-1",
        relationship_type: "SAME_PHONE",
        related_entity_id: "entity-1",
        related_entity_name: "Britannia Industries",
        created_at: "2025-01-12T18:01:56.232653",
      },
      {
        merchant_id: "ba297a48-1a40-4204-83e5-edd28772362b",
        id: "first-2",
        relationship_type: "SAME_EMAIL",
        related_entity_id: "entity-2",
        related_entity_name: "MDH Spices",
        created_at: "2025-01-12T18:01:56.232673",
      },
      {
        merchant_id: "ba297a48-1a40-4204-83e5-edd28772362b",
        id: "first-3",
        relationship_type: "SAME_ADDRESS",
        related_entity_id: "entity-3",
        related_entity_name: "Haldiram's",
        created_at: "2025-01-12T18:01:56.232673",
      },
      {
        merchant_id: "ba297a48-1a40-4204-83e5-edd28772362b",
        id: "first-4",
        relationship_type: "SAME_PHONE",
        related_entity_id: "entity-4",
        related_entity_name: "Parle Agro",
        created_at: "2025-01-12T18:01:56.232673",
      },
      {
        merchant_id: "ba297a48-1a40-4204-83e5-edd28772362b",
        id: "second-1",
        relationship_type: "SAME_EMAIL",
        related_entity_id: "entity-5",
        related_entity_name: "Nestle India",
        created_at: "2025-01-12T18:01:56.232653",
      },
      {
        merchant_id: "ba297a48-1a40-4204-83e5-edd28772362b",
        id: "second-2",
        relationship_type: "SAME_ADDRESS",
        related_entity_id: "entity-6",
        related_entity_name: "Dabur India",
        created_at: "2025-01-12T18:01:56.232653",
      },
      {
        merchant_id: "ba297a48-1a40-4204-83e5-edd28772362b",
        id: "second-3",
        relationship_type: "SAME_PHONE",
        related_entity_id: "entity-7",
        related_entity_name: "Amul",
        created_at: "2025-01-12T18:01:56.232653",
      },
      {
        merchant_id: "ba297a48-1a40-4204-83e5-edd28772362b",
        id: "third-1",
        relationship_type: "SAME_PHONE",
        related_entity_id: "entity-8",
        related_entity_name: "ITC Limited",
        created_at: "2025-01-12T18:01:56.232653",
      },
      {
        merchant_id: "ba297a48-1a40-4204-83e5-edd28772362b",
        id: "third-2",
        relationship_type: "SAME_EMAIL",
        related_entity_id: "entity-9",
        related_entity_name: "Tata Consumer",
        created_at: "2025-01-12T18:01:56.232653",
      },
      {
        merchant_id: "ba297a48-1a40-4204-83e5-edd28772362b",
        id: "third-3",
        relationship_type: "SAME_ADDRESS",
        related_entity_id: "entity-10",
        related_entity_name: "Patanjali",
        created_at: "2025-01-12T18:01:56.232653",
      }
    ],
    edges: [
      {
        fromNode: "ba297a48-1a40-4204-83e5-edd28772362b",
        toNode: "entity-1",
        relationship_type: "SAME_PHONE"
      },
      {
        fromNode: "ba297a48-1a40-4204-83e5-edd28772362b",
        toNode: "entity-2",
        relationship_type: "SAME_EMAIL"
      },
      {
        fromNode: "ba297a48-1a40-4204-83e5-edd28772362b",
        toNode: "entity-3",
        relationship_type: "SAME_ADDRESS"
      },
      {
        fromNode: "ba297a48-1a40-4204-83e5-edd28772362b",
        toNode: "entity-4",
        relationship_type: "SAME_PHONE"
      },
      {
        fromNode: "entity-1",
        toNode: "entity-5",
        relationship_type: "SAME_EMAIL"
      },
      {
        fromNode: "entity-2",
        toNode: "entity-6",
        relationship_type: "SAME_ADDRESS"
      },
      {
        fromNode: "entity-3",
        toNode: "entity-7",
        relationship_type: "SAME_PHONE"
      },
      {
        fromNode: "entity-5",
        toNode: "entity-8",
        relationship_type: "SAME_PHONE"
      },
      {
        fromNode: "entity-6",
        toNode: "entity-9",
        relationship_type: "SAME_EMAIL"
      },
      {
        fromNode: "entity-7",
        toNode: "entity-10",
        relationship_type: "SAME_ADDRESS"
      }
    ]
  },
  commonConnections: [
    {
      connection_type: "phone",
      connection_value: "9476865411",
      shared_with: [
        "Britannia Industries",
        "MDH Spices"
      ],
    },
  ],
  adjacencyList: {
    "ba297a48-1a40-4204-83e5-edd28772362b": [
      {
        node: "entity-1",
        relationship_type: "SAME_PHONE",
      },
      {
        node: "entity-2",
        relationship_type: "SAME_EMAIL",
      },
      {
        node: "entity-3",
        relationship_type: "SAME_ADDRESS",
      },
      {
        node: "entity-4",
        relationship_type: "SAME_PHONE",
      }
    ],
  },
};
