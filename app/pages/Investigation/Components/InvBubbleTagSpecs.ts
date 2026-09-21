import { InvestigationCase } from '../Sample Data/InvCasesSampleData';

export type BubbleTagColor = 
  | 'redTextWhiteBg' 
  | 'yellowTextWhiteBg' 
  | 'greenTextWhiteBg' 
  | 'cyanTextWhiteBg' 
  | 'blueTextWhiteBg';

export const getStatusColor = (status: string): BubbleTagColor => {
  switch (status) {
    case 'Open':
      return 'blueTextWhiteBg';
    case 'In Progress':
      return 'yellowTextWhiteBg';
    case 'Closed':
      return 'greenTextWhiteBg';
    default:
      return 'cyanTextWhiteBg';
  }
};

export interface InvBubbleTagConfig {
  text: string;
  color: BubbleTagColor;
  withBorder: boolean;
  fixedWidth?: 'w-12' | 'w-14' | 'w-16' | 'w-20' | 'w-24' | 'w-28' | 'w-32' | 'w-36' | 'w-40' | 'w-44' | 'w-48' | 'w-56' | 'w-64' | 'w-72' | 'w-80' | 'w-96' | 'w-auto' | 'w-full' | 'w-fit' | 'w-min' | 'w-max';
}

export const generateInvestigationBubbleTags = (data: InvestigationCase): InvBubbleTagConfig[] => {
  return [];
};

