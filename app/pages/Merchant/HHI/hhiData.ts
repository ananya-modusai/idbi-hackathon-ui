export interface HHIData {
  score: number;
  riskLevel: 'Low' | 'Moderate' | 'High';
  riskLabel: string;
  insights: string[];
  explanation: string;
  importance: string;
}

export const sampleHHIData: HHIData = {
  score: 0.236,
  riskLevel: 'High',
  riskLabel: 'High Concentration Risk',
  explanation: 'Your portfolio has high concentration risk. A few merchants contribute a large portion of the NDX exposure.',
  insights: [
    '61% of total HHI is contributed by the top 3 merchants.',
    'Airlines industry drives 45% of total NDX exposure.'
  ],
  importance: 'Higher concentration increases vulnerability to merchant or industry specific stress events.'
};

/** Single row in the Industry Breakdown table (matches donut segments used for chart). */
export interface IndustryBreakdownRow {
  industry: string;
  ndxCr: number;
  exposurePct: number;
  contributionHHI: number;
  /** Hex fill for donut segment + row legend dot */
  chartColor: string;
}

export interface IndustryBreakdownPanelData {
  title: string;
  subtitle: string;
  totalNdxCr: number;
  totalNdxLabel: string;
  industries: IndustryBreakdownRow[];
  viewAllIndustriesLabel: string;
  totalIndustryCount: number;
  footerCards: {
    topIndustry: { title: string; industry: string; subtext: string; icon: 'pie' | 'bar' | 'shield' };
    industryContribution: { title: string; valueLine: string; subtext: string; icon: 'pie' | 'bar' | 'shield' };
    industryHHI: { title: string; valueLine: string; subtext: string; icon: 'pie' | 'bar' | 'shield' };
  };
}

export interface MerchantContributorRow {
  rank: number;
  merchantName: string;
  industry: string;
  ndxCr: number;
  exposurePct: number;
  contributionHHI: number;
}

export interface TopMerchantContributorsPanelData {
  title: string;
  subtitle: string;
  merchants: MerchantContributorRow[];
  viewAllMerchantsLabel: string;
  totalMerchantCount: number;
  footerCards: {
    top3: { title: string; valueLine: string; subtext: string; icon: 'users' | 'shopping' | 'users-wide' };
    top5: { title: string; valueLine: string; subtext: string; icon: 'users' | 'shopping' | 'users-wide' };
    totalMerchants: { title: string; valueLine: string; subtext: string; icon: 'users' | 'shopping' | 'users-wide' };
  };
}

export interface HHIIndustryMerchantBreakdownData {
  industryBreakdown: IndustryBreakdownPanelData;
  topMerchantContributors: TopMerchantContributorsPanelData;
}

export const sampleHHIIndustryMerchantBreakdown: HHIIndustryMerchantBreakdownData = {
  industryBreakdown: {
    title: 'Industry Breakdown',
    subtitle: 'Distribution of NDX exposure and contribution to Index by industry',
    totalNdxCr: 1250,
    totalNdxLabel: 'Total NDX',
    industries: [
      { industry: 'Airlines', ndxCr: 562.5, exposurePct: 45, contributionHHI: 0.2025, chartColor: '#2563eb' },
      { industry: 'Automobiles', ndxCr: 150.0, exposurePct: 12, contributionHHI: 0.0144, chartColor: '#7c3aed' },
      { industry: 'Wallets and Payments', ndxCr: 100.0, exposurePct: 8, contributionHHI: 0.0064, chartColor: '#059669' },
      { industry: 'Travel, OTAs', ndxCr: 75.0, exposurePct: 6, contributionHHI: 0.0036, chartColor: '#ca8a04' },
      { industry: 'E-commerce', ndxCr: 62.5, exposurePct: 5, contributionHHI: 0.0025, chartColor: '#ea580c' },
      { industry: 'Travel and Transportation', ndxCr: 50.0, exposurePct: 4, contributionHHI: 0.0016, chartColor: '#0891b2' },
      { industry: 'Hotels', ndxCr: 37.5, exposurePct: 3, contributionHHI: 0.0009, chartColor: '#db2777' },
      { industry: 'IT & Software', ndxCr: 37.5, exposurePct: 3, contributionHHI: 0.0009, chartColor: '#4f46e5' },
      { industry: 'Healthcare and Hospitals', ndxCr: 25.0, exposurePct: 2, contributionHHI: 0.0004, chartColor: '#16a34a' },
      {
        industry: 'Others (16 industries)',
        ndxCr: 150.0,
        exposurePct: 12,
        contributionHHI: 0.0144,
        chartColor: '#64748b'
      }
    ],
    viewAllIndustriesLabel: 'View all 27 industries',
    totalIndustryCount: 27,
    footerCards: {
      topIndustry: {
        title: 'Top Industry',
        industry: 'Airlines',
        subtext: '45% of total NDX exposure',
        icon: 'pie'
      },
      industryContribution: {
        title: 'Industry Contribution to Index',
        valueLine: '0.2025 (85.8%)',
        subtext: 'from Airlines',
        icon: 'bar'
      },
      industryHHI: {
        title: 'Industry HHI',
        valueLine: '0.236',
        subtext: 'Overall',
        icon: 'shield'
      }
    }
  },
  topMerchantContributors: {
    title: 'Top Merchant Contributors',
    subtitle: 'Merchants ranked by contribution to Index (Share²)',
    merchants: [
      {
        rank: 1,
        merchantName: 'IndiGo',
        industry: 'Airlines',
        ndxCr: 275.0,
        exposurePct: 22.0,
        contributionHHI: 0.0484
      },
      {
        rank: 2,
        merchantName: 'Air India',
        industry: 'Airlines',
        ndxCr: 212.5,
        exposurePct: 17.0,
        contributionHHI: 0.0289
      },
      {
        rank: 3,
        merchantName: 'Tata Motors',
        industry: 'Automobiles',
        ndxCr: 187.5,
        exposurePct: 15.0,
        contributionHHI: 0.0225
      },
      {
        rank: 4,
        merchantName: 'Maruti Suzuki',
        industry: 'Automobiles',
        ndxCr: 125.0,
        exposurePct: 10.0,
        contributionHHI: 0.0100
      },
      {
        rank: 5,
        merchantName: 'Reliance Retail',
        industry: 'E-commerce',
        ndxCr: 112.5,
        exposurePct: 9.0,
        contributionHHI: 0.0081
      },
      {
        rank: 6,
        merchantName: 'MakeMyTrip',
        industry: 'Travel, OTAs',
        ndxCr: 62.5,
        exposurePct: 5.0,
        contributionHHI: 0.0025
      },
      {
        rank: 7,
        merchantName: 'Amazon',
        industry: 'E-commerce',
        ndxCr: 62.5,
        exposurePct: 5.0,
        contributionHHI: 0.0025
      },
      {
        rank: 8,
        merchantName: 'Flipkart',
        industry: 'E-commerce',
        ndxCr: 50.0,
        exposurePct: 4.0,
        contributionHHI: 0.0016
      },
      {
        rank: 9,
        merchantName: 'Uber',
        industry: 'Travel and Transportation',
        ndxCr: 37.5,
        exposurePct: 3.0,
        contributionHHI: 0.0009
      },
      {
        rank: 10,
        merchantName: 'PVR INOX',
        industry: 'Entertainment (outdoors) + Sports',
        ndxCr: 25.0,
        exposurePct: 2.0,
        contributionHHI: 0.0004
      }
    ],
    viewAllMerchantsLabel: 'View all merchants',
    totalMerchantCount: 128,
    footerCards: {
      top3: {
        title: 'Top 3 Merchants',
        valueLine: '61%',
        subtext: 'of total HHI',
        icon: 'users'
      },
      top5: {
        title: 'Top 5 Merchants',
        valueLine: '50%',
        subtext: 'of total HHI',
        icon: 'shopping'
      },
      totalMerchants: {
        title: 'Total Merchants',
        valueLine: '128',
        subtext: '',
        icon: 'users-wide'
      }
    }
  }
};
