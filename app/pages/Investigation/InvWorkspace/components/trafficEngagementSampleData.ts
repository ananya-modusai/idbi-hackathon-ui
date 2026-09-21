export interface TrafficMetric {
  label: string;
  value: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  tooltip?: string;
  icon: string;
}

export interface MonthlyVisitDataPoint {
  month: string;
  visits: number;
}

export interface DeviceDistribution {
  label: string;
  percentage: string;
  color: string;
  dotColor: string;
}

export interface CountryTrafficDataPoint {
  country: string;
  flag: string;
  share: string;
}

export interface ReferralSourceDataPoint {
  url: string;
  visits: number;
}

export interface OutgoingLinkDataPoint {
  url: string;
  clicks: number;
}

export interface TrafficEngagementData {
  metrics: {
    totalVisits: TrafficMetric;
    uniqueVisits: TrafficMetric;
    pagesPerVisit: TrafficMetric;
    avgVisitDuration: TrafficMetric;
    bounceRate: TrafficMetric;
  };
  monthlyVisits: MonthlyVisitDataPoint[];
  deviceDistribution: {
    mobileWeb: DeviceDistribution;
    desktop: DeviceDistribution;
  };
  countryTraffic: CountryTrafficDataPoint[];
  referringSources: ReferralSourceDataPoint[];
  outgoingLinks: OutgoingLinkDataPoint[];
}

export const trafficEngagementSampleData: TrafficEngagementData = {
  metrics: {
    totalVisits: {
      label: "Total Visits",
      value: "635.76M",
      trend: {
        value: "8.6% vs last month",
        isPositive: true,
      },
      tooltip: "The total number of visits (sessions) to the website during the specified period.",
      icon: '<Activity className="h-5 w-5 text-purple-500" />',
    },
    uniqueVisits: {
      label: "Unique Visits",
      value: "333.79M",
      trend: {
        value: "5.1% vs last month",
        isPositive: true,
      },
      tooltip: "The number of individual, unique visitors who visited the website.",
      icon: '<Users className="h-5 w-5 text-blue-500" />',
    },
    pagesPerVisit: {
      label: "Pages / Visit",
      value: "3.23",
      tooltip: "The average number of pages viewed per visit.",
      icon: '<FileText className="h-5 w-5 text-indigo-500" />',
    },
    avgVisitDuration: {
      label: "Avg Visit Duration",
      value: "07:49",
      tooltip: "The average amount of time spent on the website during a visit (MM:SS).",
      icon: '<Clock className="h-5 w-5 text-amber-500" />',
    },
    bounceRate: {
      label: "Bounce Rate",
      value: "58.92%",
      tooltip: "The percentage of visits that consisted of only a single pageview.",
      icon: '<LogOut className="h-5 w-5 text-rose-500" />',
    },
  },
  monthlyVisits: [
    { month: "Nov 25", visits: 450000 },
    { month: "Dec 25", visits: 580000 },
    { month: "Jan 26", visits: 300000 },
    { month: "Feb 26", visits: 500000 },
    { month: "Mar 26", visits: 680000 },
    { month: "Apr 26", visits: 550000 },
  ],
  deviceDistribution: {
    mobileWeb: {
      label: "Mobile Web",
      percentage: "73.47%",
      color: "bg-blue-50 border border-blue-100 text-blue-700",
      dotColor: "bg-blue-300",
    },
    desktop: {
      label: "Desktop",
      percentage: "26.53%",
      color: "bg-blue-100/50 border border-blue-200 text-blue-800",
      dotColor: "bg-blue-600",
    },
  },
  countryTraffic: [
    { country: "United States", flag: "🇺🇸", share: "32.9%" },
    { country: "United Kingdom", flag: "🇬🇧", share: "6.9%" },
    { country: "India", flag: "🇮🇳", share: "5.9%" },
    { country: "Japan", flag: "🇯🇵", share: "4.9%" },
    { country: "Germany", flag: "🇩🇪", share: "3.5%" },
  ],
  referringSources: [
    { url: "google.com", visits: 245680 },
    { url: "facebook.com", visits: 128540 },
    { url: "instagram.com", visits: 95320 },
    { url: "twitter.com", visits: 72145 },
    { url: "linkedin.com", visits: 38920 },
    { url: "reddit.com", visits: 28450 },
  ],
  outgoingLinks: [
    { url: "shop.thebarelab.com", clicks: 189450 },
    { url: "blog.thebarelab.com", clicks: 134280 },
    { url: "support.thebarelab.com", clicks: 98760 },
    { url: "contact.thebarelab.com", clicks: 76540 },
    { url: "pricing.thebarelab.com", clicks: 52300 },
    { url: "newsletter.thebarelab.com", clicks: 31850 },
  ],
};
