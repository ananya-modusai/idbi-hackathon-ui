import { ColorScheme } from '@/components/custom/CustomColorScheme';
import { type IconName } from '@/components/custom/CustomIconScheme';

export type InvestigationStatus = 'Open' | 'In Progress' | 'Closed';
export type AnalysisCategory =
  | 'Merchant Analysis'
  | 'Website Analysis'
  | 'Transaction Analysis';

export interface KeyStats {
  orgType?: string;
  state?: string;
  merchantType?: string;
  onboardedOn?: string;
  mccCode?: string;
  mccDescription?: string;
  totalGMV?: string;
}

export interface InsightItem {
  type: string;
  value: string;
  valueSentiment?: WebsiteAnalysisValueSentiment;
}

export type InsightsSummary = InsightItem[];

export interface InvestigationCase {
  caseId: string;
  caseTitle: string;
  registeredName: string;
  brandName?: string;
  createdDateTime: string;
  lastRunDateTime?: string;
  status: InvestigationStatus;
  assignedTo: string;
  keyStats?: KeyStats;
  insightsSummary?: InsightsSummary;
}

export const investigationCasesSampleData: InvestigationCase[] = [
  {
    caseId: "INV001",
    caseTitle: "Merchant Review Case",
    registeredName: "TestMerchant FINTECH SOLUTIONS PRIVATE LIMITED",
    brandName: "EDUTestMerchant",
    createdDateTime: "2024-01-15T09:45:00Z",
    status: "Open",
    assignedTo: "Rajesh Kumar",
    keyStats: {
      orgType: "Private Limited",
      state: "Telangana",
      merchantType: "Non Affiliated Education",
      onboardedOn: "Not provided",
      mccCode: "Not provided",
      mccDescription: "Not provided",
      totalGMV: "Not available"
    },
    insightsSummary: [
      {
        type: "Merchant Review",
        value:
          "newly incorporated (Dec 2023) entity with missing MCC/industry mapping, so category fit cannot be validated",
        valueSentiment: "negative"
      },
      {
        type: "Website Review",
        value:
          "informational site only; login exists but no signup, and contact/social details rely on generic links",
        valueSentiment: "neutral"
      },
      {
        type: "Transaction Review",
        value: "no transaction signals available for evaluation",
        valueSentiment: "neutral"
      },
      {
        type: "External Insights",
        value: "limited digital footprint with sparse LinkedIn activity (<50 followers)",
        valueSentiment: "neutral"
      }
    ]
  },
  {
    caseId: "INV002",
    caseTitle: "Merchant Review Case",
    registeredName: "EBIXCASH WORLD MONEY LIMITED",
    brandName: "Ebix Cash",
    createdDateTime: "2024-01-20T14:30:00Z",
    status: "In Progress",
    assignedTo: "Priya Sharma",
    keyStats: {
      orgType: "Public Limited",
      state: "Maharashtra",
      merchantType: "Financial Services",
      onboardedOn: "2025/01/02",
      mccCode: "6050",
      mccDescription: "Quasi Cash-Member Financial Institution",
      totalGMV: "₹1 Cr+"
    },
    insightsSummary: [
      {
        type: "Merchant Review",
        value: "looks like a well-known brand with strong Indian presence",
        valueSentiment: "positive"
      },
      {
        type: "Website Review",
        value: "overall looks legitimate",
        valueSentiment: "positive"
      },
      {
        type: "Transaction Review",
        value: "overall inline with the merchant LOB",
        valueSentiment: "positive"
      },
      {
        type: "External Insights",
        value: "no major negative info found in public domain",
        valueSentiment: "positive"
      }
    ]
  },
  {
    caseId: "INV003",
    caseTitle: "Risk Assessment Investigation",
    registeredName: "SAJJEEVAN INTERIORS OPC PRIVATE LIMITED",
    brandName: "SAJJEEVAN INTERIORS",
    createdDateTime: "2024-01-25T11:15:00Z",
    status: "Open",
    assignedTo: "Amit Patel",
    keyStats: {
      orgType: "OPC Private Limited",
      state: "West Bengal",
      merchantType: "Ecommerce/Retail",
      onboardedOn: "Not provided",
      mccCode: "Not provided",
      mccDescription: "Not provided",
      totalGMV: "Not specified"
    },
    insightsSummary: [
      {
        type: "Merchant Review",
        value: "newly registered business with address mismatch",
        valueSentiment: "negative"
      },
      {
        type: "Website Review",
        value: "functional website with some red flags in navigation and social media",
        valueSentiment: "neutral"
      },
      {
        type: "Transaction Review",
        value: "no transaction data available",
        valueSentiment: "neutral"
      },
      {
        type: "External Insights",
        value: "no external insights data available",
        valueSentiment: "neutral"
      }
    ]
  },
  {
    caseId: "INV004",
    caseTitle: "Merchant Review Case",
    registeredName: "Exim",
    brandName: "Kurti.digital",
    createdDateTime: "2025-02-05T10:30:00Z",
    status: "Open",
    assignedTo: "Neha Singh",
    keyStats: {
      orgType: "Not provided",
      state: "Maharashtra",
      merchantType: "Apparel & Accessories",
      onboardedOn: "Not provided",
      mccCode: "Not provided",
      mccDescription: "Not provided",
      totalGMV: "Not available"
    },
    insightsSummary: [
      {
        type: "Merchant Review",
        value:
          "catalog-first apparel seller operating via Shopify; offers kurtas at deep discounts but pricing remains in a reasonable apparel range",
        valueSentiment: "neutral"
      },
      {
        type: "Website Review",
        value:
          "functional storefront hosted on Shopify with HTTPS, but login/signup flows are blocked behind a verification wall and contact email uses gmail",
        valueSentiment: "negative"
      },
      {
        type: "Transaction Review",
        value: "no transaction telemetry available for evaluation",
        valueSentiment: "neutral"
      },
      {
        type: "External Insights",
        value:
          "no social media presence or publicly listed registrations, suggesting a limited digital footprint",
        valueSentiment: "negative"
      }
    ]
  },
  {
    caseId: "INV005",
    caseTitle: "Merchant Review Case",
    registeredName: "PAYMANFINTECH PRIVATE LIMITED",
    brandName: "PaymanFintech",
    createdDateTime: "2024-02-10T16:20:00Z",
    status: "Open",
    assignedTo: "Arjun Reddy",
    keyStats: {
      orgType: "Private Limited",
      state: "Telangana",
      merchantType: "Non Affiliated Education",
      onboardedOn: "Not provided",
      mccCode: "Not provided",
      mccDescription: "Not provided",
      totalGMV: "₹50,000"
    },
    insightsSummary: [
      {
        type: "Merchant Review",
        value: "newly incorporated (Dec 2023) entity with missing MCC/industry mapping and limited business activity",
        valueSentiment: "negative"
      },
      {
        type: "Website Review",
        value: "functional educational website with UX issues in sign-in flow and missing social media presence",
        valueSentiment: "neutral"
      },
      {
        type: "Transaction Review",
        value: "limited transaction volume appropriate for new educational business",
        valueSentiment: "neutral"
      },
      {
        type: "External Insights",
        value: "minimal digital footprint with basic website functionality but no social media or external registrations",
        valueSentiment: "neutral"
      }
    ]
  }
];

// Cell data must be key-value pairs (objects), where values can be strings or arrays
export interface KeyValueWithIcons {
  value: string | string[];
  keyIcon?: WebsiteAnalysisIconName;
  keyIconColor?: ColorScheme;
  valueSentiment?: WebsiteAnalysisValueSentiment;
}

export type CellDataValue = { [key: string]: string | string[] | KeyValueWithIcons };

export type WebsiteAnalysisValueSentiment = 'info' | 'neutral' | 'positive' | 'negative';

/**
 * Icon name type for website analysis.
 * Uses the centralized IconName type from CustomIconScheme to avoid hardcoding.
 */
export type WebsiteAnalysisIconName = IconName;

export interface WebsiteAnalysisKeyValue {
  field: string;
  value: string | string[];
  keyIcon: WebsiteAnalysisIconName;
  keyIconColor: ColorScheme;
  valueSentiment: WebsiteAnalysisValueSentiment;
}

export interface PolicyFieldValue {
  value: string;
  valueSentiment?: WebsiteAnalysisValueSentiment;
}

export interface PolicyFieldWithIcon extends PolicyFieldValue {
  keyIcon?: WebsiteAnalysisIconName;
  keyIconColor?: ColorScheme;
}

export interface PolicyDataPoint {
  Policy: PolicyFieldWithIcon;
  Relevance?: PolicyFieldValue;
  Status?: PolicyFieldValue;
  Content?: PolicyFieldValue;
  Summary?: PolicyFieldValue;
}

export interface RedFlag {
  code: string;
  redFlag: string;
  severity: 'High' | 'Medium' | 'Low';
  reasoning: string;
  triggered: boolean;
}

export interface ThreeWayMatchData {
  datapoint: string;
  merchantData: CellDataValue;
  mcaData: CellDataValue;
  websiteData: CellDataValue;
}

export interface CaseAnalysisSubcategory<TData> {
  caseId: string;
  analysisCategory: AnalysisCategory;
  data: TData;
  redFlags: RedFlag[];
}

export type CaseThreeWayMatchData = CaseAnalysisSubcategory<ThreeWayMatchData[]>;

export interface ExternalInsight {
  topic: string;
  summary: string;
  source: string;
}

export type CaseExternalInsightsData = CaseAnalysisSubcategory<ExternalInsight[]>;

export type WebsiteDataPoint = WebsiteAnalysisKeyValue;

export type CaseWebsiteData = CaseAnalysisSubcategory<WebsiteDataPoint[]>;

export type NavigationFlowDataPoint = WebsiteAnalysisKeyValue;

export type CaseNavigationFlowData = CaseAnalysisSubcategory<
  NavigationFlowDataPoint[]
>;

export type ContactSocialDataPoint = WebsiteAnalysisKeyValue;

export type CaseContactSocialData = CaseAnalysisSubcategory<
  ContactSocialDataPoint[]
>;

export type CasePolicyData = CaseAnalysisSubcategory<PolicyDataPoint[]>;

export type ContentAnalysisDataPoint = WebsiteAnalysisKeyValue;

export type CaseContentAnalysisData = CaseAnalysisSubcategory<
  ContentAnalysisDataPoint[]
>;

export type ProductsPricingDataPoint = WebsiteAnalysisKeyValue;

export type CaseProductsPricingData = CaseAnalysisSubcategory<
  ProductsPricingDataPoint[]
>;

export type DomainInformationDetail = WebsiteAnalysisKeyValue;

export type CaseDomainInformationData = CaseAnalysisSubcategory<
  DomainInformationDetail[]
>;

export const invThreeWayMatchData: Record<string, CaseThreeWayMatchData> = {
  INV001: {
    caseId: "INV001",
    analysisCategory: "Merchant Analysis",
    data: [
      {
        datapoint: "Identifier",
        merchantData: {
          "Merchant ID": {
            value: "1107494",
            keyIcon: "BadgeCheck",
            keyIconColor: "blue",
            valueSentiment: "info"
          }
        },
        mcaData: {
          "CIN": {
            value: "U62099TS2023PTC179868",
            keyIcon: "FileText",
            keyIconColor: "blue",
            valueSentiment: "info"
          }
        },
        websiteData: {
          "Website URL": {
            value: "www.edu.TestMerchantfintech.in",
            keyIcon: "Globe",
            keyIconColor: "blue",
            valueSentiment: "positive"
          }
        }
      },
      {
        datapoint: "Registered Business Name",
        merchantData: {
          "Legal Name": {
            value: "TestMerchant FINTECH SOLUTIONS PRIVATE LIMITED",
            keyIcon: "Heading",
            keyIconColor: "blue",
            valueSentiment: "info"
          }
        },
        mcaData: {
          "Exact match": {
            value: "TestMerchant FINTECH SOLUTIONS PRIVATE LIMITED",
            keyIcon: "CheckCircle2",
            keyIconColor: "green",
            valueSentiment: "positive"
          }
        },
        websiteData: {
          "Entity name": {
            value: "TestMerchant FINTECH SOLUTIONS PVT LTD",
            keyIcon: "Heading",
            keyIconColor: "blue",
            valueSentiment: "info"
          }
        }
      },
      {
        datapoint: "Brand Name",
        merchantData: {
          "Brand Name": {
            value: "TestMerchant FINTECH SOLUTIONS PVT LTD",
            keyIcon: "BadgeInfo",
            keyIconColor: "blue",
            valueSentiment: "info"
          }
        },
        mcaData: {
          "Brand Name": {
            value: "Null",
            keyIcon: "BadgeInfo",
            keyIconColor: "gray",
            valueSentiment: "neutral"
          }
        },
        websiteData: {
          "Brand Name": {
            value: "EDUTestMerchant",
            keyIcon: "BadgeInfo",
            keyIconColor: "blue",
            valueSentiment: "info"
          }
        }
      },
      {
        datapoint: "Business Category",
        merchantData: {
          "Category": {
            value: "Non Affiliated Education",
            keyIcon: "Layers",
            keyIconColor: "blue",
            valueSentiment: "info"
          },
          "MCC Code & Name": {
            value: "Not specified",
            keyIcon: "ListOrdered",
            keyIconColor: "gray",
            valueSentiment: "neutral"
          }
        },
        mcaData: {
          "Broad Industry Category": {
            value: "-",
            keyIcon: "Layers",
            keyIconColor: "gray",
            valueSentiment: "neutral"
          },
          "Industry": {
            value: "-",
            keyIcon: "Layers",
            keyIconColor: "gray",
            valueSentiment: "neutral"
          },
          "Segment(s)": {
            value: "-",
            keyIcon: "Layers",
            keyIconColor: "gray",
            valueSentiment: "neutral"
          }
        },
        websiteData: {
          "Category": {
            value: "Education Technology (Online Professional & Technical Courses)",
            keyIcon: "Layers",
            keyIconColor: "blue",
            valueSentiment: "info"
          }
        }
      },
      {
        datapoint: "Offerings Summary",
        merchantData: {
          "Offerings Summary": {
            value: "Null",
            keyIcon: "FileText",
            keyIconColor: "gray",
            valueSentiment: "neutral"
          }
        },
        mcaData: {
          "About the Company": {
            value: "-",
            keyIcon: "FileText",
            keyIconColor: "gray",
            valueSentiment: "neutral"
          }
        },
        websiteData: {
          "Looks like": {
            value: "The website is purely informational, with no products, categories, or pricing. It provides information about EDUTestMerchant, with navigation links for Home, About, and Contact Us. No e-commerce, product, or service details are present.",
            keyIcon: "FileText",
            keyIconColor: "blue",
            valueSentiment: "info"
          },
          "About us section": {
            value: "Not explicitly available",
            keyIcon: "Info",
            keyIconColor: "orange",
            valueSentiment: "neutral"
          }
        }
      },
      {
        datapoint: "Start Date",
        merchantData: {
          "Onboarded on": {
            value: "Not specified",
            keyIcon: "CalendarClock",
            keyIconColor: "gray",
            valueSentiment: "neutral"
          }
        },
        mcaData: {
          "Date of Incorporation": {
            value: "11 Dec, 2023",
            keyIcon: "CalendarClock",
            keyIconColor: "green",
            valueSentiment: "positive"
          }
        },
        websiteData: {
          "Website Created Date": {
            value: "None (not available)",
            keyIcon: "CalendarClock",
            keyIconColor: "orange",
            valueSentiment: "negative"
          }
        }
      },
      {
        datapoint: "Location",
        merchantData: {
          "City, State": {
            value: "Telangana",
            keyIcon: "MapPin",
            keyIconColor: "blue",
            valueSentiment: "info"
          }
        },
        mcaData: {
          "Registered Address": {
            value: "10-100, ST NO:10, H M T NAGAR, I.E.Nacharam, Uppal, Telangana, 500076",
            keyIcon: "MapPin",
            keyIconColor: "blue",
            valueSentiment: "info"
          },
          "Business Address": {
            value: "-",
            keyIcon: "MapPin",
            keyIconColor: "gray",
            valueSentiment: "neutral"
          }
        },
        websiteData: {
          "Office Address": {
            value: "SRI RAMACHANDRA NIVAS, 4-9-12 STREET NO 1, H M T NAGAR,NACHARAM, PIN CODE - 500076, CIRCLE 1,HYDERABAD",
            keyIcon: "MapPinned",
            keyIconColor: "blue",
            valueSentiment: "info"
          },
          "Domain Location": {
            value: "India",
            keyIcon: "MapPinned",
            keyIconColor: "blue",
            valueSentiment: "info"
          }
        }
      },
      {
        datapoint: "Phone",
        merchantData: {
          "Phone Number": {
            value: "Not specified",
            keyIcon: "Phone",
            keyIconColor: "orange",
            valueSentiment: "negative"
          }
        },
        mcaData: {
          "All registered phones": {
            value: "-",
            keyIcon: "Phone",
            keyIconColor: "gray",
            valueSentiment: "neutral"
          }
        },
        websiteData: {
          "Phone numbers": {
            value: "+91 9100748033 (WhatsApp & Call)",
            keyIcon: "Phone",
            keyIconColor: "green",
            valueSentiment: "positive"
          }
        }
      },
      {
        datapoint: "Email",
        merchantData: {
          "Email ID": {
            value: "Not specified",
            keyIcon: "Mail",
            keyIconColor: "orange",
            valueSentiment: "negative"
          }
        },
        mcaData: {
          "All registered emails": {
            value: "ajaykusa43@gmail.com",
            keyIcon: "Mail",
            keyIconColor: "blue",
            valueSentiment: "info"
          }
        },
        websiteData: {
          "Emails": {
            value: "info@eduTestMerchant.in",
            keyIcon: "Mail",
            keyIconColor: "green",
            valueSentiment: "positive"
          }
        }
      },
      {
        datapoint: "Management",
        merchantData: {
          "Directors or Person Registering": {
            value: "Not specified",
            keyIcon: "Users",
            keyIconColor: "orange",
            valueSentiment: "negative"
          }
        },
        mcaData: {
          "Directors": {
            value: ["AJAY KUSA", "JANARDHAN JURRA"],
            keyIcon: "Users",
            keyIconColor: "green",
            valueSentiment: "positive"
          },
          "Designation": {
            value: "Directors",
            keyIcon: "BadgeInfo",
            keyIconColor: "green",
            valueSentiment: "positive"
          }
        },
        websiteData: {
          "CXOs & Directors": {
            value: "No CXO/Director names or designations found on website",
            keyIcon: "Users",
            keyIconColor: "orange",
            valueSentiment: "negative"
          }
        }
      }
    ],
    redFlags: [
      {
        code: "MA001",
        redFlag: "MCA not in line with Business Category",
        severity: "High",
        reasoning: "Business category/industry/segment not provided in MCA; merchant data lists \"Non Affiliated Education\" but no MCC code. Unable to confirm alignment.",
        triggered: true
      },
      {
        code: "MA002",
        redFlag: "Newly registered business (<6months)",
        severity: "Medium",
        reasoning: "MCA incorporation date is 11 Dec, 2023, which is less than 6 months from current date (June 2024).",
        triggered: true
      },
      {
        code: "MA007",
        redFlag: "Email/website domain mismatch across sources",
        severity: "Low",
        reasoning: "MCA email is ajaykusa43@gmail.com (personal), website email is info@eduTestMerchant.in (business); domain is eduTestMerchant.in, which matches website. Email domain mismatch between MCA and website.",
        triggered: true
      }
    ]
  },
  INV002: {
    caseId: "INV002",
    analysisCategory: "Merchant Analysis",
    data: [
      {
        datapoint: "Identifier",
        merchantData: {
          "Merchant ID": {
            value: "892919",
            keyIcon: "BadgeCheck",
            keyIconColor: "blue",
            valueSentiment: "info"
          }
        },
        mcaData: {
          "CIN": {
            value: "U67190MH1999PLC119009",
            keyIcon: "FileText",
            keyIconColor: "blue",
            valueSentiment: "info"
          }
        },
        websiteData: {
          "Website URL": {
            value: "www.ebixcash.com",
            keyIcon: "Globe",
            keyIconColor: "blue",
            valueSentiment: "positive"
          }
        }
      },
      {
        datapoint: "Registered Business Name",
        merchantData: {
          "Legal Name": {
            value: "EBIXCASH WORLD MONEY LIMITED",
            keyIcon: "Heading",
            keyIconColor: "blue",
            valueSentiment: "info"
          }
        },
        mcaData: {
          "Exact match": {
            value: "EBIXCASH WORLD MONEY LIMITED",
            keyIcon: "CheckCircle2",
            keyIconColor: "green",
            valueSentiment: "positive"
          }
        },
        websiteData: {
          "Entity name": {
            value: "EBIXCASH World Money Limited (erstwhile Centrum Direct Limited)",
            keyIcon: "Heading",
            keyIconColor: "blue",
            valueSentiment: "info"
          }
        }
      },
      {
        datapoint: "Brand Name",
        merchantData: {
          "Brand Name": {
            value: "Ebix Cash",
            keyIcon: "BadgeInfo",
            keyIconColor: "blue",
            valueSentiment: "info"
          }
        },
        mcaData: {
          "Brand Name": {
            value: "Null",
            keyIcon: "BadgeInfo",
            keyIconColor: "gray",
            valueSentiment: "neutral"
          }
        },
        websiteData: {
          "Brand Name": {
            value: "EbixCash, Ebix Payment Services Pvt Ltd, EBIXCASH World Money Limited (erstwhile Centrum Direct Limited), Via.com/Sasti Tickets, AHA Taxi",
            keyIcon: "BadgeInfo",
            keyIconColor: "blue",
            valueSentiment: "info"
          }
        }
      },
      {
        datapoint: "Business Category",
        merchantData: {
          "Category": {
            value: "Financial Services",
            keyIcon: "Layers",
            keyIconColor: "blue",
            valueSentiment: "info"
          },
          "MCC Code & Name": {
            value: "6050 - Quasi Cash-Member Financial Institution",
            keyIcon: "ListOrdered",
            keyIconColor: "green",
            valueSentiment: "positive"
          }
        },
        mcaData: {
          "Broad Industry Category": {
            value: "1",
            keyIcon: "Layers",
            keyIconColor: "blue",
            valueSentiment: "info"
          },
          "Industry": {
            value: "BFSI",
            keyIcon: "Layers",
            keyIconColor: "blue",
            valueSentiment: "info"
          },
          "Segment(s)": {
            value: "Money Exchangers",
            keyIcon: "Layers",
            keyIconColor: "blue",
            valueSentiment: "info"
          }
        },
        websiteData: {
          "Category": {
            value: "Financial Services, Forex, Money Transfer, Prepaid Cards, Bill Payments, Insurance, Travel Booking (Flights, Hotels, Holidays, Cabs, Buses), Gift Cards",
            keyIcon: "Layers",
            keyIconColor: "blue",
            valueSentiment: "info"
          }
        }
      },
      {
        datapoint: "Offerings Summary",
        merchantData: {
          "Offerings Summary": {
            value: "Null",
            keyIcon: "FileText",
            keyIconColor: "gray",
            valueSentiment: "neutral"
          }
        },
        mcaData: {
          "About the Company": {
            value: "Ebixcash World Money Limited (EWML), as per its credit rating report, is engaged in the foreign exchange and money-changing business arm of the Centrum Group, which had a presence in varied financial services, such as investment banking, institutional equities, alternative assets, wealth management, retail broking, and NBFC. Its services include buy forex, sell forex, prepaid forex card, cash to master, travel insurance, and many more. The company was incorporated in 1999 and has its registered office located in Mumbai, Maharashtra.",
            keyIcon: "FileText",
            keyIconColor: "blue",
            valueSentiment: "info"
          }
        },
        websiteData: {
          "Looks like": {
            value: "The EbixCash website's consumer-facing product/service categories include Flights, Hotels, Holidays, Cabs, Buses, Forex, Money Transfer, Bill Payments, Prepaid & Gift Cards, Insurance, Ask a Doctor, Fastag. However, no actual product/service listings, prices, SKUs, or availability information are displayed; most categories are empty or contain only search forms.",
            keyIcon: "FileText",
            keyIconColor: "orange",
            valueSentiment: "neutral"
          },
          "About us section": {
            value: "Not available on this page",
            keyIcon: "Info",
            keyIconColor: "orange",
            valueSentiment: "negative"
          }
        }
      },
      {
        datapoint: "Start Date",
        merchantData: {
          "Onboarded on": {
            value: "Not provided",
            keyIcon: "CalendarClock",
            keyIconColor: "gray",
            valueSentiment: "neutral"
          }
        },
        mcaData: {
          "Date of Incorporation": {
            value: "19 Mar, 1999",
            keyIcon: "CalendarClock",
            keyIconColor: "green",
            valueSentiment: "positive"
          }
        },
        websiteData: {
          "Website Created Date": {
            value: "13/09/2017",
            keyIcon: "CalendarClock",
            keyIconColor: "green",
            valueSentiment: "positive"
          }
        }
      },
      {
        datapoint: "Location",
        merchantData: {
          "City, State": {
            value: "Maharashtra",
            keyIcon: "MapPin",
            keyIconColor: "blue",
            valueSentiment: "info"
          }
        },
        mcaData: {
          "Registered Address": {
            value: "8th Floor, Manek Plaza, Kalina CST Road, Kolekalyan, Santacruz (E), Mumbai, Maharashtra, 400098",
            keyIcon: "MapPin",
            keyIconColor: "blue",
            valueSentiment: "info"
          },
          "Business Address": {
            value: "8th Floor, Manek Plaza, CST Road, Kalina, Kolekalyan, Santacruz, Mumbai, MAHARASHTRA, 400098",
            keyIcon: "MapPin",
            keyIconColor: "blue",
            valueSentiment: "info"
          }
        },
        websiteData: {
          "Office Address": {
            value: "EBIXCASH World Money Limited (erstwhile Centrum Direct Limited), Manek Plaza, Level II, CST Road, Vidyanagari Marg, Above Axis Bank, Kalina, Santacruz (East) Mumbai -400098; Ebix Payment Services Pvt Ltd, 2nd Floor, Manek Plaza, Kalina CST Road, Kolekalyan, Santacruz (East), Mumbai, Mumbai City MH 400098",
            keyIcon: "MapPinned",
            keyIconColor: "blue",
            valueSentiment: "info"
          },
          "Domain Location": {
            value: "Mumbai, Maharashtra, India",
            keyIcon: "MapPinned",
            keyIconColor: "blue",
            valueSentiment: "info"
          }
        }
      },
      {
        datapoint: "Phone",
        merchantData: {
          "Phone Number": {
            value: "Not provided",
            keyIcon: "Phone",
            keyIconColor: "orange",
            valueSentiment: "negative"
          }
        },
        mcaData: {
          "All registered phones": {
            value: "+91-22-61125656, 93******38, +91-8929485250",
            keyIcon: "Phone",
            keyIconColor: "green",
            valueSentiment: "positive"
          }
        },
        websiteData: {
          "Phone numbers": {
            value: "1800120256666, 02261125656, 1800 266 5757, 0120-4688400, 18001034222, 18001027111, 18002676543, 13476961234, 17203625024, 9317714302, 1204868200, 9350845546, 7760409975, 9686450617, 7406886060, 8010021822, 9320270055",
            keyIcon: "Phone",
            keyIconColor: "green",
            valueSentiment: "positive"
          }
        }
      },
      {
        datapoint: "Email",
        merchantData: {
          "Email ID": {
            value: "Not provided",
            keyIcon: "Mail",
            keyIconColor: "orange",
            valueSentiment: "negative"
          }
        },
        mcaData: {
          "All registered emails": {
            value: "info@ebixcash.com, cs@ebix.com",
            keyIcon: "Mail",
            keyIconColor: "green",
            valueSentiment: "positive"
          }
        },
        websiteData: {
          "Emails": {
            value: "mycard-support@ebixcard.com, customercareforex@ebixcash.com, head-customersupport@ebixcard.com, grievance@ebixcard.com, nodalofficer@ebixcash.com, head-customercareforex@ebixcash.com, nodalofficerforex@ebixcash.com, rakesh.sharma@ebixcash.com, remittances@ebixcash.com, pno@ebixcash.com, jimmyb@ebixcash.com, help@ebixcash.com, care@ebixcash.com, nancy.sharma@ebixcash.com, nilambarir.itz@intrexindia.net, sadang@ebixcash.com, rupakm@ebixcash.com, hema.jagtiani@ebixcash.com, Shashi.singh@via.com, Manu.katiyar@ebix.com, Bipasha.mukherjee@via.com, Support@ahataxis.com",
            keyIcon: "Mail",
            keyIconColor: "green",
            valueSentiment: "positive"
          }
        }
      },
      {
        datapoint: "Management",
        merchantData: {
          "Directors or Person Registering": {
            value: "Not provided",
            keyIcon: "Users",
            keyIconColor: "orange",
            valueSentiment: "negative"
          }
        },
        mcaData: {
          "Directors": {
            value: [
              "TIRUVANAMALAI CHANDRASHEKARAN GURUPRASAD",
              "HIMANSHU SONATON PRAMANICK",
              "VANI MAHAJAN",
              "KARAN BAGGA",
              "SATYA BUSHAN KOTRU",
              "DEEPAK BHAN",
              "SHEETAL SINGH",
              "JYOTI KACHROO",
              "LAUREN PATON",
              "SHAILENDRA KISHOR APTE",
              "KUMUD RANJAN MOHANTY",
              "RAJESH VIRENDRAKUMAR NANAVATY",
              "SOUNDARA KUMAR",
              "BHARAT BAKHSHI",
              "SUBHASH GUNDAPPA KUTTE",
              "TIRUTHURAI POONDI MADHAVAN RAMAMURTI",
              "RAJNISH BAHL",
              "STEVEN ANGELO PINTO",
              "RAMCHANDRA KASARGOD KAMATH",
              "VIVEK VIG",
              "ARCHANA ALOK GOYAL",
              "PARAG GUNVANTRAI SHAH",
              "KIZNAGAR VENKATESAN KRISHNAMURTHY",
              "VIJAY KUMAR CHOPRA",
              "KRISHAN KANT RATHI",
              "ASHOKKUMAR NARAYAN SHINKAR",
              "SHRIDHAR NARAYAN",
              "GOPALAKRISHNAN NARAYANAN",
              "ASHUTOSH ARVIND LAVAKARE",
              "RAJAN CHANDRAKANT BHAT",
              "GOPAL KRISHAN SHARMA",
              "VENKATESH SRINIVASAN",
              "ANUJ CHIRANJILAL JOSHI",
              "CHANDIR GOBIND GIDWANI",
              "ANAND KAMALNAYAN PANDIT",
              "MAHESH RAGHAVAN MENON"
            ],
            keyIcon: "Users",
            keyIconColor: "green",
            valueSentiment: "positive"
          },
          "CXOs": {
            value: [
              "PRAVIN MADHUKAR PATIL",
              "DHANVANTI VINAYAK DANGI",
              "KUMUD RANJAN MOHANTY"
            ],
            keyIcon: "Users",
            keyIconColor: "green",
            valueSentiment: "positive"
          }
        },
        websiteData: {
          "CXOs & Directors": {
            value: "Not explicitly listed; department contacts include: Shashi Singh, Manu Katiyar, Bipasha Mukherjee, Sunny Nagpal, Rakesh Sharma, Jimmy Bharucha, Nancy Sharma, Nilambari Rajguru, Sadanprasad Gupta, Rupak Mehendale, Hema C Jagtiani",
            keyIcon: "Users",
            keyIconColor: "orange",
            valueSentiment: "negative"
          }
        }
      }
    ],
    redFlags: [
      {
        code: "MA003",
        redFlag: "Management information unavailable",
        severity: "Low",
        reasoning: "MCA data shows extensive director and CXO information, but website only lists department contacts without explicit director/CXO designations.",
        triggered: true
      },
    ]
  },
  INV003: {
    caseId: "INV003",
    analysisCategory: "Merchant Analysis",
    data: [
      {
        datapoint: "Identifier",
        merchantData: {
          "Merchant ID": {
            value: "1113876",
            keyIcon: "BadgeCheck",
            keyIconColor: "blue",
            valueSentiment: "info"
          }
        },
        mcaData: {
          "CIN": {
            value: "U74102WB2025OPC280138",
            keyIcon: "FileText",
            keyIconColor: "blue",
            valueSentiment: "info"
          }
        },
        websiteData: {
          "Website URL": {
            value: "www.interiorsbysajjee.com",
            keyIcon: "Globe",
            keyIconColor: "blue",
            valueSentiment: "positive"
          }
        }
      },
      {
        datapoint: "Registered Business Name",
        merchantData: {
          "Legal Name": {
            value: "SAJJEEVAN INTERIORS OPC PRIVATE LIMITED",
            keyIcon: "Heading",
            keyIconColor: "blue",
            valueSentiment: "info"
          }
        },
        mcaData: {
          "Exact match": {
            value: "SAJJEEVAN INTERIORS (OPC) PRIVATE LIMITED",
            keyIcon: "CheckCircle2",
            keyIconColor: "green",
            valueSentiment: "positive"
          }
        },
        websiteData: {
          "Entity name": {
            value: "SAJJEEVAN INTERIORS PRIVATE LIMITED",
            keyIcon: "Heading",
            keyIconColor: "blue",
            valueSentiment: "info"
          }
        }
      },
      {
        datapoint: "Brand Name",
        merchantData: {
          "Brand Name": {
            value: "SAJJEEVAN INTERIORS",
            keyIcon: "BadgeInfo",
            keyIconColor: "blue",
            valueSentiment: "info"
          }
        },
        mcaData: {
          "Brand Name": {
            value: "Null",
            keyIcon: "BadgeInfo",
            keyIconColor: "gray",
            valueSentiment: "neutral"
          }
        },
        websiteData: {
          "Brand Name": {
            value: "SAJJEEVAN INTERIORS PRIVATE LIMITED (site branding)",
            keyIcon: "BadgeInfo",
            keyIconColor: "blue",
            valueSentiment: "info"
          }
        }
      },
      {
        datapoint: "Business Category",
        merchantData: {
          "Category": {
            value: "Ecommerce/Retail",
            keyIcon: "Layers",
            keyIconColor: "blue",
            valueSentiment: "info"
          },
          "MCC Code & Name": {
            value: "Not provided",
            keyIcon: "ListOrdered",
            keyIconColor: "gray",
            valueSentiment: "neutral"
          }
        },
        mcaData: {
          "Broad Industry Category": {
            value: "-",
            keyIcon: "Layers",
            keyIconColor: "gray",
            valueSentiment: "neutral"
          },
          "Industry": {
            value: "-",
            keyIcon: "Layers",
            keyIconColor: "gray",
            valueSentiment: "neutral"
          },
          "Segment(s)": {
            value: "-",
            keyIcon: "Layers",
            keyIconColor: "gray",
            valueSentiment: "neutral"
          }
        },
        websiteData: {
          "Category": {
            value: "Interior Design & Home Furnishing Ecommerce",
            keyIcon: "Layers",
            keyIconColor: "blue",
            valueSentiment: "info"
          }
        }
      },
      {
        datapoint: "Offerings Summary",
        merchantData: {
          "Offerings Summary": {
            value: "Null",
            keyIcon: "FileText",
            keyIconColor: "gray",
            valueSentiment: "neutral"
          }
        },
        mcaData: {
          "About the Company": {
            value: "-",
            keyIcon: "FileText",
            keyIconColor: "gray",
            valueSentiment: "neutral"
          }
        },
        websiteData: {
          "Looks like": {
            value: "Sells interior design products and services including TV units, bedroom designs, kitchen designs, false ceiling designs, and storage solutions. Products are listed with prices in INR and unique images. No evidence of impersonation or banned & restricted category content.",
            keyIcon: "FileText",
            keyIconColor: "blue",
            valueSentiment: "info"
          },
          "About us section": {
            value: "Not explicitly available",
            keyIcon: "Info",
            keyIconColor: "orange",
            valueSentiment: "neutral"
          }
        }
      },
      {
        datapoint: "Start Date",
        merchantData: {
          "Onboarded on": {
            value: "Not provided",
            keyIcon: "CalendarClock",
            keyIconColor: "gray",
            valueSentiment: "neutral"
          }
        },
        mcaData: {
          "Date of Incorporation": {
            value: "6 Jun, 2025",
            keyIcon: "CalendarClock",
            keyIconColor: "orange",
            valueSentiment: "negative"
          }
        },
        websiteData: {
          "Website Created Date": {
            value: "29/10/2025",
            keyIcon: "CalendarClock",
            keyIconColor: "orange",
            valueSentiment: "negative"
          }
        }
      },
      {
        datapoint: "Location",
        merchantData: {
          "City, State": {
            value: "West Bengal",
            keyIcon: "MapPin",
            keyIconColor: "blue",
            valueSentiment: "info"
          }
        },
        mcaData: {
          "Registered Address": {
            value: "105/24B, DUM DUM ROAD, SEAL COLONY, GD FLR, Dumdum Road, Kolkata, West Bengal, 700074",
            keyIcon: "MapPin",
            keyIconColor: "blue",
            valueSentiment: "info"
          },
          "Business Address": {
            value: "-",
            keyIcon: "MapPin",
            keyIconColor: "gray",
            valueSentiment: "neutral"
          }
        },
        websiteData: {
          "Office Address": {
            value: "802-A, 8th floor, Saberwal house, 55B, Mirza Galib street, Kolkata, 700016, West Bengal, India",
            keyIcon: "MapPinned",
            keyIconColor: "blue",
            valueSentiment: "info"
          },
          "Domain Location": {
            value: "Kolkata, West Bengal, India (website IP: Canada)",
            keyIcon: "MapPinned",
            keyIconColor: "blue",
            valueSentiment: "info"
          }
        }
      },
      {
        datapoint: "Phone",
        merchantData: {
          "Phone Number": {
            value: "Not provided",
            keyIcon: "Phone",
            keyIconColor: "orange",
            valueSentiment: "negative"
          }
        },
        mcaData: {
          "All registered phones": {
            value: "-",
            keyIcon: "Phone",
            keyIconColor: "gray",
            valueSentiment: "neutral"
          }
        },
        websiteData: {
          "Phone numbers": {
            value: "8829871975",
            keyIcon: "Phone",
            keyIconColor: "green",
            valueSentiment: "positive"
          }
        }
      },
      {
        datapoint: "Email",
        merchantData: {
          "Email ID": {
            value: "Not provided",
            keyIcon: "Mail",
            keyIconColor: "orange",
            valueSentiment: "negative"
          }
        },
        mcaData: {
          "All registered emails": {
            value: "sajjeevaninteriorsopcpvtltd@gmail.com",
            keyIcon: "Mail",
            keyIconColor: "orange",
            valueSentiment: "negative"
          }
        },
        websiteData: {
          "Emails": {
            value: "sajjeevaninteriorsopcpvtltd@gmail.com",
            keyIcon: "Mail",
            keyIconColor: "orange",
            valueSentiment: "negative"
          }
        }
      },
      {
        datapoint: "Management",
        merchantData: {
          "Directors or Person Registering": {
            value: "Not provided",
            keyIcon: "Users",
            keyIconColor: "orange",
            valueSentiment: "negative"
          }
        },
        mcaData: {
          "Directors": {
            value: ["PAVAN KUMAR JANGAM"],
            keyIcon: "Users",
            keyIconColor: "green",
            valueSentiment: "positive"
          },
          "Designation": {
            value: "Director",
            keyIcon: "BadgeInfo",
            keyIconColor: "green",
            valueSentiment: "positive"
          }
        },
        websiteData: {
          "CXOs & Directors": {
            value: "PAVAN KUMAR JANGAM, Legal Name (assumed owner/director)",
            keyIcon: "Users",
            keyIconColor: "green",
            valueSentiment: "positive"
          }
        }
      }
    ],
    redFlags: [
      {
        code: "MA002",
        redFlag: "Newly registered business",
        severity: "Medium",
        reasoning: "MCA incorporation date is 6 Jun, 2025, which is less than 6 months from current date.",
        triggered: true
      },
      {
        code: "MA003",
        redFlag: "Newly registered domain",
        severity: "Medium",
        reasoning: "Website created date is 29/10/2025, which is less than 6 months from current date.",
        triggered: true
      },
      {
        code: "MA005",
        redFlag: "Address city mismatch across sources",
        severity: "Medium",
        reasoning: "MCA address is in Dumdum Road, Kolkata; website address is in Mirza Galib street, Kolkata. These are different localities within Kolkata.",
        triggered: true
      },
      {
        code: "MA006",
        redFlag: "Registered name mismatch across sources",
        severity: "Low",
        reasoning: "MCA shows 'SAJJEEVAN INTERIORS (OPC) PRIVATE LIMITED' while website shows 'SAJJEEVAN INTERIORS PRIVATE LIMITED' (missing OPC designation).",
        triggered: true
      }
    ]
  },
  INV005: {
    caseId: "INV005",
    analysisCategory: "Merchant Analysis",
    data: [
      {
        datapoint: "Identifier",
        merchantData: {
          "Merchant ID": {
            value: "1107494",
            keyIcon: "BadgeCheck",
            keyIconColor: "blue",
            valueSentiment: "info"
          }
        },
        mcaData: {
          "CIN": {
            value: "U62099TS2023PTC179868",
            keyIcon: "FileText",
            keyIconColor: "blue",
            valueSentiment: "info"
          }
        },
        websiteData: {
          "Website URL": {
            value: "www.edu.paymanfintech.in",
            keyIcon: "Globe",
            keyIconColor: "blue",
            valueSentiment: "positive"
          }
        }
      },
      {
        datapoint: "Registered Business Name",
        merchantData: {
          "Legal Name": {
            value: "PAYMAN FINTECH SOLUTIONS PRIVATE LIMITED",
            keyIcon: "Heading",
            keyIconColor: "blue",
            valueSentiment: "info"
          }
        },
        mcaData: {
          "Exact match": {
            value: "PAYMAN FINTECH SOLUTIONS PRIVATE LIMITED",
            keyIcon: "CheckCircle2",
            keyIconColor: "green",
            valueSentiment: "positive"
          }
        },
        websiteData: {
          "Entity name": {
            value: "Not explicitly stated",
            keyIcon: "AlertTriangle",
            keyIconColor: "orange",
            valueSentiment: "negative"
          }
        }
      },
      {
        datapoint: "Brand Name",
        merchantData: {
          "Brand Name": {
            value: "PAYMAN FINTECH SOLUTIONS PVT LTD",
            keyIcon: "BadgeInfo",
            keyIconColor: "blue",
            valueSentiment: "info"
          }
        },
        mcaData: {
          "Brand Name": {
            value: "Null",
            keyIcon: "BadgeInfo",
            keyIconColor: "gray",
            valueSentiment: "neutral"
          }
        },
        websiteData: {
          "Brand Name": {
            value: "EDUpayman",
            keyIcon: "BadgeInfo",
            keyIconColor: "blue",
            valueSentiment: "info"
          }
        }
      },
      {
        datapoint: "Business Category",
        merchantData: {
          "Category": {
            value: "Non Affiliated Education",
            keyIcon: "Users",
            keyIconColor: "blue",
            valueSentiment: "info"
          },
          "MCC Code": {
            value: "Not provided",
            keyIcon: "AlertTriangle",
            keyIconColor: "red",
            valueSentiment: "negative"
          }
        },
        mcaData: {
          "Industry Category": {
            value: "-",
            keyIcon: "AlertTriangle",
            keyIconColor: "red",
            valueSentiment: "negative"
          },
          "Industry": {
            value: "-",
            keyIcon: "AlertTriangle",
            keyIconColor: "red",
            valueSentiment: "negative"
          },
          "Segment": {
            value: "-",
            keyIcon: "AlertTriangle",
            keyIconColor: "red",
            valueSentiment: "negative"
          }
        },
        websiteData: {
          "Business Type": {
            value: "Null",
            keyIcon: "AlertTriangle",
            keyIconColor: "gray",
            valueSentiment: "neutral"
          }
        }
      },
      {
        datapoint: "Start Date",
        merchantData: {
          "Onboarded": {
            value: "Not provided",
            keyIcon: "CalendarClock",
            keyIconColor: "gray",
            valueSentiment: "neutral"
          }
        },
        mcaData: {
          "Incorporation Date": {
            value: "11 Dec, 2023",
            keyIcon: "CalendarClock",
            keyIconColor: "red",
            valueSentiment: "negative"
          }
        },
        websiteData: {
          "Domain Created": {
            value: "None",
            keyIcon: "CalendarClock",
            keyIconColor: "gray",
            valueSentiment: "neutral"
          }
        }
      },
      {
        datapoint: "Location",
        merchantData: {
          "State": {
            value: "Telangana",
            keyIcon: "MapPin",
            keyIconColor: "blue",
            valueSentiment: "info"
          }
        },
        mcaData: {
          "Registered Address": {
            value: "10-100, ST NO:10, H M T NAGAR, I.E.Nacharam, Uppal, Telangana, 500076",
            keyIcon: "MapPin",
            keyIconColor: "green",
            valueSentiment: "positive"
          }
        },
        websiteData: {
          "Office Address": {
            value: "SRI RAMACHANDRA NIVAS, 4-9-12 STREET NO 1, H M T NAGAR,NACHARAM, PIN CODE - 500076, CIRCLE 1,HYDERABAD",
            keyIcon: "MapPin",
            keyIconColor: "green",
            valueSentiment: "positive"
          }
        }
      },
      {
        datapoint: "Email",
        merchantData: {
          "Contact Email": {
            value: "Not provided",
            keyIcon: "Mail",
            keyIconColor: "gray",
            valueSentiment: "neutral"
          }
        },
        mcaData: {
          "Email": {
            value: "ajaykusa43@gmail.com",
            keyIcon: "Mail",
            keyIconColor: "red",
            valueSentiment: "negative"
          }
        },
        websiteData: {
          "Business Email": {
            value: "info@edupayman.in",
            keyIcon: "Mail",
            keyIconColor: "blue",
            valueSentiment: "info"
          }
        }
      }
    ],
    redFlags: [
      {
        code: "MA001",
        redFlag: "MCA not in line with Business Category",
        severity: "High",
        reasoning: "Business category/industry/segment not provided in MCA; merchant data lists 'Non Affiliated Education' but no MCC code. Unable to confirm alignment.",
        triggered: true
      },
      {
        code: "MA002",
        redFlag: "Newly registered business (<6months)",
        severity: "Medium",
        reasoning: "MCA incorporation date is 11 Dec, 2023, which is less than 6 months from current date (June 2024).",
        triggered: true
      },
      {
        code: "MA007",
        redFlag: "Email/website domain mismatch across sources",
        severity: "Low",
        reasoning: "MCA email is ajaykusa43@gmail.com (personal), website email is info@edupayman.in (business); domain is edupayman.in, which matches website. Email domain mismatch between MCA and website.",
        triggered: true
      }
    ]
  }
};

export const invExternalInsightsData: Record<string, CaseExternalInsightsData> = {
  INV001: {
    caseId: "INV001",
    analysisCategory: "Merchant Analysis",
    data: [
      {
        topic: "Social Presence",
        summary:
          "Limited LinkedIn activity with fewer than 50 followers suggests low organic reach.",
        source: "LinkedIn"
      },
      {
        topic: "Customer Feedback",
        summary:
          "Third-party forums contain mixed reviews citing aggressive discounting tactics.",
        source: "FintechWatch Forums"
      }
    ],
    redFlags: [
      {
        code: "MA010",
        redFlag: "Sparse digital footprint",
        severity: "Medium",
        reasoning:
          "Merchant lacks consistent updates across professional networks, limiting verification.",
        triggered: true
      }
    ]
  },
  INV005: {
    caseId: "INV005",
    analysisCategory: "Website Analysis",
    data: [
      {
        topic: "Website Functionality",
        summary: "Website is functional with HTTPS enabled and valid SSL certificate. Response time is 5.2 seconds.",
        source: "Website Analysis"
      },
      {
        topic: "Domain Information",
        summary: "Domain edu.paymanfintech.in is hosted at IP 13.235.110.199 in India with self-hosting configuration.",
        source: "Domain Registry"
      },
      {
        topic: "Navigation Issues",
        summary: "Only login functionality is available with no sign-up or registration options anywhere on the site.",
        source: "User Experience Analysis"
      },
      {
        topic: "Contact Information",
        summary: "Contact information includes email (info@edupayman.in), phone (+91 9100748033), and physical address in Hyderabad.",
        source: "Contact Analysis"
      },
      {
        topic: "Legal Compliance",
        summary: "Return/refund policy, privacy policy, and terms & conditions are present but registered business name is not explicitly stated.",
        source: "Compliance Review"
      },
      {
        topic: "Content Quality",
        summary: "No brand impersonation detected, no banned & restricted category content, banned words, or scam phrases found.",
        source: "Content Analysis"
      }
    ],
    redFlags: []
  }
};

export const invWebsiteData: Record<string, CaseWebsiteData> = {
  INV001: {
    caseId: "INV001",
    analysisCategory: "Website Analysis",
    data: [
      {
        field: "Functional",
        value: "Yes",
        keyIcon: "Power",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "HTTPS Enabled",
        value: "Yes",
        keyIcon: "ShieldCheck",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Status Code",
        value: "200",
        keyIcon: "Activity",
        keyIconColor: "blue",
        valueSentiment: "positive"
      },
      {
        field: "SSL Certificate",
        value: "Valid — Issuer: Not specified",
        keyIcon: "Lock",
        keyIconColor: "blue",
        valueSentiment: "positive"
      },
      {
        field: "Response Time",
        value: "5.2 seconds",
        keyIcon: "Timer",
        keyIconColor: "orange",
        valueSentiment: "neutral"
      }
    ],
    redFlags: []
  },
  INV002: {
    caseId: "INV002",
    analysisCategory: "Website Analysis",
    data: [
      {
        field: "Functional",
        value: "Yes",
        keyIcon: "Power",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "HTTPS Enabled",
        value: "Yes",
        keyIcon: "ShieldCheck",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Status Code",
        value: "200",
        keyIcon: "Activity",
        keyIconColor: "blue",
        valueSentiment: "positive"
      },
      {
        field: "SSL Certificate",
        value: "Valid — Issuer: Not specified",
        keyIcon: "Lock",
        keyIconColor: "blue",
        valueSentiment: "positive"
      },
      {
        field: "Response Time",
        value: "5.56 seconds",
        keyIcon: "Timer",
        keyIconColor: "orange",
        valueSentiment: "neutral"
      }
    ],
    redFlags: []
  },
  INV004: {
    caseId: "INV004",
    analysisCategory: "Website Analysis",
    data: [
      {
        field: "Functional",
        value: "Yes",
        keyIcon: "Power",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "HTTPS Enabled",
        value: "Yes",
        keyIcon: "ShieldCheck",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Status Code",
        value: "200",
        keyIcon: "Activity",
        keyIconColor: "blue",
        valueSentiment: "positive"
      },
      {
        field: "SSL Certificate",
        value: "Valid — Issuer: Not specified (Shopify)",
        keyIcon: "Lock",
        keyIconColor: "blue",
        valueSentiment: "positive"
      },
      {
        field: "Response Time",
        value: "1.22 seconds",
        keyIcon: "Timer",
        keyIconColor: "green",
        valueSentiment: "positive"
      }
    ],
    redFlags: []
  },
  INV003: {
    caseId: "INV003",
    analysisCategory: "Website Analysis",
    data: [
      {
        field: "Functional",
        value: "Yes",
        keyIcon: "Power",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "HTTPS Enabled",
        value: "Yes",
        keyIcon: "ShieldCheck",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Status Code",
        value: "200",
        keyIcon: "Activity",
        keyIconColor: "blue",
        valueSentiment: "positive"
      },
      {
        field: "SSL Certificate",
        value: "Valid — Issuer: Not specified, but certificate is valid",
        keyIcon: "Lock",
        keyIconColor: "blue",
        valueSentiment: "positive"
      },
      {
        field: "Response Time",
        value: "1.35 seconds",
        keyIcon: "Timer",
        keyIconColor: "green",
        valueSentiment: "positive"
      }
    ],
    redFlags: []
  },
  INV005: {
    caseId: "INV005",
    analysisCategory: "Website Analysis",
    data: [
      {
        field: "Functional",
        value: "Yes",
        keyIcon: "Power",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "HTTPS Enabled",
        value: "Yes",
        keyIcon: "ShieldCheck",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Status Code",
        value: "200",
        keyIcon: "CheckCircle2",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "SSL Certificate",
        value: "Valid",
        keyIcon: "ShieldCheck",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Response Time",
        value: "5.2 seconds",
        keyIcon: "Timer",
        keyIconColor: "orange",
        valueSentiment: "negative"
      }
    ],
    redFlags: []
  }
};

export const invDomainInformationData: Record<
  string,
  CaseDomainInformationData
> = {
  INV001: {
    caseId: "INV001",
    analysisCategory: "Website Analysis",
    data: [
      {
        field: "Domain Name",
        value: "edu.TestMerchantfintech.in",
        keyIcon: "Globe",
        keyIconColor: "blue",
        valueSentiment: "info"
      },
      {
        field: "Creation Date",
        value: "None",
        keyIcon: "CalendarClock",
        keyIconColor: "orange",
        valueSentiment: "negative"
      },
      {
        field: "Registrar",
        value: "None",
        keyIcon: "BadgeCheck",
        keyIconColor: "orange",
        valueSentiment: "negative"
      },
      {
        field: "Domain Owner",
        value: "None",
        keyIcon: "User",
        keyIconColor: "orange",
        valueSentiment: "negative"
      },
      {
        field: "Privacy Protection",
        value: "None",
        keyIcon: "Shield",
        keyIconColor: "gray",
        valueSentiment: "neutral"
      },
      {
        field: "IP & Location",
        value: "13.235.110.199 (India)",
        keyIcon: "MapPin",
        keyIconColor: "blue",
        valueSentiment: "info"
      },
      {
        field: "Hosting",
        value: "Self-hosted",
        keyIcon: "Server",
        keyIconColor: "blue",
        valueSentiment: "info"
      }
    ],
    redFlags: []
  },
  INV002: {
    caseId: "INV002",
    analysisCategory: "Website Analysis",
    data: [
      {
        field: "Domain Name",
        value: "ebixcash.com",
        keyIcon: "Globe",
        keyIconColor: "blue",
        valueSentiment: "info"
      },
      {
        field: "Creation Date",
        value: "13-09-2017",
        keyIcon: "CalendarClock",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Registrar",
        value: "Network Solutions, LLC",
        keyIcon: "BadgeCheck",
        keyIconColor: "blue",
        valueSentiment: "positive"
      },
      {
        field: "Domain Owner",
        value: "None (not specified)",
        keyIcon: "User",
        keyIconColor: "gray",
        valueSentiment: "neutral"
      },
      {
        field: "Privacy Protection",
        value: "No",
        keyIcon: "Shield",
        keyIconColor: "gray",
        valueSentiment: "neutral"
      },
      {
        field: "IP & Location",
        value: "15.206.37.56 (India)",
        keyIcon: "MapPin",
        keyIconColor: "blue",
        valueSentiment: "info"
      },
      {
        field: "Hosting",
        value: "Self-hosted",
        keyIcon: "Server",
        keyIconColor: "blue",
        valueSentiment: "info"
      }
    ],
    redFlags: []
  },
  INV004: {
    caseId: "INV004",
    analysisCategory: "Website Analysis",
    data: [
      {
        field: "Domain Name",
        value: "kurti.digital",
        keyIcon: "Globe",
        keyIconColor: "blue",
        valueSentiment: "info"
      },
      {
        field: "Creation Date",
        value: "17-04-2014",
        keyIcon: "CalendarClock",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Registrar",
        value: "Binky Moon, LLC (c/o Identity Digital Inc.)",
        keyIcon: "BadgeCheck",
        keyIconColor: "blue",
        valueSentiment: "positive"
      },
      {
        field: "Domain Owner",
        value: "Shopify, Inc.",
        keyIcon: "User",
        keyIconColor: "blue",
        valueSentiment: "info"
      },
      {
        field: "Privacy Protection",
        value: "None",
        keyIcon: "Shield",
        keyIconColor: "gray",
        valueSentiment: "neutral"
      },
      {
        field: "IP & Location",
        value: "23.227.38.65 (Canada)",
        keyIcon: "MapPin",
        keyIconColor: "orange",
        valueSentiment: "negative"
      },
      {
        field: "Hosting",
        value: "Third-party: Shopify, Inc.",
        keyIcon: "Server",
        keyIconColor: "orange",
        valueSentiment: "neutral"
      }
    ],
    redFlags: [
      {
        code: "WA004",
        redFlag: "Third-party domain hosting",
        severity: "Low",
        reasoning: "Domain relies on Shopify, Inc. infrastructure instead of self-hosting.",
        triggered: true
      },
      {
        code: "WA005",
        redFlag: "Foreign domain IP detected",
        severity: "Medium",
        reasoning: "IP 23.227.38.65 resolves to Canada rather than an India-based host.",
        triggered: true
      }
    ]
  },
  INV003: {
    caseId: "INV003",
    analysisCategory: "Website Analysis",
    data: [
      {
        field: "Domain Name",
        value: "interiorsbysajjee.com",
        keyIcon: "Globe",
        keyIconColor: "blue",
        valueSentiment: "info"
      },
      {
        field: "Creation Date",
        value: "29-10-2025",
        keyIcon: "CalendarClock",
        keyIconColor: "orange",
        valueSentiment: "negative"
      },
      {
        field: "Registrar",
        value: "Tucows Domains Inc.",
        keyIcon: "BadgeCheck",
        keyIconColor: "blue",
        valueSentiment: "positive"
      },
      {
        field: "Domain Owner",
        value: "Contact Privacy Inc. Customer 0176541227",
        keyIcon: "User",
        keyIconColor: "blue",
        valueSentiment: "info"
      },
      {
        field: "Privacy Protection",
        value: "Enabled",
        keyIcon: "Shield",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "IP & Location",
        value: "23.227.38.72 (Canada)",
        keyIcon: "MapPin",
        keyIconColor: "blue",
        valueSentiment: "info"
      },
      {
        field: "Hosting",
        value: "Self-hosted",
        keyIcon: "Server",
        keyIconColor: "blue",
        valueSentiment: "info"
      }
    ],
    redFlags: []
  },
  INV005: {
    caseId: "INV005",
    analysisCategory: "Website Analysis",
    data: [
      {
        field: "Domain Name",
        value: "edu.paymanfintech.in",
        keyIcon: "Globe",
        keyIconColor: "blue",
        valueSentiment: "info"
      },
      {
        field: "Creation Date",
        value: "None",
        keyIcon: "CalendarClock",
        keyIconColor: "orange",
        valueSentiment: "negative"
      },
      {
        field: "Registrar",
        value: "None",
        keyIcon: "BadgeCheck",
        keyIconColor: "orange",
        valueSentiment: "negative"
      },
      {
        field: "Domain Owner",
        value: "None",
        keyIcon: "User",
        keyIconColor: "orange",
        valueSentiment: "negative"
      },
      {
        field: "Privacy Protection",
        value: "None",
        keyIcon: "ShieldCheck",
        keyIconColor: "orange",
        valueSentiment: "negative"
      },
      {
        field: "IP Address",
        value: "13.235.110.199",
        keyIcon: "Server",
        keyIconColor: "blue",
        valueSentiment: "info"
      },
      {
        field: "Location",
        value: "India",
        keyIcon: "MapPin",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Hosting",
        value: "Self-hosted",
        keyIcon: "Server",
        keyIconColor: "blue",
        valueSentiment: "info"
      }
    ],
    redFlags: []
  }
};

export const invNavigationFlowData: Record<
  string,
  CaseNavigationFlowData
> = {
  INV001: {
    caseId: "INV001",
    analysisCategory: "Website Analysis",
    data: [
      {
        field: "Homepage Redirection",
        value: "Redirect detected (Initial: https://edu.TestMerchantfintech.in/ → Final: https://edu.TestMerchantfintech.in/edu?Isedu=True&IsfastTag=False)",
        keyIcon: "Navigation",
        keyIconColor: "blue",
        valueSentiment: "info"
      },
      {
        field: "Core Navigations",
        value: "All Functional (Home, About, Contact Us)",
        keyIcon: "ListChecks",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Sign In Result",
        value:
          "Login available; Signup/Registration not available anywhere on the site",
        keyIcon: "LogIn",
        keyIconColor: "orange",
        valueSentiment: "negative"
      },
      {
        field: "Add to Cart",
        value: "Not Applicable (Non Affiliated Education, not e-commerce)",
        keyIcon: "ShoppingCart",
        keyIconColor: "gray",
        valueSentiment: "neutral"
      }
    ],
    redFlags: [
      {
        code: "WA010",
        redFlag: "Sign in blocked or unavailable",
        severity: "Medium",
        reasoning:
          "No Sign Up or Register option is present anywhere on the website; only Login functionality is available.",
        triggered: true
      }
    ]
  },
  INV002: {
    caseId: "INV002",
    analysisCategory: "Website Analysis",
    data: [
      {
        field: "Homepage Redirection",
        value: "None",
        keyIcon: "Navigation",
        keyIconColor: "blue",
        valueSentiment: "info"
      },
      {
        field: "Core Navigations",
        value: "All Functional",
        keyIcon: "ListChecks",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Sign In Result",
        value: "Authentication flows are present and functional; all required fields are present and extracted",
        keyIcon: "LogIn",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Add to Cart",
        value: "Not Applicable (Financial Services LOB, not e-commerce)",
        keyIcon: "ShoppingCart",
        keyIconColor: "gray",
        valueSentiment: "neutral"
      }
    ],
    redFlags: []
  },
  INV004: {
    caseId: "INV004",
    analysisCategory: "Website Analysis",
    data: [
      {
        field: "Homepage Redirection",
        value:
          "None (except during account/login flow, which redirects to Shopify authentication)",
        keyIcon: "Navigation",
        keyIconColor: "blue",
        valueSentiment: "info"
      },
      {
        field: "Core Navigations",
        value: "All Functional (Home, Catalog, Contact)",
        keyIcon: "ListChecks",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Sign In Result",
        value:
          "Sign in blocked/unavailable due to Shopify verification screen; unable to access login/signup fields",
        keyIcon: "LogIn",
        keyIconColor: "orange",
        valueSentiment: "negative"
      },
      {
        field: "Add to Cart",
        value: "Working",
        keyIcon: "ShoppingCart",
        keyIconColor: "green",
        valueSentiment: "positive"
      }
    ],
    redFlags: [
      {
        code: "WA010",
        redFlag: "Sign in blocked or unavailable",
        severity: "Medium",
        reasoning:
          "Shopify verification screen blocks access to login and signup flows.",
        triggered: true
      }
    ]
  },
  INV003: {
    caseId: "INV003",
    analysisCategory: "Website Analysis",
    data: [
      {
        field: "Homepage Redirection",
        value: "None (except for account-related flows)",
        keyIcon: "Navigation",
        keyIconColor: "blue",
        valueSentiment: "info"
      },
      {
        field: "Core Navigations",
        value: "All Functional (Home, Catalog, Contact)",
        keyIcon: "ListChecks",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Sign In Result",
        value:
          "Redirected to Shopify authentication wall; unable to access sign in or sign up fields",
        keyIcon: "LogIn",
        keyIconColor: "orange",
        valueSentiment: "negative"
      },
      {
        field: "Add to Cart",
        value: "Not Applicable (no mention of add to cart functionality in the data)",
        keyIcon: "ShoppingCart",
        keyIconColor: "gray",
        valueSentiment: "neutral"
      }
    ],
    redFlags: [
      {
        code: "WA010",
        redFlag: "Sign in blocked or unavailable",
        severity: "Medium",
        reasoning:
          "Account-related flows (Sign In/Sign Up) are blocked by a Shopify verification wall, making sign in unavailable.",
        triggered: true
      },
      {
        code: "WA009",
        redFlag: "Redirected to different domain",
        severity: "High",
        reasoning:
          "Redirection to a different domain (shopify.com) occurs when accessing account-related features.",
        triggered: true
      }
    ]
  },
  INV005: {
    caseId: "INV005",
    analysisCategory: "Website Analysis",
    data: [
      {
        field: "Homepage Redirection",
        value: "Redirect detected (Initial: https://edu.paymanfintech.in/ → Final: https://edu.paymanfintech.in/edu?Isedu=True&IsfastTag=False)",
        keyIcon: "Navigation",
        keyIconColor: "blue",
        valueSentiment: "info"
      },
      {
        field: "Core Navigations",
        value: "All Functional (Home, About, Contact Us)",
        keyIcon: "ListChecks",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Sign In Result",
        value: "Login available; Signup/Registration not available anywhere on the site",
        keyIcon: "LogIn",
        keyIconColor: "orange",
        valueSentiment: "negative"
      },
      {
        field: "Add to Cart",
        value: "Not Applicable (Non Affiliated Education, not e-commerce)",
        keyIcon: "ShoppingCart",
        keyIconColor: "gray",
        valueSentiment: "neutral"
      }
    ],
    redFlags: [
      {
        code: "WA010",
        redFlag: "Sign in blocked or unavailable",
        severity: "Medium",
        reasoning: "No Sign Up or Register option is present anywhere on the website; only Login functionality is available.",
        triggered: true
      }
    ]
  }
};

export const invContactSocialData: Record<
  string,
  CaseContactSocialData
> = {
  INV001: {
    caseId: "INV001",
    analysisCategory: "Website Analysis",
    data: [
      {
        field: "User Communication",
        value: ["Email", "Phone"],
        keyIcon: "MessagesSquare",
        keyIconColor: "blue",
        valueSentiment: "positive"
      },
      {
        field: "Contact Emails",
        value: ["info@eduTestMerchant.in"],
        keyIcon: "Mail",
        keyIconColor: "blue",
        valueSentiment: "positive"
      },
      {
        field: "Contact Phones",
        value: ["+91 9100748033"],
        keyIcon: "Phone",
        keyIconColor: "blue",
        valueSentiment: "positive"
      },
      {
        field: "Contact Addresses",
        value: [
          "SRI RAMACHANDRA NIVAS, 4-9-12 STREET NO 1, H M T NAGAR, NACHARAM, PIN CODE - 500076, CIRCLE 1, HYDERABAD"
        ],
        keyIcon: "MapPinned",
        keyIconColor: "blue",
        valueSentiment: "positive"
      },
      {
        field: "Social Media Links",
        value: [
          "Instagram: https://www.instagram.com/",
          "YouTube: https://www.youtube.com/",
          "LinkedIn: https://www.linkedin.com/",
          "Telegram: https://telegram.org/",
          "Facebook: Not Available",
          "X/Twitter: Not Available",
          "WhatsApp: Not Available",
          "Others: None"
        ],
        keyIcon: "Share2",
        keyIconColor: "purple",
        valueSentiment: "negative"
      },
      {
        field: "Legal Name & Registrations",
        value: [
          "Registered Entity: Not explicitly stated",
          "GST: Not Available",
          "CIN: Not Available",
          "Others: None"
        ],
        keyIcon: "BadgeInfo",
        keyIconColor: "blue",
        valueSentiment: "info"
      },
      {
        field: "Trademark & Copyright",
        value: "Not specified",
        keyIcon: "Copyright",
        keyIconColor: "gray",
        valueSentiment: "neutral"
      }
    ],
    redFlags: [
      {
        code: "WA023",
        redFlag: "No legal name or registrations mentioned",
        severity: "Medium",
        reasoning:
          "Registered business name not explicitly stated; no legal name or registrations mentioned.",
        triggered: true
      },
      {
        code: "WA019",
        redFlag: "Non-functional or generic social media links found",
        severity: "Medium",
        reasoning:
          "Social media links provided are generic (homepage URLs, not specific to the brand).",
        triggered: true
      }
    ]
  },
  INV002: {
    caseId: "INV002",
    analysisCategory: "Website Analysis",
    data: [
      {
        field: "User Communication",
        value: ["Email", "Phone numbers (multiple departments)", "Escalation matrix"],
        keyIcon: "MessagesSquare",
        keyIconColor: "blue",
        valueSentiment: "positive"
      },
      {
        field: "Contact Emails",
        value: [
          "mycard-support@ebixcard.com",
          "customercareforex@ebixcash.com",
          "head-customersupport@ebixcard.com",
          "grievance@ebixcard.com",
          "nodalofficer@ebixcash.com",
          "help@ebixcash.com",
          "care@ebixcash.com"
        ],
        keyIcon: "Mail",
        keyIconColor: "blue",
        valueSentiment: "positive"
      },
      {
        field: "Contact Phones",
        value: [
          "1800120256666",
          "02261125656",
          "1800 266 5757",
          "0120-4688400",
          "18001034222",
          "18001027111"
        ],
        keyIcon: "Phone",
        keyIconColor: "blue",
        valueSentiment: "positive"
      },
      {
        field: "Contact Addresses",
        value: [
          "EBIXCASH World Money Limited (erstwhile Centrum Direct Limited), Manek Plaza, Level II, CST Road, Vidyanagari Marg, Above Axis Bank, Kalina, Santacruz (East) Mumbai -400098",
          "Ebix Payment Services Pvt Ltd, 2nd Floor, Manek Plaza, Kalina CST Road, Kolekalyan, Santacruz (East), Mumbai, Mumbai City MH 400098"
        ],
        keyIcon: "MapPinned",
        keyIconColor: "blue",
        valueSentiment: "positive"
      },
      {
        field: "Social Media Links",
        value: [
          "Facebook: Redirects to Facebook login page (no direct handle revealed)",
          "Instagram: Redirects to Instagram login page (no direct handle revealed)",
          "X/Twitter: https://x.com/EbixCash",
          "YouTube: Not Available",
          "LinkedIn: Not Available",
          "WhatsApp: Not Available",
          "Others: Not Available"
        ],
        keyIcon: "Share2",
        keyIconColor: "blue",
        valueSentiment: "positive"
      },
      {
        field: "Legal Name & Registrations",
        value: [
          "Registered Entity: Ebix Payment Services Pvt Ltd, EBIXCASH World Money Limited (erstwhile Centrum Direct Limited)",
          "GST: Not Available",
          "CIN: Not Available",
          "Others: Not Available"
        ],
        keyIcon: "BadgeInfo",
        keyIconColor: "blue",
        valueSentiment: "info"
      },
      {
        field: "Trademark & Copyright",
        value: "Not specified",
        keyIcon: "Copyright",
        keyIconColor: "gray",
        valueSentiment: "neutral"
      }
    ],
    redFlags: []
  },
  INV004: {
    caseId: "INV004",
    analysisCategory: "Website Analysis",
    data: [
      {
        field: "User Communication",
        value: ["Email", "Phone", "Physical address"],
        keyIcon: "MessagesSquare",
        keyIconColor: "blue",
        valueSentiment: "positive"
      },
      {
        field: "Contact Emails",
        value: ["eximkurti@gmail.com"],
        keyIcon: "Mail",
        keyIconColor: "orange",
        valueSentiment: "negative"
      },
      {
        field: "Contact Phones",
        value: ["8320466769"],
        keyIcon: "Phone",
        keyIconColor: "blue",
        valueSentiment: "positive"
      },
      {
        field: "Contact Addresses",
        value: [
          "111 Hyde Park CHS Upper, Govind Nagar Malad East, 400097 Mumbai MH, India"
        ],
        keyIcon: "MapPinned",
        keyIconColor: "blue",
        valueSentiment: "positive"
      },
      {
        field: "Social Media Links",
        value: [
          "Facebook: Not Available",
          "Instagram: Not Available",
          "YouTube: Not Available",
          "LinkedIn: Not Available",
          "X/Twitter: Not Available",
          "WhatsApp: Not Available",
          "Others: Not Available"
        ],
        keyIcon: "Share2",
        keyIconColor: "purple",
        valueSentiment: "negative"
      },
      {
        field: "Legal Name & Registrations",
        value: [
          "Registered Entity: Exim",
          "GST: Not Available",
          "CIN: Not Available",
          "Others: Not Available"
        ],
        keyIcon: "BadgeInfo",
        keyIconColor: "orange",
        valueSentiment: "negative"
      },
      {
        field: "Trademark & Copyright",
        value: "Not specified",
        keyIcon: "Copyright",
        keyIconColor: "gray",
        valueSentiment: "neutral"
      }
    ],
    redFlags: [
      {
        code: "WA016",
        redFlag: "Contact email uses non-business domain",
        severity: "Medium",
        reasoning: "Primary contact email is eximkurti@gmail.com instead of a domain email.",
        triggered: true
      },
      {
        code: "WA020",
        redFlag: "No social media links found",
        severity: "Medium",
        reasoning: "No branded social media links are provided anywhere on the site.",
        triggered: true
      },
      {
        code: "WA023",
        redFlag: "No legal name or registrations mentioned",
        severity: "Medium",
        reasoning: "No GST/CIN or other registration numbers are displayed.",
        triggered: true
      }
    ]
  },
  INV003: {
    caseId: "INV003",
    analysisCategory: "Website Analysis",
    data: [
      {
        field: "User Communication",
        value: ["Contact form (Name, Email, Phone, Comment)", "Email", "Phone"],
        keyIcon: "MessagesSquare",
        keyIconColor: "blue",
        valueSentiment: "positive"
      },
      {
        field: "Contact Emails",
        value: ["sajjeevaninteriorsopcvtltd@gmail.com"],
        keyIcon: "Mail",
        keyIconColor: "orange",
        valueSentiment: "negative"
      },
      {
        field: "Contact Phones",
        value: ["8829871975"],
        keyIcon: "Phone",
        keyIconColor: "blue",
        valueSentiment: "positive"
      },
      {
        field: "Contact Addresses",
        value: [
          "802-A, 8th floor, Saberwal house, 55B, mirza Galib street, kolkata, 700016 Kolkata WB, India"
        ],
        keyIcon: "MapPinned",
        keyIconColor: "blue",
        valueSentiment: "positive"
      },
      {
        field: "Social Media Links",
        value: [
          "Facebook: Not Available",
          "Instagram: Extraction failed (HTTP 429)",
          "YouTube: https://www.youtube.com/shopify",
          "LinkedIn: Not Available",
          "X/Twitter: https://x.com/shopify",
          "WhatsApp: Not Available",
          "TikTok: https://www.tiktok.com/@shopify",
          "Threads: https://www.threads.com/@shopify"
        ],
        keyIcon: "Share2",
        keyIconColor: "purple",
        valueSentiment: "negative"
      },
      {
        field: "Legal Name & Registrations",
        value: [
          "Registered Entity: SAJJEEVAN INTERIORS PRIVATE LIMITED",
          "GST: Not Available",
          "CIN: U74102WB2025OPC280138",
          "Others: Trade number: 007591034265"
        ],
        keyIcon: "BadgeInfo",
        keyIconColor: "blue",
        valueSentiment: "info"
      },
      {
        field: "Trademark & Copyright",
        value: "© 2025 SAJJEEVAN INTERIORS PRIVATE LIMITED",
        keyIcon: "Copyright",
        keyIconColor: "blue",
        valueSentiment: "positive"
      }
    ],
    redFlags: [
      {
        code: "WA016",
        redFlag: "Contact email uses non-business domain",
        severity: "Medium",
        reasoning:
          "Contact email uses non-business domain (Gmail) instead of a domain-based email.",
        triggered: true
      },
      {
        code: "WA021",
        redFlag: "Social media profile name does not match brand name or registered name",
        severity: "Medium",
        reasoning:
          "Social media profile names (YouTube, TikTok, Twitter/X, Threads) do not match the brand name or registered name; they are for 'shopify'.",
        triggered: true
      }
    ]
  },
  INV005: {
    caseId: "INV005",
    analysisCategory: "Website Analysis",
    data: [
      {
        field: "User Communication",
        value: ["Email", "Phone"],
        keyIcon: "MessagesSquare",
        keyIconColor: "blue",
        valueSentiment: "positive"
      },
      {
        field: "Contact Emails",
        value: ["info@edupayman.in"],
        keyIcon: "Mail",
        keyIconColor: "blue",
        valueSentiment: "positive"
      },
      {
        field: "Contact Phones",
        value: ["+91 9100748033"],
        keyIcon: "Phone",
        keyIconColor: "blue",
        valueSentiment: "positive"
      },
      {
        field: "Contact Addresses",
        value: ["SRI RAMACHANDRA NIVAS, 4-9-12 STREET NO 1, H M T NAGAR, NACHARAM, PIN CODE - 500076, CIRCLE 1, HYDERABAD"],
        keyIcon: "MapPin",
        keyIconColor: "blue",
        valueSentiment: "positive"
      },
      {
        field: "Social Media Links",
        value: ["Instagram (Generic)", "YouTube (Generic)", "LinkedIn (Generic)", "Telegram (Generic)"],
        keyIcon: "Share2",
        keyIconColor: "orange",
        valueSentiment: "negative"
      },
      {
        field: "Legal Name & Registrations",
        value: ["Not explicitly stated", "GST: Not Available", "CIN: Not Available"],
        keyIcon: "AlertTriangle",
        keyIconColor: "red",
        valueSentiment: "negative"
      },
      {
        field: "Trademark & Copyright",
        value: ["Not specified"],
        keyIcon: "Copyright",
        keyIconColor: "gray",
        valueSentiment: "neutral"
      }
    ],
    redFlags: [
      {
        code: "WA023",
        redFlag: "No legal name or registrations mentioned",
        severity: "Medium",
        reasoning: "Registered business name not explicitly stated; no legal name or registrations mentioned.",
        triggered: true
      },
      {
        code: "WA019",
        redFlag: "Non-functional or generic social media links found",
        severity: "Medium",
        reasoning: "Social media links provided are generic (homepage URLs, not specific to the brand).",
        triggered: true
      }
    ]
  }
};

export const invPolicyData: Record<string, CasePolicyData> = {
  INV001: {
    caseId: "INV001",
    analysisCategory: "Website Analysis",
    data: [
      {
        Policy: {
          value: "Return/Refund Policy",
          keyIcon: "FileText",
          keyIconColor: "blue"
        },
        Relevance: {
          value: "Relevant",
          valueSentiment: "positive"
        },
        Status: {
          value: "Functional (embedded in Terms & Conditions)",
          valueSentiment: "positive"
        },
        Content: {
          value: "Present",
          valueSentiment: "positive"
        },
        Summary: {
          value: "No refunds for online/self-paced/live course purchases; all sales final due to digital nature.",
          valueSentiment: "info"
        }
      },
      {
        Policy: {
          value: "Privacy Policy",
          keyIcon: "ShieldCheck",
          keyIconColor: "green"
        },
        Relevance: {
          value: "Relevant",
          valueSentiment: "positive"
        },
        Status: {
          value: "Functional",
          valueSentiment: "positive"
        },
        Content: {
          value: "Present",
          valueSentiment: "positive"
        },
        Summary: {
          value: "Describes collection/use of personal info, cookies, third-party advertisers, children's privacy.",
          valueSentiment: "info"
        }
      },
      {
        Policy: {
          value: "Terms of Service/Terms & Conditions",
          keyIcon: "Scale",
          keyIconColor: "blue"
        },
        Relevance: {
          value: "Relevant",
          valueSentiment: "positive"
        },
        Status: {
          value: "Functional",
          valueSentiment: "positive"
        },
        Content: {
          value: "Present",
          valueSentiment: "positive"
        },
        Summary: {
          value: "User obligations, limitation of liability, IP, third-party links, dispute resolution, termination.",
          valueSentiment: "info"
        }
      },
      {
        Policy: {
          value: "Shipping Policy",
          keyIcon: "Navigation",
          keyIconColor: "orange"
        },
        Relevance: {
          value: "Not Applicable",
          valueSentiment: "neutral"
        },
        Status: {
          value: "Not Applicable (Non Affiliated Education LOB)",
          valueSentiment: "neutral"
        },
        Content: {
          value: "Not Applicable",
          valueSentiment: "neutral"
        }
      },
      {
        Policy: {
          value: "Cookie Policy",
          keyIcon: "Layers",
          keyIconColor: "gray"
        },
        Relevance: {
          value: "Not explicitly mentioned",
          valueSentiment: "neutral"
        }
      }
    ],
    redFlags: []
  },
  INV002: {
    caseId: "INV002",
    analysisCategory: "Website Analysis",
    data: [
      {
        Policy: {
          value: "Return/Refund Policy",
          keyIcon: "FileText",
          keyIconColor: "blue"
        },
        Relevance: {
          value: "Not Applicable",
          valueSentiment: "neutral"
        },
        Status: {
          value: "Not Applicable (Financial Services LOB)",
          valueSentiment: "neutral"
        },
        Content: {
          value: "Not Applicable",
          valueSentiment: "neutral"
        }
      },
      {
        Policy: {
          value: "Privacy Policy",
          keyIcon: "ShieldCheck",
          keyIconColor: "green"
        },
        Relevance: {
          value: "Relevant",
          valueSentiment: "positive"
        },
        Status: {
          value: "Functional",
          valueSentiment: "positive"
        },
        Content: {
          value: "Present",
          valueSentiment: "positive"
        },
        Summary: {
          value: "Describes collection/use of personal info, cookies, third-party advertisers, children's privacy.",
          valueSentiment: "info"
        }
      },
      {
        Policy: {
          value: "Terms of Service/Terms & Conditions",
          keyIcon: "Scale",
          keyIconColor: "blue"
        },
        Relevance: {
          value: "Relevant",
          valueSentiment: "positive"
        },
        Status: {
          value: "Functional",
          valueSentiment: "positive"
        },
        Content: {
          value: "Present",
          valueSentiment: "positive"
        },
        Summary: {
          value: "Outlines the terms, conditions, user responsibilities, limitations, and legal guidelines governing the use of the EbixCash website, services, prepaid instruments, and related platforms",
          valueSentiment: "info"
        }
      },
      {
        Policy: {
          value: "Shipping Policy",
          keyIcon: "Navigation",
          keyIconColor: "orange"
        },
        Relevance: {
          value: "Not Applicable",
          valueSentiment: "neutral"
        },
        Status: {
          value: "Not Applicable (Financial Services LOB)",
          valueSentiment: "neutral"
        },
        Content: {
          value: "Not Applicable",
          valueSentiment: "neutral"
        }
      },
      {
        Policy: {
          value: "Cookie Policy",
          keyIcon: "Layers",
          keyIconColor: "gray"
        },
        Relevance: {
          value: "Not Available",
          valueSentiment: "neutral"
        }
      }
    ],
    redFlags: []
  },
  INV004: {
    caseId: "INV004",
    analysisCategory: "Website Analysis",
    data: [
      {
        Policy: {
          value: "Return/Refund Policy",
          keyIcon: "FileText",
          keyIconColor: "blue"
        },
        Relevance: {
          value: "Relevant",
          valueSentiment: "positive"
        },
        Status: {
          value: "Functional",
          valueSentiment: "positive"
        },
        Content: {
          value: "Present",
          valueSentiment: "positive"
        },
        Summary: {
          value:
            "Describes refund eligibility, timelines, non-returnable items, and process steps.",
          valueSentiment: "info"
        }
      },
      {
        Policy: {
          value: "Privacy Policy",
          keyIcon: "ShieldCheck",
          keyIconColor: "green"
        },
        Relevance: {
          value: "Relevant",
          valueSentiment: "positive"
        },
        Status: {
          value: "Functional",
          valueSentiment: "positive"
        },
        Content: {
          value: "Present",
          valueSentiment: "positive"
        },
        Summary: {
          value:
            "Covers data collection, usage, sharing with partners, user rights, and retention.",
          valueSentiment: "info"
        }
      },
      {
        Policy: {
          value: "Terms of Service/Terms & Conditions",
          keyIcon: "Scale",
          keyIconColor: "blue"
        },
        Relevance: {
          value: "Relevant",
          valueSentiment: "positive"
        },
        Status: {
          value: "Functional",
          valueSentiment: "positive"
        },
        Content: {
          value: "Present",
          valueSentiment: "positive"
        },
        Summary: {
          value:
            "Defines user obligations, prohibited uses, IP ownership, liability, and dispute processes.",
          valueSentiment: "info"
        }
      },
      {
        Policy: {
          value: "Shipping Policy",
          keyIcon: "Navigation",
          keyIconColor: "blue"
        },
        Relevance: {
          value: "Relevant",
          valueSentiment: "positive"
        },
        Status: {
          value: "Functional",
          valueSentiment: "positive"
        },
        Content: {
          value: "Present",
          valueSentiment: "positive"
        },
        Summary: {
          value:
            "Details dispatch timelines, delivery partners, and tracking for apparel orders.",
          valueSentiment: "info"
        }
      },
      {
        Policy: {
          value: "Cookie Policy",
          keyIcon: "Layers",
          keyIconColor: "gray"
        },
        Relevance: {
          value: "Not mentioned",
          valueSentiment: "neutral"
        }
      }
    ],
    redFlags: []
  },
  INV003: {
    caseId: "INV003",
    analysisCategory: "Website Analysis",
    data: [
      {
        Policy: {
          value: "Return/Refund Policy",
          keyIcon: "FileText",
          keyIconColor: "blue"
        },
        Relevance: {
          value: "Relevant",
          valueSentiment: "positive"
        },
        Status: {
          value: "Functional",
          valueSentiment: "positive"
        },
        Content: {
          value: "Present",
          valueSentiment: "positive"
        },
        Summary: {
          value: "Details eligibility, process, exceptions, and timelines for returns/refunds.",
          valueSentiment: "info"
        }
      },
      {
        Policy: {
          value: "Privacy Policy",
          keyIcon: "ShieldCheck",
          keyIconColor: "green"
        },
        Relevance: {
          value: "Relevant",
          valueSentiment: "positive"
        },
        Status: {
          value: "Functional",
          valueSentiment: "positive"
        },
        Content: {
          value: "Present",
          valueSentiment: "positive"
        },
        Summary: {
          value: "Explains data collection, use, user rights, and third-party sharing.",
          valueSentiment: "info"
        }
      },
      {
        Policy: {
          value: "Terms of Service/Terms & Conditions",
          keyIcon: "Scale",
          keyIconColor: "blue"
        },
        Relevance: {
          value: "Relevant",
          valueSentiment: "positive"
        },
        Status: {
          value: "Functional",
          valueSentiment: "positive"
        },
        Content: {
          value: "Present",
          valueSentiment: "positive"
        },
        Summary: {
          value: "Governs use of website/services, user obligations, IP rights, disclaimers.",
          valueSentiment: "info"
        }
      },
      {
        Policy: {
          value: "Shipping Policy",
          keyIcon: "Navigation",
          keyIconColor: "blue"
        },
        Relevance: {
          value: "Relevant",
          valueSentiment: "positive"
        },
        Status: {
          value: "Functional",
          valueSentiment: "positive"
        },
        Content: {
          value: "Present",
          valueSentiment: "positive"
        },
        Summary: {
          value: "Shipping within India, timelines, charges, tracking, claims for lost/damaged items.",
          valueSentiment: "info"
        }
      },
      {
        Policy: {
          value: "Cookie Policy",
          keyIcon: "Layers",
          keyIconColor: "gray"
        },
        Relevance: {
          value: "Not mentioned",
          valueSentiment: "neutral"
        }
      }
    ],
    redFlags: []
  },
  INV005: {
    caseId: "INV005",
    analysisCategory: "Website Analysis",
    data: [
      {
        Policy: {
          value: "Return/Refund Policy",
          keyIcon: "FileText",
          keyIconColor: "blue"
        },
        Relevance: {
          value: "Relevant",
          valueSentiment: "positive"
        },
        Status: {
          value: "Functional (embedded in Terms & Conditions)",
          valueSentiment: "positive"
        },
        Content: {
          value: "Present",
          valueSentiment: "positive"
        },
        Summary: {
          value: "No refunds for online/self-paced/live course purchases; all sales final due to digital nature.",
          valueSentiment: "info"
        }
      },
      {
        Policy: {
          value: "Privacy Policy",
          keyIcon: "ShieldCheck",
          keyIconColor: "blue"
        },
        Relevance: {
          value: "Relevant",
          valueSentiment: "positive"
        },
        Status: {
          value: "Functional (embedded in Terms & Conditions)",
          valueSentiment: "positive"
        },
        Content: {
          value: "Present",
          valueSentiment: "positive"
        },
        Summary: {
          value: "Describes collection/use of personal info, cookies, third-party advertisers, children's privacy.",
          valueSentiment: "info"
        }
      },
      {
        Policy: {
          value: "Terms of Service/Terms & Conditions",
          keyIcon: "FileText",
          keyIconColor: "blue"
        },
        Relevance: {
          value: "Relevant",
          valueSentiment: "positive"
        },
        Status: {
          value: "Functional",
          valueSentiment: "positive"
        },
        Content: {
          value: "Present",
          valueSentiment: "positive"
        },
        Summary: {
          value: "User obligations, limitation of liability, IP, third-party links, dispute resolution, termination.",
          valueSentiment: "info"
        }
      },
      {
        Policy: {
          value: "Shipping Policy",
          keyIcon: "FileText",
          keyIconColor: "gray"
        },
        Relevance: {
          value: "Not Applicable",
          valueSentiment: "neutral"
        },
        Status: {
          value: "Not Applicable",
          valueSentiment: "neutral"
        },
        Content: {
          value: "Not Applicable",
          valueSentiment: "neutral"
        },
        Summary: {
          value: "Non Affiliated Education, not e-commerce",
          valueSentiment: "neutral"
        }
      },
      {
        Policy: {
          value: "Cookie Policy",
          keyIcon: "FileText",
          keyIconColor: "gray"
        },
        Relevance: {
          value: "Relevant",
          valueSentiment: "positive"
        },
        Status: {
          value: "Not explicitly mentioned",
          valueSentiment: "negative"
        },
        Content: {
          value: "Not Present",
          valueSentiment: "negative"
        },
        Summary: {
          value: "Cookie policy not explicitly mentioned",
          valueSentiment: "negative"
        }
      }
    ],
    redFlags: []
  }
};

export const invContentAnalysisData: Record<
  string,
  CaseContentAnalysisData
> = {
  INV001: {
    caseId: "INV001",
    analysisCategory: "Website Analysis",
    data: [
      {
        field: "Logo Match",
        value: "No match to known brands",
        keyIcon: "BadgeAlert",
        keyIconColor: "orange",
        valueSentiment: "positive"
      },
      {
        field: "Brand Name Match",
        value: "No match to known brands",
        keyIcon: "BadgeInfo",
        keyIconColor: "orange",
        valueSentiment: "positive"
      },
      {
        field: "Headers/Titles",
        value: "No match to known brands",
        keyIcon: "Heading",
        keyIconColor: "blue",
        valueSentiment: "positive"
      },
      {
        field: "Tab Name",
        value: "No match to known brands",
        keyIcon: "PanelLeftOpen",
        keyIconColor: "blue",
        valueSentiment: "positive"
      },
      {
        field: "Known Brand Impersonation",
        value: "No",
        keyIcon: "UserX",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Banned & Restricted Words",
        value: "Absent",
        keyIcon: "Ban",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Placeholder Content",
        value: "Absent",
        keyIcon: "FileText",
        keyIconColor: "blue",
        valueSentiment: "positive"
      },
      {
        field: "Scam Words/Phrases",
        value: "Absent",
        keyIcon: "AlertTriangle",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Grammatical/Spelling Errors",
        value: "Absent",
        keyIcon: "SpellCheck",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Default Language",
        value: "English",
        keyIcon: "Languages",
        keyIconColor: "blue",
        valueSentiment: "info"
      },
      {
        field: "Other Languages",
        value: "None",
        keyIcon: "Languages",
        keyIconColor: "gray",
        valueSentiment: "neutral"
      }
    ],
    redFlags: []
  },
  INV002: {
    caseId: "INV002",
    analysisCategory: "Website Analysis",
    data: [
      {
        field: "Logo Match",
        value: "Matches legitimate business",
        keyIcon: "BadgeAlert",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Brand Name Match",
        value: "Matches legitimate business",
        keyIcon: "BadgeInfo",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Headers/Titles",
        value: "No impersonation detected",
        keyIcon: "Heading",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Tab Name",
        value: "No impersonation detected",
        keyIcon: "PanelLeftOpen",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Known Brand Impersonation",
        value: "No",
        keyIcon: "UserX",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Banned & Restricted Words",
        value: "Absent",
        keyIcon: "Ban",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Placeholder Content",
        value: "Absent",
        keyIcon: "FileText",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Scam Words/Phrases",
        value: "Absent",
        keyIcon: "AlertTriangle",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Grammatical/Spelling Errors",
        value: "Absent",
        keyIcon: "SpellCheck",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Default Language",
        value: "English",
        keyIcon: "Languages",
        keyIconColor: "blue",
        valueSentiment: "info"
      },
      {
        field: "Other Languages",
        value: "None",
        keyIcon: "Languages",
        keyIconColor: "gray",
        valueSentiment: "neutral"
      }
    ],
    redFlags: []
  },
  INV004: {
    caseId: "INV004",
    analysisCategory: "Website Analysis",
    data: [
      {
        field: "Logo Match",
        value: "No match to known brands",
        keyIcon: "BadgeAlert",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Brand Name Match",
        value: "No match to known brands",
        keyIcon: "BadgeInfo",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Headers/Titles",
        value: "No match to known brands",
        keyIcon: "Heading",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Tab Name",
        value: "No match to known brands",
        keyIcon: "PanelLeftOpen",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Known Brand Impersonation",
        value: "No",
        keyIcon: "UserX",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Banned & Restricted Words",
        value: "Absent",
        keyIcon: "Ban",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Placeholder Content",
        value: "Absent",
        keyIcon: "FileText",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Scam Words/Phrases",
        value: "Absent",
        keyIcon: "AlertTriangle",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Grammatical/Spelling Errors",
        value: "Absent",
        keyIcon: "SpellCheck",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Default Language",
        value: "English",
        keyIcon: "Languages",
        keyIconColor: "blue",
        valueSentiment: "info"
      },
      {
        field: "Other Languages",
        value: "None",
        keyIcon: "Languages",
        keyIconColor: "gray",
        valueSentiment: "neutral"
      }
    ],
    redFlags: []
  },
  INV003: {
    caseId: "INV003",
    analysisCategory: "Website Analysis",
    data: [
      {
        field: "Logo Match",
        value: "No evidence of impersonation",
        keyIcon: "BadgeAlert",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Brand Name Match",
        value: "No evidence of impersonation",
        keyIcon: "BadgeInfo",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Headers/Titles",
        value: "No evidence of impersonation",
        keyIcon: "Heading",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Tab Name",
        value: "No evidence of impersonation",
        keyIcon: "PanelLeftOpen",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Known Brand Impersonation",
        value: "No",
        keyIcon: "UserX",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Banned & Restricted Words",
        value: "Absent",
        keyIcon: "Ban",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Placeholder Content",
        value: "Absent",
        keyIcon: "FileText",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Scam Words/Phrases",
        value: "Absent",
        keyIcon: "AlertTriangle",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Grammatical/Spelling Errors",
        value: "Absent",
        keyIcon: "SpellCheck",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Default Language",
        value: "English",
        keyIcon: "Languages",
        keyIconColor: "blue",
        valueSentiment: "info"
      },
      {
        field: "Other Languages",
        value: "None",
        keyIcon: "Languages",
        keyIconColor: "gray",
        valueSentiment: "neutral"
      }
    ],
    redFlags: []
  },
  INV005: {
    caseId: "INV005",
    analysisCategory: "Website Analysis",
    data: [
      {
        field: "Logo Match",
        value: "No match to known brands",
        keyIcon: "FileText",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Brand Name Match",
        value: "No match to known brands",
        keyIcon: "BadgeCheck",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Headers/Titles",
        value: "No evidence of impersonation",
        keyIcon: "Heading",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Tab Name",
        value: "No evidence of impersonation",
        keyIcon: "PanelLeftOpen",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Known Brand Impersonation",
        value: "No",
        keyIcon: "UserX",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Banned & Restricted Words",
        value: "Absent",
        keyIcon: "Ban",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Placeholder Content",
        value: "Absent",
        keyIcon: "FileText",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Scam Words/Phrases",
        value: "Absent",
        keyIcon: "AlertTriangle",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Grammatical/Spelling Errors",
        value: "Absent",
        keyIcon: "CheckCircle2",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "Default Language",
        value: "English",
        keyIcon: "Globe",
        keyIconColor: "blue",
        valueSentiment: "info"
      }
    ],
    redFlags: []
  }
};

export const invProductsPricingData: Record<
  string,
  CaseProductsPricingData
> = {
  INV001: {
    caseId: "INV001",
    analysisCategory: "Website Analysis",
    data: [
      {
        field: "List of Categories",
        value: ["None (Informational site, no products/services listed)"],
        keyIcon: "Layers",
        keyIconColor: "gray",
        valueSentiment: "neutral"
      },
      {
        field: "Top 10 Products/Services & Pricing",
        value: ["None"],
        keyIcon: "ListOrdered",
        keyIconColor: "gray",
        valueSentiment: "neutral"
      },
      {
        field: "Reasonable Price Range Assessment",
        value: "Not Applicable",
        keyIcon: "Scale",
        keyIconColor: "gray",
        valueSentiment: "neutral"
      },
      {
        field: "All Currencies Used/Available",
        value: "Not Applicable",
        keyIcon: "Banknote",
        keyIconColor: "gray",
        valueSentiment: "neutral"
      }
    ],
    redFlags: []
  },
  INV002: {
    caseId: "INV002",
    analysisCategory: "Website Analysis",
    data: [
      {
        field: "List of Categories",
        value: ["Flights", "Hotels", "Holidays", "Cabs", "Buses", "Forex", "Money Transfer", "Bill Payments", "Prepaid & Gift Cards", "Insurance", "Ask a Doctor", "Fastag"],
        keyIcon: "Layers",
        keyIconColor: "blue",
        valueSentiment: "info"
      },
      {
        field: "Top 10 Products/Services & Pricing",
        value: ["No individual product or service listings, prices, SKUs, or availability information displayed"],
        keyIcon: "ListOrdered",
        keyIconColor: "orange",
        valueSentiment: "negative"
      },
      {
        field: "Reasonable Price Range Assessment",
        value: "Not possible (no pricing data)",
        keyIcon: "Scale",
        keyIconColor: "orange",
        valueSentiment: "negative"
      },
      {
        field: "All Currencies Used/Available",
        value: "INR (₹) only",
        keyIcon: "Banknote",
        keyIconColor: "blue",
        valueSentiment: "positive"
      }
    ],
    redFlags: [
      {
        code: "WA038",
        redFlag: "No products listed",
        severity: "Medium",
        reasoning: "All consumer-facing categories (Flights, Hotels, Holidays, etc.), only coupon codes, lacks any product/service listings, prices, SKUs, or availability information.",
        triggered: true
      }
    ]
  },
  INV004: {
    caseId: "INV004",
    analysisCategory: "Website Analysis",
    data: [
      {
        field: "List of Categories",
        value: ["Catalog (Kurtas/Apparel)"],
        keyIcon: "Layers",
        keyIconColor: "blue",
        valueSentiment: "info"
      },
      {
        field: "Top 10 Products/Services & Pricing",
        value: [
          "All listed items are kurtas priced at Rs. 239.00 (sale) vs Rs. 899.00–1,299.00 (regular)"
        ],
        keyIcon: "ListOrdered",
        keyIconColor: "blue",
        valueSentiment: "info"
      },
      {
        field: "Price Range",
        value: [
          "Minimum: Rs. 239.00",
          "Maximum: Rs. 1,299.00"
        ],
        keyIcon: "Scale",
        keyIconColor: "blue",
        valueSentiment: "info"
      },
      {
        field: "Price Assessment",
        value: "Reasonable (deep discounts but still plausible for apparel)",
        keyIcon: "Scale",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "All Currencies Used/Available",
        value: "INR",
        keyIcon: "Banknote",
        keyIconColor: "blue",
        valueSentiment: "positive"
      }
    ],
    redFlags: []
  },
  INV003: {
    caseId: "INV003",
    analysisCategory: "Website Analysis",
    data: [
      {
        field: "List of Categories",
        value: ["Catalog (no explicit subcategories)"],
        keyIcon: "Layers",
        keyIconColor: "blue",
        valueSentiment: "info"
      },
      {
        field: "Top 10 Products/Services & Pricing",
        value: [
          "Classic Foyer Design with Storage Bench Shoe Storage and Mirror — Rs. 15,000.00",
          "Classic TV Unit Design with Wooden Texture, Glass Cabinets and Drawers — Rs. 25,999.00",
          "Contemporary Master Bedroom Design with Teal Velvet Headboard King Bed and Floating Study — Rs. 42,000.00",
          "Contemporary Multifunctional Bedroom Design With Wall Paint — Rs. 45,000.00 (Sold out)",
          "Contemporary TV Unit Design with Textured Backdrop and Wooden Arch Detailing — Rs. 36,999.00",
          "Cream Toned Modern TV Unit Design with Geometric Wall Paneling and Floating Storage — Rs. 17,500.00",
          "Double Layer Contemporary False Ceiling Design with Wooden Finish and Gypsum Detail — Rs. 25,680.00",
          "Grey and White U-Shaped Modern Kitchen Design Featuring Marble Countertop and Cabinets — Rs. 49,999.00",
          "Indian Traditional Guest Bedroom Design with Curved Upholstered Bed Frame and 2-Door Wardrobe — Rs. 48,900.00",
          "Modern Double Layer False Ceiling Design in Gypsum and Wood with Paint and Wood Finish — Rs. 29,999.00"
        ],
        keyIcon: "ListOrdered",
        keyIconColor: "blue",
        valueSentiment: "info"
      },
      {
        field: "Price Range",
        value: [
          "Minimum: Rs. 15,000.00",
          "Maximum: Rs. 49,999.00",
          "Average: Within reasonable range"
        ],
        keyIcon: "Scale",
        keyIconColor: "blue",
        valueSentiment: "info"
      },
      {
        field: "Price Assessment",
        value: "Reasonable",
        keyIcon: "Scale",
        keyIconColor: "green",
        valueSentiment: "positive"
      },
      {
        field: "All Currencies Used/Available",
        value: "INR (Rs.)",
        keyIcon: "Banknote",
        keyIconColor: "blue",
        valueSentiment: "positive"
      }
    ],
    redFlags: []
  },
  INV005: {
    caseId: "INV005",
    analysisCategory: "Website Analysis",
    data: [
      {
        field: "List of Categories",
        value: ["None (Informational site, no products/services listed)"],
        keyIcon: "Layers",
        keyIconColor: "gray",
        valueSentiment: "neutral"
      },
      {
        field: "Top 10 Products/Services & Pricing",
        value: ["None"],
        keyIcon: "ListOrdered",
        keyIconColor: "gray",
        valueSentiment: "neutral"
      },
      {
        field: "Reasonable Price Range Assessment",
        value: "Not Applicable",
        keyIcon: "Scale",
        keyIconColor: "gray",
        valueSentiment: "neutral"
      },
      {
        field: "All Currencies Used/Available",
        value: "Not Applicable",
        keyIcon: "Banknote",
        keyIconColor: "gray",
        valueSentiment: "neutral"
      }
    ],
    redFlags: []
  }
};

