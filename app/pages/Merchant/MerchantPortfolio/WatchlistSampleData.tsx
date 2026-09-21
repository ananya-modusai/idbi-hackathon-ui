export interface MerchantWatchlistSampleData {
  merchantName: string;
  mid: string;
  monitoringFrequency: 'Daily' | 'Weekly' | 'Monthly';
  addedDate: string;
  status: string;
}

export const watchlistSampleData: MerchantWatchlistSampleData[] = [
  {
    merchantName: 'SPICEJET LIMITED',
    mid: 'f197a546-8ed2-415d-8f1e-7c6fcecbb372',
    monitoringFrequency: 'Weekly',
    addedDate: '2024-01-15',
    status: 'Active'
  },
  {
    merchantName: 'AIR INDIA LIMITED',
    mid: '4cfe12c0-c968-4f33-a8d8-59590dc81410',
    monitoringFrequency: 'Daily',
    addedDate: '2024-01-10',
    status: 'Inactive'
  }
];
