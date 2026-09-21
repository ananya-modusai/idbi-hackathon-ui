// Sample data for the Order Pipeline tab in InsolvencyUI.
// Adapted from freeze-order-processing-ui/features/orders/OrdersSampleData/OrderListComponent.ts

export interface LinkedPAN {
  pan: string;
  type: 'Corporate' | 'Individual';
}

export type OrderPipelineSource =
  | { type: 'Published'; id: `PDF${string}` }
  | { type: 'Email'; id: `EM${string}` };

export interface OrderPipelineSample {
  orderId: string;
  subject: string;
  summary: string;
  source: OrderPipelineSource;
  authority: string;
  orderDate: string;
  effectiveFrom?: string;
  orderType: string;
  linkedPANs: LinkedPAN[];
  dematAccounts: string[];
  actionStatus: 'Pending' | 'Executed' | 'Partially Executed';
  priority: 'High' | 'Normal';
  reviewStatus?: 'Reviewed' | 'Pending';
  orderReceivedTime?: string;
  createdInSystemTime?: string;
  intimationVia?: string;
  repeatNoticees?: number;
  executionTime?: string;
  exceptionRecordFound?: number;
  priorityReasonDetailed: Record<string, { riskLevel: string; comment: string }>;
}

export const orderPipelineSampleData: OrderPipelineSample[] = [
  {
    orderId: 'WTM/AS/ISD/ISD-SEC-6/32028/2025-26',
    subject: 'Debarment + Account & PAN Freeze',
    summary: 'Pump-and-dump scheme in Unison Metals Ltd. (BSE: 538610). Unlawful profits: ₹3,87,45,475.70. Freeze 13 PANs immediately.',
    source: { type: 'Email', id: 'EM001' },
    authority: 'SEBI',
    orderDate: '05 Feb 2026',
    effectiveFrom: '05 Feb 2026',
    orderType: 'WTM Order',
    linkedPANs: [
      { pan: 'AGFPN4412J', type: 'Individual' },
      { pan: 'BJHPP4604A', type: 'Individual' },
    ],
    dematAccounts: ['IN30012312345678'],
    actionStatus: 'Executed',
    priority: 'High',
    priorityReasonDetailed: {},
    intimationVia: 'Email | Regulatory Notification',
    reviewStatus: 'Pending',
    orderReceivedTime: '02 Apr 2026, 05:07:00 PM',
    createdInSystemTime: '02 Apr 2026, 05:07:15 PM',
    repeatNoticees: 1,
    executionTime: '02 Apr 2026, 05:07:30 PM',
    exceptionRecordFound: 2,
  },
  {
    orderId: 'WTM/KC/ISD/31880/2025-26',
    subject: 'PAN Level Restraint — Circular Trading',
    summary: 'Interim directions in the matter of suspected circular trading. Freeze of demat accounts linked to front-running activity.',
    source: { type: 'Published', id: 'PDF001' },
    authority: 'SEBI',
    orderDate: '18 Mar 2026',
    effectiveFrom: '18 Mar 2026',
    orderType: 'Ex-Parte Interim Order',
    linkedPANs: [{ pan: 'CHDJH2322D', type: 'Individual' }],
    dematAccounts: ['IN30045698765432'],
    actionStatus: 'Partially Executed',
    priority: 'Normal',
    priorityReasonDetailed: {},
    intimationVia: 'Regulatory Notification',
    reviewStatus: 'Reviewed',
    orderReceivedTime: '18 Mar 2026, 10:30:00 AM',
    createdInSystemTime: '18 Mar 2026, 10:31:00 AM',
    repeatNoticees: 0,
  },
  {
    orderId: 'WTM/AB/IVD/ID3/16889/2023-24',
    subject: 'Confirmatory Order — Continuation of PAN Restraints',
    summary: 'SAT confirmatory order directing continuation of existing restraints on PAN-level holdings pending disposal of the appeal.',
    source: { type: 'Email', id: 'EM002' },
    authority: 'SAT',
    orderDate: '28 Jan 2026',
    effectiveFrom: '28 Jan 2026',
    orderType: 'Confirmatory',
    linkedPANs: [
      { pan: 'AEIPJ9758G', type: 'Individual' },
      { pan: 'AQEPP0578J', type: 'Individual' },
    ],
    dematAccounts: ['IN30098712341234', 'IN30033456789012'],
    actionStatus: 'Pending',
    priority: 'High',
    priorityReasonDetailed: {},
    intimationVia: 'Email | Regulatory Notification',
    reviewStatus: 'Pending',
    orderReceivedTime: '28 Jan 2026, 02:45:00 PM',
    createdInSystemTime: '28 Jan 2026, 02:46:00 PM',
    repeatNoticees: 2,
    exceptionRecordFound: 1,
  },
];

// Pre-seeded history items for the "Recent Orders" table
export interface PipelineHistoryItem {
  orderNo: string;
  authority: string;
  orderType: string;
  captureMethod: 'auto' | 'manual';
  issuedOn: string;
  receivedOn: string;
  capturedOn: string;
}

export const pipelineHistoryItemsSeed: PipelineHistoryItem[] = [
  {
    orderNo: 'WTM/AS/ISD/ISD-SEC-6/32028/2025-26',
    authority: 'SEBI',
    orderType: 'WTM Order',
    captureMethod: 'auto',
    issuedOn: '05 Feb 2026, 11:30 AM',
    receivedOn: '05 Feb 2026, 02:45 PM',
    capturedOn: '06 Feb 2026, 09:10 AM',
  },
  {
    orderNo: 'WTM/KC/ISD/31880/2025-26',
    authority: 'SEBI',
    orderType: 'Ex-Parte Interim Order',
    captureMethod: 'auto',
    issuedOn: '18 Mar 2026, 10:00 AM',
    receivedOn: '18 Mar 2026, 10:30 AM',
    capturedOn: '18 Mar 2026, 11:00 AM',
  },
];
