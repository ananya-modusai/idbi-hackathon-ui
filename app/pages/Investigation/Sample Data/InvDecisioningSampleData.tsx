import { IconName } from "@/components/custom/CustomIconScheme";
import { ColorScheme } from "@/components/custom/CustomColorScheme";

export type FlagSeverity =
  | "Critical Risk"
  | "High Risk"
  | "Medium Risk"
  | "Good Override"
  | "Low Risk";

export interface FlagInfo {
  name: string;
  severity: FlagSeverity;
  icon: IconName;
  themeColor: ColorScheme;
}

export type FlagCode =
  | "RF001"
  | "RF002"
  | "RF003"
  | "RF004"
  | "RF005"
  | "RF006"
  | "RF007"
  | "RF008"
  | "RF009"
  | "RF010"
  | "RF011"
  | "RF012"
  | "RF013"
  | "RF014"
  | "RF015"
  | "RF016"
  | "RF017"
  | "RF018"
  | "RF019"
  | "RF020"
  | "GF001"
  | "GF002"
  | "GF003"
  | "GF004"
  | "MR001";

export const FlagCodeMapping: Record<FlagCode, FlagInfo> = {
  MR001: {
    name: "Manual Review",
    severity: "Low Risk",
    icon: "FileSearch",
    themeColor: "blue",
  },
  RF001: {
    name: "Impersonation Risk",
    severity: "High Risk",
    icon: "UserX",
    themeColor: "red",
  },
  RF002: {
    name: "Banned & Restricted Category Risk",
    severity: "High Risk",
    icon: "Ban",
    themeColor: "red",
  },
  RF003: {
    name: "Legal Name Inconsistency",
    severity: "High Risk",
    icon: "FileText",
    themeColor: "red",
  },
  RF004: {
    name: "Business Profile Inconsistency",
    severity: "High Risk",
    icon: "FileText",
    themeColor: "red",
  },
  RF005: {
    name: "Website Threat Intelligence",
    severity: "High Risk",
    icon: "Globe",
    themeColor: "red",
  },
  RF006: {
    name: "Website not working",
    severity: "High Risk",
    icon: "Globe",
    themeColor: "red",
  },
  RF007: {
    name: "KMP Mismatch",
    severity: "High Risk",
    icon: "Users",
    themeColor: "red",
  },
  RF008: {
    name: "Legal ID Mismatch",
    severity: "High Risk",
    icon: "ListChecks",
    themeColor: "red",
  },
  RF009: {
    name: "Reverse image",
    severity: "High Risk",
    icon: "Image",
    themeColor: "red",
  },
  RF010: {
    name: "Discrepancy within website",
    severity: "High Risk",
    icon: "FileSearch",
    themeColor: "red",
  },
  RF011: {
    name: "Address Risk",
    severity: "High Risk",
    icon: "MapPin",
    themeColor: "red",
  },
  RF012: {
    name: "Potential Shell website",
    severity: "Medium Risk",
    icon: "Globe",
    themeColor: "orange",
  },
  RF013: {
    name: "Scam merchant",
    severity: "High Risk",
    icon: "AlertTriangle",
    themeColor: "red",
  },
  RF014: {
    name: "Individual Risk",
    severity: "Medium Risk",
    icon: "FileText",
    themeColor: "orange",
  },
  RF015: {
    name: "Merchant License Risk",
    severity: "Low Risk",
    icon: "FileText",
    themeColor: "blue",
  },
  RF016: {
    name: "GSTN Risk",
    severity: "Medium Risk",
    icon: "FileText",
    themeColor: "orange",
  },
  RF017: {
    name: "Flagged Merchant",
    severity: "Critical Risk",
    icon: "AlertTriangle",
    themeColor: "red",
  },
  RF018: {
    name: "Social Analysis Risk",
    severity: "High Risk",
    icon: "Users",
    themeColor: "red",
  },
  RF019: {
    name: "Product image indicates risk",
    severity: "High Risk",
    icon: "Image",
    themeColor: "red",
  },
  RF020: {
    name: "Website Not Loading",
    severity: "High Risk",
    icon: "Globe",
    themeColor: "red",
  },
  GF001: {
    name: "Good Social Media Presence",
    severity: "Good Override",
    icon: "Users",
    themeColor: "green",
  },
  GF002: {
    name: "Vintage Merchant",
    severity: "Good Override",
    icon: "CalendarClock",
    themeColor: "green",
  },
  GF003: {
    name: "Corporate Organization Type",
    severity: "Good Override",
    icon: "BadgeCheck",
    themeColor: "green",
  },
  GF004: {
    name: "Dispersed customer base",
    severity: "Good Override",
    icon: "MapPin",
    themeColor: "green",
  },
};

// Helper function to get flag info by code
export function getFlagInfo(code: string): FlagInfo | undefined {
  return FlagCodeMapping[code as FlagCode];
}

// Helper function to get flag name by code
export function getFlagName(code: string): string | undefined {
  return FlagCodeMapping[code as FlagCode]?.name;
}

// Helper function to get flag severity by code
export function getFlagSeverity(code: string): FlagSeverity | undefined {
  return FlagCodeMapping[code as FlagCode]?.severity;
}

// Flag data specific to investigation cases
export interface FlagSubruleData {
  subrule: string;
  reasoning: string;
  triggered: boolean;
}

export interface CaseFlagData {
  code: string;
  subrules: FlagSubruleData[];
  overallReasoning: string;
  overallTriggered: boolean;
}

export const flagsData: Record<string, CaseFlagData[]> = {
  INV001: [
    {
      code: "RF006",
      subrules: [
        {
          subrule: "impersonation_risk",
          reasoning:
            "The registered name (SHESH KUMAR), brand name (INSTAFAB ONLINE STORE), logo image (stylized 'Instafab Plus' in yellow and black), and website URL/title/headers do not significantly resemble any popular brand, especially in the same industry. The impersonation check explicitly states there is no evidence of mimicry or imitation of well-known brands such as Adidas, Puma, Meta, Google, or Flipkart. The logo is unique and does not match any well-known business.",
          triggered: false,
        },
      ],
      overallReasoning:
        "There is no evidence from the website content, branding, or logo that suggests impersonation of a popular or legitimate brand. All elements appear unique to 'Instafab Plus' and do not resemble any well-known brands in the same industry.",
      overallTriggered: false,
    },
    {
      code: "RF007",
      subrules: [
        {
          subrule: "home_page_redirection",
          reasoning:
            "The initial URL (https://www.instafabplus.com/) and the final URL after all redirects (https://www.instafabplus.com/) are the same. There is no redirection to another URL, and the domain remains consistent with the one specified by the user (instafabplus.com).",
          triggered: false,
        },
      ],
      overallReasoning:
        "There is no evidence of homepage redirection to a different domain. The homepage loads directly at the specified domain without any redirect to another domain.",
      overallTriggered: false,
    },
    {
      code: "RF009",
      subrules: [
        {
          subrule: "website_not_loading",
          reasoning:
            "The navigation flow report confirms that the website loads successfully, with the initial and final URLs matching and no error messages or warnings displayed. All main content is visible.",
          triggered: false,
        },
        {
          subrule: "products_without_description",
          reasoning:
            "Product listings for all categories (Bestselling, Fresh Drops, Varun 2.0) do not have product descriptions. The audit explicitly states 'Description: Not present' for each product.",
          triggered: true,
        },
        {
          subrule: "no_product_listing",
          reasoning:
            "There are multiple product listings under each main category (Bestselling, Fresh Drops, Varun 2.0), with at least 10 products detailed per section. This is appropriate for the LOB (Men's and Women's Clothing Stores).",
          triggered: false,
        },
        {
          subrule: "product_without_images",
          reasoning:
            "Image analysis for each category confirms that all products have unique images and there are no missing or repeated images. No product is listed without an image.",
          triggered: false,
        },
        {
          subrule: "found_placeholder_text",
          reasoning:
            "The content analysis report states there is no placeholder content such as 'Lorem Ipsum' or template filler text. All visible content is contextually appropriate.",
          triggered: false,
        },
        {
          subrule: "policy_not_found",
          reasoning:
            "Multiple policy pages are found and listed: Shipping Policy, Cancellation Policy, Return & Exchange Policy, and Terms of Service. Even though some summaries are missing, the policies themselves are present.",
          triggered: false,
        },
        {
          subrule: "identical_pricing",
          reasoning:
            "Product prices vary across listings. For example, shirts range from Rs. 1,099 to Rs. 1,499, jeans are Rs. 1,349, and t-shirts are Rs. 999. The reasoning includes explicit price differences for each product.",
          triggered: false,
        },
        {
          subrule: "tgbt",
          reasoning:
            "Pricing for all products is within the expected range for plus-size men's and women's clothing in India. No product is priced significantly below market value, and the audit confirms prices are not 'too good to be true.'",
          triggered: false,
        },
      ],
      overallReasoning:
        "The only subrule triggered is 'products_without_description' because all product listings lack descriptions, as explicitly stated in the product analysis. All other subrules are not triggered: the website loads, products are listed with images, there is no placeholder text, policies are present, prices are not identical, and pricing is reasonable for the LOB.",
      overallTriggered: true,
    },
    {
      code: "RF010",
      subrules: [
        {
          subrule: "objectionable_content",
          reasoning:
            "The website audit report explicitly states: 'The homepage does not feature any products or messaging related to objectionable categories referenced from https://payu.in/BannedRestrictedCategorylist. The focus is on plus size fashion apparel for men and women.' There are no keywords or content matching the 'Objectionable & Illegal' list found in the extracted website content.",
          triggered: false,
        },
      ],
      overallReasoning:
        "There is no evidence of objectionable or illegal content on the website. The audit confirms the absence of such material, and all visible content is related to plus size fashion apparel, which is not on the banned or restricted list.",
      overallTriggered: false,
    },
    {
      code: "RF011",
      subrules: [
        {
          subrule: "scam_list",
          reasoning:
            "None of the provided fields (Registration Name: SHESH KUMAR, Business Name: INSTAFAB ONLINE STORE, Website Domain: instafabplus.com, Website Content, Merchant Name: INSTAFAB ONLINE STORE) match the known scam patterns ['Eira Club mentioned', 'Company name ending in “bhai”']. There is no mention of 'Eira Club' or any company name ending in 'bhai' in any of the provided data.",
          triggered: false,
        },
      ],
      overallReasoning:
        "The only subrule under RF011 is not triggered as there is no evidence of the website or any of its associated names matching the known scam patterns specified.",
      overallTriggered: false,
    },
    {
      code: "RF001",
      subrules: [
        {
          subrule: "thin_file_merchant",
          reasoning:
            "This subrule is not triggered because, although the merchant has individual ownership and is a new merchant (age of customer is 2), there is clear social media presence (active Facebook, Pinterest, YouTube, and app store links), the domain is not new (25 months old), and the website is working with valid SSL. Therefore, the overall thin file merchant profile is not established.",
          triggered: false,
        },
        {
          subrule: "high_value_cc_txn",
          reasoning:
            "This subrule is not triggered because there are no credit card transactions greater than 10k value.",
          triggered: false,
        },
      ],
      overallReasoning:
        "RF001 is not triggered because neither of the required subrules are triggered: the merchant does not have a thin file profile due to established social media presence, an older domain, and a working website, and there are no high-value credit card transactions.",
      overallTriggered: false,
    },
    {
      code: "RF002",
      subrules: [
        {
          subrule: "thin_file_merchant",
          reasoning:
            "This subrule is NOT triggered because, although the merchant has individual ownership and is a new merchant, the other criteria for a thin file (such as lack of social media presence, new domain, or non-working website) are NOT met. The merchant has active social media, a domain older than 6 months, and a working website. Therefore, the thin file profile is not established.",
          triggered: false,
        },
        {
          subrule: "cc_txn_concentration",
          reasoning:
            "This subrule is NOT triggered because there is no evidence of a single credit card being used for more than 60% of the total successful transactions. The reasoning explicitly states that no single card transaction has high concentration.",
          triggered: false,
        },
      ],
      overallReasoning:
        "RF002 is NOT triggered because both required subrules are not met: the merchant does not have a thin file profile (as most thin file indicators are not triggered), and there is no high concentration of transactions on a single credit card. Both conditions must be true for the red flag to trigger, but neither is satisfied.",
      overallTriggered: false,
    },
    {
      code: "RF003",
      subrules: [
        {
          subrule: "thin_file_merchant",
          reasoning:
            "The 'thin_file_merchant' subrule is not triggered because, although the merchant is individually owned and is a new merchant (age 2), there is clear social media presence (active Facebook, Pinterest, YouTube, and app store links), the domain is not new (25 months old), and the website is working with valid SSL. The presence of social media and an established domain age outweigh the individual ownership and new merchant status, so the overall 'thin_file_merchant' is not triggered.",
          triggered: false,
        },
        {
          subrule: "flat_value_pattern",
          reasoning:
            "The 'flat_value_pattern' subrule is triggered because there are recurring flat-value transactions (amount 129) with high counts (102 in the past 1 day, 115 in the past 7 days and lifetime), indicating a suspicious pattern of repeated identical transaction amounts within short timeframes.",
          triggered: true,
        },
        {
          subrule: "txn_unaligned",
          reasoning:
            "The 'txn_unaligned' subrule is not triggered because all transaction amounts are plausible for a clothing store and the transaction descriptions are generic or related to payment processing, with nothing misaligned with the merchant's line of business.",
          triggered: false,
        },
      ],
      overallReasoning:
        "RF003 is not triggered because the primary condition for this red flag is that the merchant must have a thin file profile (thin_file_merchant = yes) AND at least one suspicious transaction pattern. In this case, although there is a suspicious flat-value transaction pattern, the merchant does not have a thin file profile due to their established social media presence, domain age, and working website. Therefore, the overall red flag is not triggered.",
      overallTriggered: false,
    },
    {
      code: "RF005",
      subrules: [
        {
          subrule: "brand_name_mismatch",
          reasoning:
            "The merchant_brand_name is 'INSTAFAB ONLINE STORE' and the website/about section uses 'Instafab Plus'. These names are clearly related, sharing the core brand 'Instafab', and there is no evidence of a severe or deceptive mismatch.",
          triggered: false,
        },
        {
          subrule: "legal_name_mismatch",
          reasoning:
            "The merchant_registered_name is 'SHESH KUMAR'. There is no mention of any legal or registered business name on the website, so there is no evidence of a conflicting legal name.",
          triggered: false,
        },
        {
          subrule: "website_content_not_aligned",
          reasoning:
            "The LOB is 'Men's and Women's Clothing Stores'. The website content describes Instafab Plus as specializing in plus-size clothing for men and women, which is directly aligned with this LOB.",
          triggered: false,
        },
      ],
      overallReasoning:
        "None of the subrules are triggered: the brand names are clearly related, there is no evidence of a legal name mismatch, and the website content is aligned with the merchant's line of business. Therefore, the red flag is not triggered.",
      overallTriggered: false,
    },
    {
      code: "RF013",
      subrules: [
        {
          subrule: "ipg_flag",
          reasoning:
            "The subrule was not triggered because the 'triggered' value is False, indicating that the IPG failure rate is not greater than 70%.",
          triggered: false,
        },
      ],
      overallReasoning:
        "The overall flag RF013 is not triggered because the only subrule, ipg_flag, was not triggered. This means the percentage of IPG failure is not greater than 70%.",
      overallTriggered: false,
    },
    {
      code: "RF014",
      subrules: [
        {
          subrule: "no_company_or_gst",
          reasoning:
            "The subrule is triggered because the GST Flag is 0 (indicating no GST registration) and the org_type is 'Individual', which matches the specified conditions (org_type is one of Individual, Proprietorship, Partnership and GST registration is 0).",
          triggered: true,
        },
      ],
      overallReasoning:
        "The red flag RF014 is triggered because the only subrule 'no_company_or_gst' is triggered. This is due to the merchant having an org_type of 'Individual' and no GST registration (GST Flag: 0), which matches the criteria for this red flag.",
      overallTriggered: true,
    },
    {
      code: "good_social_media_presence_flag",
      subrules: [
        {
          subrule: "linkedin_presence",
          reasoning:
            "No relevant LinkedIn profiles for 'Instafab Plus' related to Men's and Women's Clothing Stores were found after searching through multiple pages of Google search results. No evidence of employees, followers, posts, or company page matching the criteria.",
          triggered: false,
        },
        {
          subrule: "instagram_presence",
          reasoning:
            "No relevant Instagram id found. Both Instagram links led to login pages, preventing information extraction. No evidence of followers or posts could be verified.",
          triggered: false,
        },
        {
          subrule: "youtube_presence",
          reasoning:
            "The YouTube channel https://www.youtube.com/@instafabplus9185 has 106 subscribers (less than 200) but 137 videos (more than 15). The red flag is triggered if either condition is met. Solid evidence of more than 15 videos exists.",
          triggered: true,
        },
        {
          subrule: "facebook_presence",
          reasoning:
            "The Facebook page https://www.facebook.com/Instafabplus/ has 4403 likes (followers), which is more than 500. This meets the red flag criteria.",
          triggered: true,
        },
        {
          subrule: "playstore_presence",
          reasoning:
            "The Play Store app (https://play.google.com/store/apps/details?id=com.campussutra.instafab) has 10K+ downloads, which is more than 1000. This meets the red flag criteria.",
          triggered: true,
        },
        {
          subrule: "appstore_presence",
          reasoning:
            "The Apple App Store app (https://apps.apple.com/in/app/instafab-plus-plus-size-fits/id6474136002) has a rating of 4.6, but the number of downloads is not available. The other app also does not provide download information. Since there is no solid evidence of downloads > 1000 or downloads > 300, the flag is not triggered.",
          triggered: false,
        },
      ],
      overallReasoning: "Good Customer Flag triggered",
      overallTriggered: true,
    },
    {
      code: "corporate_merchant_flag",
      subrules: [
        {
          subrule: "corporate_merchant_flag",
          reasoning:
            "Org type is Individual which refects it is a corporate merchant",
          triggered: false,
        },
      ],
      overallReasoning:
        "Org type is Individual which refects it is a corporate merchant",
      overallTriggered: false,
    },
    {
      code: "vintage_merchant_flag",
      subrules: [
        {
          subrule: "vintage_merchant_flag",
          reasoning: "The age of the domain is 25 months",
          triggered: true,
        },
      ],
      overallReasoning: "The age of the domain is 25 months",
      overallTriggered: true,
    },
  ],
};
