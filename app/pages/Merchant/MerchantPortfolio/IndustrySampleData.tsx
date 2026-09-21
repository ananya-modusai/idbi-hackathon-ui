export interface IndustryData {
  id: string;
  name: string;
  averageDeliveryDays: number;
  riskSegment: 'Severe' | 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low';
  merchantCount?: number;
  lastUpdated?: string;
}

export const industrySampleData: IndustryData[] = [
  {
    id: '1',
    name: 'E-commerce & Online Retail',
    averageDeliveryDays: 3,
    riskSegment: 'Low',
    merchantCount: 1250,
    lastUpdated: '2024-01-15'
  },
  {
    id: '2',
    name: 'Financial Services',
    averageDeliveryDays: 1,
    riskSegment: 'Very Low',
    merchantCount: 890,
    lastUpdated: '2024-01-14'
  },
  {
    id: '3',
    name: 'Cryptocurrency & Digital Assets',
    averageDeliveryDays: 7,
    riskSegment: 'Very High',
    merchantCount: 340,
    lastUpdated: '2024-01-16'
  },
  {
    id: '4',
    name: 'Travel & Hospitality',
    averageDeliveryDays: 5,
    riskSegment: 'High',
    merchantCount: 680,
    lastUpdated: '2024-01-13'
  },
  {
    id: '5',
    name: 'Healthcare & Medical Devices',
    averageDeliveryDays: 2,
    riskSegment: 'Medium',
    merchantCount: 520,
    lastUpdated: '2024-01-12'
  },
  {
    id: '6',
    name: 'Gaming & Entertainment',
    averageDeliveryDays: 4,
    riskSegment: 'Medium',
    merchantCount: 720,
    lastUpdated: '2024-01-11'
  },
  {
    id: '7',
    name: 'Food & Beverage Delivery',
    averageDeliveryDays: 1,
    riskSegment: 'Low',
    merchantCount: 950,
    lastUpdated: '2024-01-10'
  },
  {
    id: '8',
    name: 'Adult Entertainment',
    averageDeliveryDays: 8,
    riskSegment: 'Very High',
    merchantCount: 180,
    lastUpdated: '2024-01-09'
  },
  {
    id: '9',
    name: 'Telecommunications',
    averageDeliveryDays: 2,
    riskSegment: 'Very Low',
    merchantCount: 430,
    lastUpdated: '2024-01-08'
  },
  {
    id: '10',
    name: 'Fashion & Apparel',
    averageDeliveryDays: 4,
    riskSegment: 'Low',
    merchantCount: 820,
    lastUpdated: '2024-01-07'
  },
  {
    id: '11',
    name: 'Automotive & Transportation',
    averageDeliveryDays: 6,
    riskSegment: 'Medium',
    merchantCount: 460,
    lastUpdated: '2024-01-06'
  },
  {
    id: '12',
    name: 'Real Estate',
    averageDeliveryDays: 10,
    riskSegment: 'High',
    merchantCount: 290,
    lastUpdated: '2024-01-05'
  },
  {
    id: '13',
    name: 'Education & Training',
    averageDeliveryDays: 3,
    riskSegment: 'Low',
    merchantCount: 640,
    lastUpdated: '2024-01-04'
  },
  {
    id: '14',
    name: 'Software & Technology',
    averageDeliveryDays: 1,
    riskSegment: 'Very Low',
    merchantCount: 1150,
    lastUpdated: '2024-01-03'
  },
  {
    id: '15',
    name: 'Gambling & Betting',
    averageDeliveryDays: 12,
    riskSegment: 'Very High',
    merchantCount: 220,
    lastUpdated: '2024-01-02'
  }
];

export const riskSegmentOptions = [
  { value: 'Very Low', label: 'Very Low' },
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Very High', label: 'Very High' },
  { value: 'Severe', label: 'Severe' },
];
