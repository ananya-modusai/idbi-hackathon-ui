export interface CBReason {
  cardType: 'VISA' | 'MC';
  code: string;
  category: string;
  preventable: 'Yes' | 'No';
  reversible: 'Yes' | 'No';
}

export interface MerchantReconData {
  status: 'Reconciled' | 'Not Reconciled';
  input: {
    merchantNameInNotification: string;
  };
  intermediate: {
    matchPercentage: number;
  };
  output: {
    internalMerchantName: string;
    internalMerchantId: string;
  };
}

export interface TransactionReconData {
  status: 'Reconciled' | 'Not Reconciled';
  input: {
    bankRefNumberInNotification: string;
  };
  intermediate: {
    matchPercentage: number;
  };
  output: {
    internalBankRefNo: string;
    internalTransactionId: string;
    originalTransactionAmount: number;
  };
}

export interface PAAccountReconData {
  status: 'Reconciled' | 'Not Reconciled';
  input: {
    chargebackAmount: number;
    merchantName: string;
    notifierBank: string;
    notificationDatetime: string;
    transactionCurrency: string;
  };
  intermediate: {
    matchPercentage: number;
  };
  output: {
    debitLedgerEntry: string;
    debitBankRefNo: string;
    debitAmount: number;
    debitDatetime: string;
  };
}

export interface MerchantLedgerReconData {
  status: 'Reconciled' | 'Not Reconciled';
  input: {
    chargebackAmount: number;
    merchantName: string;
    internalTransactionId: string;
    notificationDatetime: string;
  };
  intermediate: {
    matchPercentage: number;
  };
  output: {
    merchantDebitLedgerEntry: string;
    merchantDebitAmount: number;
    merchantDebitDatetime: string;
  };
}

export interface ReconStatus {
  overallStatus: 'Reconciled' | 'Not Reconciled';
  merchantRecon: MerchantReconData;
  transactionRecon: TransactionReconData;
  paAccountRecon: PAAccountReconData;
  merchantLedgerRecon: MerchantLedgerReconData;
}

// Event Types
export interface BaseEvent {
  eventId: string;
  connectedCBCaseId: string;
  eventType: 'Email' | 'Bank Portal' | 'SFTP' | 'Note' | 'Doc Upload' | 'Status Change';
  eventDatetime: string;
}

export interface EmailEvent extends BaseEvent {
  eventType: 'Email';
  emailEventIdentifier: string;
  senderEmailId: string;
  senderName: string;
  concernedMerchantId: string;
  emailDirection: 'Inbound' | 'Outbound';
  emailTitle: string;
  emailSummary: string;
  emailContent: string;
  attachedDocs: string[]; // Doc Event IDs
}

export interface BankPortalEvent extends BaseEvent {
  eventType: 'Bank Portal';
  bankPortalEventIdentifier: string;
  actionType: 'Case Creation' | 'Note Creation' | 'Doc Upload' | 'Response Email Creation' | 'Case Report Creation';
  bankPortalEventCreatorEmail: string;
}

export interface SFTPEvent extends BaseEvent {
  eventType: 'SFTP';
  sftpEventIdentifier: string;
  uploadedDocId: string;
  sftpEventCreatorEmail: string;
}

export interface DocEvent extends BaseEvent {
  eventType: 'Doc Upload';
  uploadChannel: 'Email' | 'Bank Portal' | 'SFTP';
  connectedEventIdentifier: string;
  docId: string;
  docStorageAddress: string;
  docFormat: 'PDF' | 'Image' | 'Word' | 'Others';
  docType: 'Invoice' | 'Delivery Proof' | 'Terms & Policy' | 'Others';
  docTitle: string;
  docSummary: string;
}

export interface NoteEvent extends BaseEvent {
  eventType: 'Note';
  noteEventIdentifier: string;
  noteCreatorEmail: string;
  noteTitle: string;
  noteContent: string;
  noteCategory: 'Investigation' | 'Resolution' | 'Communication' | 'Internal' | 'Others';
  isInternal: boolean;
}

export interface StatusChangeEvent extends BaseEvent {
  eventType: 'Status Change';
  statusChangeEventIdentifier: string;
  previousStatus: 'Open' | 'In Progress' | 'Closed' | 'Pending Review' | 'Escalated' | 'On Hold';
  newStatus: 'Open' | 'In Progress' | 'Closed' | 'Pending Review' | 'Escalated' | 'On Hold';
  changeReason: string;
  changedByEmail: string;
  approvalRequired: boolean;
  approvedByEmail?: string;
}

export type CaseEvent = EmailEvent | BankPortalEvent | SFTPEvent | DocEvent | NoteEvent | StatusChangeEvent;

export interface CaseHistory {
  caseId: string;
  eventIds: string[];
}

export interface ChargebackCase {
  caseId: string;
  caseTitle: string;
  merchantName: string;
  createdDateTime: string;
  chargebackAmount: number;
  status: 'Open' | 'In Progress' | 'Closed';
  CBReason: CBReason;
  queueType: 'Auto Approve' | 'Quick Review' | 'Manual Review';
  caseChannel: 'Bank Portal' | 'Email' | 'SFTP';
  reconStatus: ReconStatus;
  assignedTo: string;
  eventHistory: string[]; // Event IDs
}

// Sample Events Data
export const emailEvents: EmailEvent[] = [
  {
    eventId: "EVT-EM-001",
    connectedCBCaseId: "CB-2024-001",
    eventType: "Email",
    eventDatetime: "2024-01-15T09:45:00Z",
    emailEventIdentifier: "EM001",
    senderEmailId: "dispute.team@hdfc.com",
    senderName: "HDFC Bank Dispute Team",
    concernedMerchantId: "MRCH-TS-001",
    emailDirection: "Inbound",
    emailTitle: "Chargeback Notification - Transaction Dispute Case CB-2024-001",
    emailSummary: "Initial chargeback notification for fraudulent transaction dispute from cardholder. Customer claims unauthorized transaction of $1,250.00 on TechStore Solutions.",
    emailContent: "Dear Payment Processor,\n\nWe are writing to notify you of a chargeback dispute filed by our cardholder for transaction reference 240115789012345. The cardholder claims this transaction was unauthorized and fraudulent.\n\nTransaction Details:\n- Amount: $1,250.00\n- Date: 2024-01-15\n- Merchant: TechStore Solutions\n- Card ending: ****4521\n\nPlease provide supporting documentation within 7 business days.\n\nRegards,\nHDFC Bank Dispute Team",
    attachedDocs: ["EVT-DOC-001", "EVT-DOC-002"]
  }
];

export const bankPortalEvents: BankPortalEvent[] = [
  {
    eventId: "EVT-BP-001",
    connectedCBCaseId: "CB-2024-001",
    eventType: "Bank Portal",
    eventDatetime: "2024-01-15T09:30:00Z",
    bankPortalEventIdentifier: "BP001",
    actionType: "Case Creation",
    bankPortalEventCreatorEmail: "system@PA.com"
  }
];

export const sftpEvents: SFTPEvent[] = [
  {
    eventId: "EVT-SFTP-001",
    connectedCBCaseId: "CB-2024-001",
    eventType: "SFTP",
    eventDatetime: "2024-01-15T14:20:00Z",
    sftpEventIdentifier: "SFTP001",
    uploadedDocId: "DOC003",
    sftpEventCreatorEmail: "john.smith@PA.com"
  }
];

export const docEvents: DocEvent[] = [
  {
    eventId: "EVT-DOC-001",
    connectedCBCaseId: "CB-2024-001",
    eventType: "Doc Upload",
    eventDatetime: "2024-01-15T09:45:00Z",
    uploadChannel: "Email",
    connectedEventIdentifier: "EM001",
    docId: "DOC001",
    docStorageAddress: "/docs/chargebacks/2024/01/CB-2024-001/chargeback_notification.pdf",
    docFormat: "PDF",
    docType: "Others",
    docTitle: "Chargeback Notification Document",
    docSummary: "Official chargeback notification from HDFC Bank containing transaction details and dispute reason code 4855."
  },
  {
    eventId: "EVT-DOC-002",
    connectedCBCaseId: "CB-2024-001",
    eventType: "Doc Upload",
    eventDatetime: "2024-01-15T09:45:00Z",
    uploadChannel: "Email",
    connectedEventIdentifier: "EM001",
    docId: "DOC002",
    docStorageAddress: "/docs/chargebacks/2024/01/CB-2024-001/transaction_receipt.pdf",
    docFormat: "PDF",
    docType: "Invoice",
    docTitle: "Original Transaction Receipt",
    docSummary: "Transaction receipt showing purchase details from TechStore Solutions for the disputed amount of $1,250.00."
  },
  {
    eventId: "EVT-DOC-003",
    connectedCBCaseId: "CB-2024-001",
    eventType: "Doc Upload",
    eventDatetime: "2024-01-15T14:20:00Z",
    uploadChannel: "SFTP",
    connectedEventIdentifier: "SFTP001",
    docId: "DOC003",
    docStorageAddress: "/docs/chargebacks/2024/01/CB-2024-001/merchant_response.pdf",
    docFormat: "PDF",
    docType: "Delivery Proof",
    docTitle: "Merchant Response with Delivery Proof",
    docSummary: "Merchant's response document including delivery confirmation, shipping tracking details, and customer authorization evidence."
  }
];

export const noteEvents: NoteEvent[] = [
  {
    eventId: "EVT-NOTE-001",
    connectedCBCaseId: "CB-2024-001",
    eventType: "Note",
    eventDatetime: "2024-01-15T11:30:00Z",
    noteEventIdentifier: "NOTE001",
    noteCreatorEmail: "john.smith@PA.com",
    noteTitle: "Initial Case Assessment",
    noteContent: "Reviewed chargeback notification. Customer claims fraudulent transaction but merchant has strong evidence including delivery confirmation and matching billing address. Recommend challenging the chargeback with comprehensive response package.",
    noteCategory: "Investigation",
    isInternal: true
  }
];

export const statusChangeEvents: StatusChangeEvent[] = [
  {
    eventId: "EVT-STATUS-001",
    connectedCBCaseId: "CB-2024-001",
    eventType: "Status Change",
    eventDatetime: "2024-01-15T09:30:00Z",
    statusChangeEventIdentifier: "STATUS001",
    previousStatus: "Open",
    newStatus: "In Progress",
    changeReason: "Case assigned to analyst for detailed investigation",
    changedByEmail: "system@PA.com",
    approvalRequired: false
  }
];

// Consolidated events array
export const allCaseEvents: CaseEvent[] = [
  ...emailEvents,
  ...bankPortalEvents,
  ...sftpEvents,
  ...docEvents,
  ...noteEvents,
  ...statusChangeEvents
];

// Case History mapping
export const caseHistoryData: CaseHistory[] = [
  {
    caseId: "CB-2024-001",
    eventIds: ["EVT-BP-001", "EVT-EM-001", "EVT-DOC-001", "EVT-DOC-002", "EVT-STATUS-001", "EVT-NOTE-001", "EVT-SFTP-001", "EVT-DOC-003"]
  }
];

export const chargebackCasesSampleData: ChargebackCase[] = [
  {
    caseId: "CB-2024-001",
    caseTitle: "Fraudulent Transaction Dispute",
    merchantName: "TechStore Solutions",
    createdDateTime: "2024-01-15T09:30:00Z",
    chargebackAmount: 1250.00,
    status: "In Progress",
    CBReason: {
      cardType: "VISA",
      code: "4855",
      category: "Goods/Services Not Provided",
      preventable: "Yes",
      reversible: "Yes"
    },
    queueType: "Manual Review",
    caseChannel: "Bank Portal",
    reconStatus: {
      overallStatus: "Not Reconciled",
      merchantRecon: {
        status: "Not Reconciled",
        input: {
          merchantNameInNotification: "TechStore Solutions"
        },
        intermediate: {
          matchPercentage: 85
        },
        output: {
          internalMerchantName: "TechStore Solutions Pvt Ltd",
          internalMerchantId: "MRCH-TS-001"
        }
      },
      transactionRecon: {
        status: "Reconciled",
        input: {
          bankRefNumberInNotification: "240115789012345"
        },
        intermediate: {
          matchPercentage: 100
        },
        output: {
          internalBankRefNo: "240115789012345",
          internalTransactionId: "TXN-24-001-789",
          originalTransactionAmount: 1250.00
        }
      },
      paAccountRecon: {
        status: "Reconciled",
        input: {
          chargebackAmount: 1250.00,
          merchantName: "TechStore Solutions",
          notifierBank: "HDFC Bank",
          notificationDatetime: "2024-01-15T09:30:00Z",
          transactionCurrency: "USD"
        },
        intermediate: {
          matchPercentage: 95
        },
        output: {
          debitLedgerEntry: "LDG-PA-24-001",
          debitBankRefNo: "240115890123456",
          debitAmount: 103812.50,
          debitDatetime: "2024-01-15T10:15:00Z"
        }
      },
      merchantLedgerRecon: {
        status: "Not Reconciled",
        input: {
          chargebackAmount: 1250.00,
          merchantName: "TechStore Solutions",
          internalTransactionId: "TXN-24-001-789",
          notificationDatetime: "2024-01-15T09:30:00Z"
        },
        intermediate: {
          matchPercentage: 75
        },
        output: {
          merchantDebitLedgerEntry: "LDG-24-TS-001",
          merchantDebitAmount: 103812.50,
          merchantDebitDatetime: "2024-01-15T11:00:00Z"
        }
      }
    },
    assignedTo: "john.smith@PA.com",
    eventHistory: ["EVT-BP-001", "EVT-EM-001", "EVT-DOC-001", "EVT-DOC-002", "EVT-STATUS-001", "EVT-NOTE-001", "EVT-SFTP-001", "EVT-DOC-003"]
  },
  {
    caseId: "CB-2024-002",
    caseTitle: "Product Not Received",
    merchantName: "Fashion Forward LLC",
    createdDateTime: "2024-01-12T14:45:00Z",
    chargebackAmount: 750.50,
    status: "Open",
    CBReason: {
      cardType: "MC",
      code: "4853",
      category: "Cardholder Dispute",
      preventable: "Yes",
      reversible: "Yes"
    },
    queueType: "Quick Review",
    caseChannel: "Email",
    reconStatus: {
      overallStatus: "Reconciled",
      merchantRecon: {
        status: "Reconciled",
        input: {
          merchantNameInNotification: "Fashion Forward LLC"
        },
        intermediate: {
          matchPercentage: 98
        },
        output: {
          internalMerchantName: "Fashion Forward LLC",
          internalMerchantId: "MRCH-FF-002"
        }
      },
      transactionRecon: {
        status: "Reconciled",
        input: {
          bankRefNumberInNotification: "240112567890123"
        },
        intermediate: {
          matchPercentage: 100
        },
        output: {
          internalBankRefNo: "240112567890123",
          internalTransactionId: "TXN-24-002-567",
          originalTransactionAmount: 750.50
        }
      },
      paAccountRecon: {
        status: "Reconciled",
        input: {
          chargebackAmount: 750.50,
          merchantName: "Fashion Forward LLC",
          notifierBank: "ICICI Bank",
          notificationDatetime: "2024-01-12T14:45:00Z",
          transactionCurrency: "INR"
        },
        intermediate: {
          matchPercentage: 100
        },
        output: {
          debitLedgerEntry: "LDG-PA-24-002",
          debitBankRefNo: "240112901234567",
          debitAmount: 750.50,
          debitDatetime: "2024-01-12T15:00:00Z"
        }
      },
      merchantLedgerRecon: {
        status: "Reconciled",
        input: {
          chargebackAmount: 750.50,
          merchantName: "Fashion Forward LLC",
          internalTransactionId: "TXN-24-002-567",
          notificationDatetime: "2024-01-12T14:45:00Z"
        },
        intermediate: {
          matchPercentage: 100
        },
        output: {
          merchantDebitLedgerEntry: "LDG-24-FF-002",
          merchantDebitAmount: 750.50,
          merchantDebitDatetime: "2024-01-12T15:30:00Z"
        }
      }
    },
    assignedTo: "sarah.johnson@PA.com",
    eventHistory: []
  },
  {
    caseId: "CB-2024-003",
    caseTitle: "Duplicate Processing",
    merchantName: "Digital Services Corp",
    createdDateTime: "2024-01-10T11:20:00Z",
    chargebackAmount: 300.00,
    status: "Closed",
    CBReason: {
      cardType: "VISA",
      code: "4834",
      category: "Duplicate Processing",
      preventable: "No",
      reversible: "No"
    },
    queueType: "Auto Approve",
    caseChannel: "SFTP",
    reconStatus: {
      overallStatus: "Reconciled",
      merchantRecon: {
        status: "Reconciled",
        input: {
          merchantNameInNotification: "Digital Services Corp"
        },
        intermediate: {
          matchPercentage: 100
        },
        output: {
          internalMerchantName: "Digital Services Corp",
          internalMerchantId: "MRCH-DS-003"
        }
      },
      transactionRecon: {
        status: "Reconciled",
        input: {
          bankRefNumberInNotification: "240110345678901"
        },
        intermediate: {
          matchPercentage: 100
        },
        output: {
          internalBankRefNo: "240110345678901",
          internalTransactionId: "TXN-24-003-345",
          originalTransactionAmount: 300.00
        }
      },
      paAccountRecon: {
        status: "Reconciled",
        input: {
          chargebackAmount: 300.00,
          merchantName: "Digital Services Corp",
          notifierBank: "SBI",
          notificationDatetime: "2024-01-10T11:20:00Z",
          transactionCurrency: "INR"
        },
        intermediate: {
          matchPercentage: 100
        },
        output: {
          debitLedgerEntry: "LDG-PA-24-003",
          debitBankRefNo: "240110812345678",
          debitAmount: 300.00,
          debitDatetime: "2024-01-10T12:00:00Z"
        }
      },
      merchantLedgerRecon: {
        status: "Reconciled",
        input: {
          chargebackAmount: 300.00,
          merchantName: "Digital Services Corp",
          internalTransactionId: "TXN-24-003-345",
          notificationDatetime: "2024-01-10T11:20:00Z"
        },
        intermediate: {
          matchPercentage: 100
        },
        output: {
          merchantDebitLedgerEntry: "LDG-24-DS-003",
          merchantDebitAmount: 300.00,
          merchantDebitDatetime: "2024-01-10T12:30:00Z"
        }
      }
    },
    assignedTo: "mike.wilson@PA.com",
    eventHistory: []
  },
  {
    caseId: "CB-2024-004",
    caseTitle: "Authorization Issue",
    merchantName: "Global Retail Inc",
    createdDateTime: "2024-01-08T16:10:00Z",
    chargebackAmount: 2100.75,
    status: "In Progress",
    CBReason: {
      cardType: "MC",
      code: "4808",
      category: "Authorization Related",
      preventable: "Yes",
      reversible: "No"
    },
    queueType: "Manual Review",
    caseChannel: "Bank Portal",
    reconStatus: {
      overallStatus: "Not Reconciled",
      merchantRecon: {
        status: "Reconciled",
        input: {
          merchantNameInNotification: "Global Retail Inc"
        },
        intermediate: {
          matchPercentage: 92
        },
        output: {
          internalMerchantName: "Global Retail Inc",
          internalMerchantId: "MRCH-GR-004"
        }
      },
      transactionRecon: {
        status: "Not Reconciled",
        input: {
          bankRefNumberInNotification: "240108123456789"
        },
        intermediate: {
          matchPercentage: 65
        },
        output: {
          internalBankRefNo: "240108987654321",
          internalTransactionId: "TXN-24-004-123",
          originalTransactionAmount: 2100.75
        }
      },
      paAccountRecon: {
        status: "Not Reconciled",
        input: {
          chargebackAmount: 2100.75,
          merchantName: "Global Retail Inc",
          notifierBank: "Axis Bank",
          notificationDatetime: "2024-01-08T16:10:00Z",
          transactionCurrency: "EUR"
        },
        intermediate: {
          matchPercentage: 80
        },
        output: {
          debitLedgerEntry: "LDG-PA-24-004",
          debitBankRefNo: "240108723456789",
          debitAmount: 187932.06,
          debitDatetime: "2024-01-08T16:45:00Z"
        }
      },
      merchantLedgerRecon: {
        status: "Not Reconciled",
        input: {
          chargebackAmount: 2100.75,
          merchantName: "Global Retail Inc",
          internalTransactionId: "TXN-24-004-123",
          notificationDatetime: "2024-01-08T16:10:00Z"
        },
        intermediate: {
          matchPercentage: 70
        },
        output: {
          merchantDebitLedgerEntry: "LDG-24-GR-004",
          merchantDebitAmount: 187932.06,
          merchantDebitDatetime: "2024-01-08T17:30:00Z"
        }
      }
    },
    assignedTo: "emily.davis@PA.com",
    eventHistory: []
  },
  {
    caseId: "CB-2024-005",
    caseTitle: "Credit Not Processed",
    merchantName: "E-commerce Hub",
    createdDateTime: "2024-01-05T10:15:00Z",
    chargebackAmount: 450.25,
    status: "Open",
    CBReason: {
      cardType: "VISA",
      code: "4860",
      category: "Credit Not Processed",
      preventable: "Yes",
      reversible: "Yes"
    },
    queueType: "Quick Review",
    caseChannel: "Email",
    reconStatus: {
      overallStatus: "Not Reconciled",
      merchantRecon: {
        status: "Not Reconciled",
        input: {
          merchantNameInNotification: "E-commerce Hub"
        },
        intermediate: {
          matchPercentage: 78
        },
        output: {
          internalMerchantName: "E-commerce Hub India Pvt Ltd",
          internalMerchantId: "MRCH-EH-005"
        }
      },
      transactionRecon: {
        status: "Reconciled",
        input: {
          bankRefNumberInNotification: "240105987654321"
        },
        intermediate: {
          matchPercentage: 95
        },
        output: {
          internalBankRefNo: "240105987654321",
          internalTransactionId: "TXN-24-005-987",
          originalTransactionAmount: 450.25
        }
      },
      paAccountRecon: {
        status: "Reconciled",
        input: {
          chargebackAmount: 450.25,
          merchantName: "E-commerce Hub",
          notifierBank: "Bank of Baroda",
          notificationDatetime: "2024-01-05T10:15:00Z",
          transactionCurrency: "GBP"
        },
        intermediate: {
          matchPercentage: 88
        },
        output: {
          debitLedgerEntry: "LDG-PA-24-005",
          debitBankRefNo: "240105634567890",
          debitAmount: 46738.44,
          debitDatetime: "2024-01-05T10:45:00Z"
        }
      },
      merchantLedgerRecon: {
        status: "Not Reconciled",
        input: {
          chargebackAmount: 450.25,
          merchantName: "E-commerce Hub",
          internalTransactionId: "TXN-24-005-987",
          notificationDatetime: "2024-01-05T10:15:00Z"
        },
        intermediate: {
          matchPercentage: 82
        },
        output: {
          merchantDebitLedgerEntry: "LDG-24-EH-005",
          merchantDebitAmount: 46738.44,
          merchantDebitDatetime: "2024-01-05T11:15:00Z"
        }
      }
    },
    assignedTo: "alex.brown@PA.com",
    eventHistory: []
  }
];
