import { ChargebackCase } from '../SampleData/CBCasesSampleData';

export type BubbleTagColor = 
  | 'redTextWhiteBg' 
  | 'yellowTextWhiteBg' 
  | 'greenTextWhiteBg' 
  | 'cyanTextWhiteBg' 
  | 'blueTextWhiteBg';

export const getQueueTypeColor = (queueType: string): BubbleTagColor => {
  switch (queueType) {
    case 'Manual Review':
      return 'redTextWhiteBg';
    case 'Quick Review':
      return 'yellowTextWhiteBg';
    case 'Auto Approve':
      return 'greenTextWhiteBg';
    default:
      return 'cyanTextWhiteBg';
  }
};

export const getStatusColor = (status: string): BubbleTagColor => {
  switch (status) {
    case 'Open':
      return 'blueTextWhiteBg';
    case 'In Progress':
      return 'yellowTextWhiteBg';
    case 'Closed':
      return 'cyanTextWhiteBg';
    default:
      return 'cyanTextWhiteBg';
  }
};

export const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export interface CBBubbleTagConfig {
  text: string;
  color: BubbleTagColor;
  withBorder: boolean;
}

export const generateChargebackBubbleTags = (data: ChargebackCase): CBBubbleTagConfig[] => {
  return [
    {
      text: `Queue: ${data.queueType}`,
      color: getQueueTypeColor(data.queueType),
      withBorder: true
    },
    {
      text: `Status: ${data.status}`,
      color: getStatusColor(data.status),
      withBorder: true
    },
    {
      text: `Amount: ${formatAmount(data.chargebackAmount)}`,
      color: 'cyanTextWhiteBg',
      withBorder: true
    },
    {
      text: `Reason: ${data.CBReason.cardType} ${data.CBReason.code}`,
      color: 'cyanTextWhiteBg',
      withBorder: true
    },
    {
      text: `Channel: ${data.caseChannel}`,
      color: 'blueTextWhiteBg',
      withBorder: true
    },
    {
      text: data.reconStatus.overallStatus,
      color: data.reconStatus.overallStatus === 'Reconciled' ? 'greenTextWhiteBg' : 'redTextWhiteBg',
      withBorder: true
    }
  ];
};
