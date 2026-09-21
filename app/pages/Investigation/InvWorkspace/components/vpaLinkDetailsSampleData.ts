export interface VPALinkDetail {
  id: string;
  title: string;
  source: string;
  status: "Potential Risk Identified" | "No Risk Observed";
  statusColor: "red" | "green";
  description: string;
  url: string;
}

export const vpaLinkDetails: Record<string, VPALinkDetail[]> = {
  "VPA-001": [
    {
      id: "L1",
      title: "Cheating of Bhima gold Jayanagar Bangalore",
      source: "Review",
      status: "Potential Risk Identified",
      statusColor: "red",
      description: "A customer alleges being cheated by a monthly savings scheme. After being told they could redeem savings for a gold coin, the store claimed no coins were available and forced them to purchase a more expensive ornament by paying an extra amount, a tactic they repeated a year later.",
      url: "https://www.mouthshut.com/review/Bhima-Jewellers-Bangalore-review-tqotqqnqlno"
    },
    {
      id: "L2",
      title: "Delayed delivery of gold coins",
      source: "Review",
      status: "No Risk Observed",
      statusColor: "green",
      description: "Ordered a gold coin during the Akshaya Tritiya period, but delivery was delayed by over 3 weeks with no proper communication from the store staff.",
      url: "https://www.google.com/search?q=bhima+jewellers+reviews"
    },
    {
      id: "L3",
      title: "Misleading discount offers",
      source: "Review",
      status: "Potential Risk Identified",
      statusColor: "red",
      description: "The discount offered during the festive season was offset by increased making charges, resulting in no actual savings for the customer.",
      url: "https://www.mouthshut.com/review/Bhima-Jewellers-Bangalore"
    },
    {
      id: "L4",
      title: "Poor customer service at Jayanagar branch",
      source: "Review",
      status: "No Risk Observed",
      statusColor: "green",
      description: "Found the staff to be very indifferent to customer queries. Had to wait for a long time just to get an estimate for a necklace.",
      url: "https://www.google.com/search?q=bhima+jewellers+jayanagar+reviews"
    },
    {
      id: "L5",
      title: "Issues with gold purity certification",
      source: "Review",
      status: "Potential Risk Identified",
      statusColor: "red",
      description: "The store was hesitant to provide a separate BIS hallmarking certificate for the purchased jewelry, which raised concerns about the purity.",
      url: "https://www.mouthshut.com/review/Bhima-Jewellers"
    },
    {
      id: "L6",
      title: "High making charges compared to others",
      source: "Review",
      status: "No Risk Observed",
      statusColor: "green",
      description: "While the gold designs are good, the making charges are quite stiff compared to other reputable jewelers in the same locality.",
      url: "https://www.google.com/search?q=bhima+jewellers+making+charges"
    },
    {
      id: "L7",
      title: "Unauthorized transaction on store credit",
      source: "Review",
      status: "Potential Risk Identified",
      statusColor: "red",
      description: "Discovered an unauthorized transaction on my store credit account. The issue took multiple follow-ups with the manager to resolve.",
      url: "https://www.mouthshut.com/review/Bhima-Jewellers-Bangalore"
    }
  ],
  "VPA-002": [
    {
      id: "P1",
      title: "Verified Merchant Registration",
      source: "System Check",
      status: "No Risk Observed",
      statusColor: "green",
      description: "Priya Nandakumar is a registered proprietor with verified GST and tax returns spanning the last 5 years with consistent growth.",
      url: "https://internal.verify/merchants/priya-n"
    },
    {
      id: "P2",
      title: "Positive Customer Feedback (Local Listings)",
      source: "Review",
      status: "No Risk Observed",
      statusColor: "green",
      description: "Highly rated on various local directories with consistent 4.5+ average rating over 200+ reviews for her boutique services.",
      url: "https://www.justdial.com/Priya-Boutique-Bangalore"
    },
    {
      id: "P3",
      title: "Legitimate Business Presence",
      source: "Web Analysis",
      status: "No Risk Observed",
      statusColor: "green",
      description: "Physical store location verified via 3rd party mapping services. All contact information matches provided documentation.",
      url: "https://maps.google.com/places/priya-boutique"
    },
    {
      id: "P4",
      title: "No Suspicious Linkages Found",
      source: "Graph Analysis",
      status: "No Risk Observed",
      statusColor: "green",
      description: "No direct or indirect connections to flagged entities, high-risk individuals, or blacklisted domains discovered in the entity graph.",
      url: "https://internal.graph/nodes/priya-n"
    }
  ],
  "VPA-003": [
    {
      id: "M1",
      title: "Multiple UPI IDs linked to same phone",
      source: "Security Alert",
      status: "Potential Risk Identified",
      statusColor: "red",
      description: "System detected 4 different VPAs linked to the same mobile number within a 24-hour window, which is a common pattern for mule accounts.",
      url: "https://internal.security/alerts/VPA-003"
    },
    {
      id: "M2",
      title: "Frequent small-value transactions",
      source: "Pattern Analysis",
      status: "Potential Risk Identified",
      statusColor: "red",
      description: "Highly regular flow of transactions below INR 500, often occurring at odd hours (2 AM to 4 AM), suggesting automated or bot behavior.",
      url: "https://internal.security/analysis/pattern-334"
    },
    {
      id: "M3",
      title: "Associated with flagged domain: fastpay.biz",
      source: "Threat Intel",
      status: "Potential Risk Identified",
      statusColor: "red",
      description: "This VPA was used for payments on fastpay.biz, a domain recently added to the global blacklist for phishing activities.",
      url: "https://threat-intel-db.com/domains/fastpay.biz"
    },
    {
      id: "M4",
      title: "Shared device with known fraudulent ID",
      source: "Linkage Analysis",
      status: "Potential Risk Identified",
      statusColor: "red",
      description: "The device used to register this VPA was also used for account login by 'user_992' which was permanently banned for fraud.",
      url: "https://internal.linkage-db.com/devices/D-992-X"
    },
    {
      id: "M5",
      title: "History of chargeback disputes",
      source: "Transactional History",
      status: "Potential Risk Identified",
      statusColor: "red",
      description: "Merchant has a significantly higher than average rate of chargebacks (8.4%) cited for services not rendered.",
      url: "https://internal.stats/chargebacks/vpa-003"
    }
  ]
};
