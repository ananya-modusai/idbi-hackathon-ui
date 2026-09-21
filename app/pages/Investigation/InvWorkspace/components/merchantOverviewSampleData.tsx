import { WebsiteAnalysisKeyValue } from "../../Sample Data/InvCasesSampleData";
import { ColorScheme } from "@/components/custom/CustomColorScheme";

/**
 * Sample data utilities for Merchant Overview tab.
 * These mirror the key-value shape used across WebAnalysis components so they
 * can be rendered with `CustomTableView`.
 */

export const getBrandLegalValidation = (
  activeCase?: any
): WebsiteAnalysisKeyValue[] => {
  const brandOnWebsite = activeCase?.brandName || "N/A";
  const legalNameFooter = activeCase?.legalNameFooter || "N/A";
  const legalNameAbout = activeCase?.legalNameInAbout || "N/A";
  const logoDescription =
    activeCase?.logoDescription || activeCase?.logo_desc || "N/A";
  const addressOnWebsite = activeCase?.addressOnWebsite || "N/A";

  // Try to infer a registered name from the case to compute simple matches.
  const registeredName = (
    activeCase?.registeredName ||
    activeCase?.registered_name ||
    activeCase?.legalName ||
    ""
  ).toString();

  const safeLower = (s: any) => String(s || "").toLowerCase();
  const brandMatches =
    registeredName &&
    brandOnWebsite &&
    safeLower(registeredName).includes(safeLower(brandOnWebsite));
  const footerMatches =
    registeredName &&
    legalNameFooter &&
    safeLower(registeredName) === safeLower(legalNameFooter);
  const aboutMatches =
    registeredName &&
    legalNameAbout &&
    safeLower(registeredName) === safeLower(legalNameAbout);

  return [
    {
      field: "Brand Name on Website",
      value: brandOnWebsite,
      keyIcon: "Info",
      keyIconColor: "blue" as ColorScheme,
      valueSentiment: "positive",
      // Include a simple `matches` boolean so the UI can render Match/Mismatch
      matches: !!brandMatches,
    } as any,
    {
      field: "Legal Name in Footer",
      value: legalNameFooter,
      keyIcon: "FileText",
      keyIconColor: "blue" as ColorScheme,
      valueSentiment: "info",
      matches: !!footerMatches,
    } as any,
    {
      field: "Legal Name in About/Policy",
      value: legalNameAbout,
      keyIcon: "FileText",
      keyIconColor: "blue" as ColorScheme,
      valueSentiment: "info",
      matches: !!aboutMatches,
    } as any,
    {
      field: "Logo Description",
      value: logoDescription,
      keyIcon: "Info",
      keyIconColor: "blue" as ColorScheme,
      valueSentiment: "info",
    },
    {
      field: "Address on Website",
      value: addressOnWebsite,
      keyIcon: "MapPin",
      keyIconColor: "blue" as ColorScheme,
      valueSentiment: "info",
    },
  ];
};

// Future helpers for merchant overview can be added here (e.g., registrar data,
// identity matches, address validation). Keep functions pure and accept an
// optional activeCase so callers can pass live case data.

export const getWebsiteIntegrity = (activeCase?: any) => {
  const registeredName = activeCase?.registeredName || "N/A";
  const brandName = activeCase?.brandName || "N/A";

  // Simple sample logic: if registeredName contains brandName (case-insensitive)
  // treat as a match; otherwise mismatch. Real logic may use more advanced
  // normalization and fuzzy matching.
  const rn = String(registeredName).toLowerCase();
  const bn = String(brandName).toLowerCase();
  const isMatch = bn && rn.includes(bn);

  const reasoning = isMatch
    ? `Registered name (${registeredName}) contains brand name (${brandName}), indicating a likely match.`
    : `Registered name (${registeredName}) does not contain brand name (${brandName}). This may indicate a mismatch or alternate operating name.`;

  // Map match to a low-risk summary, mismatch to medium risk for display
  const riskLevel = isMatch ? "low" : "medium";

  return {
    title: `${registeredName} <=> ${brandName}`,
    match: isMatch,
    reasoning,
    riskLevel,
  };
};

export default {
  getBrandLegalValidation,
};

// Add URL consistency helper for Website Integrity subsection
export const getUrlConsistency = (activeCase?: any) => {
  const registeredUrl =
    activeCase?.registeredUrl || activeCase?.registered_url || "";
  const homepageRedirect =
    activeCase?.homepageRedirect || activeCase?.homepage_redirect || "";
  const paymentUrl = activeCase?.paymentUrl || activeCase?.payment_url || "";
  const returnUrl = activeCase?.returnUrl || activeCase?.return_url || "";

  const normalizeHost = (u: string) => {
    try {
      const parsed = new URL(u);
      let host = parsed.hostname || "";
      // strip leading www.
      if (host.startsWith("www.")) host = host.slice(4);
      return host.toLowerCase();
    } catch (e) {
      // fallback: remove protocol and path
      try {
        let s = String(u || "")
          .trim()
          .toLowerCase();
        s = s.replace(/^https?:\/\//, "").replace(/^www\./, "");
        const parts = s.split(/[\/\?]/);
        return parts[0] || "";
      } catch (er) {
        return "";
      }
    }
  };

  const regHost = normalizeHost(registeredUrl);
  const homeHost = normalizeHost(homepageRedirect);
  const payHost = normalizeHost(paymentUrl);
  const retHost = normalizeHost(returnUrl);

  const rows = [
    {
      field: "Registered URL",
      value: registeredUrl || "N/A",
      keyIcon: "Link",
      keyIconColor: "blue" as ColorScheme,
      // present here for consumer renderers
      matches: true,
    },
    {
      field: "Homepage Redirection",
      value: homepageRedirect || "N/A",
      keyIcon: "RefreshCw",
      keyIconColor: "blue" as ColorScheme,
      matches: !!(regHost && homeHost && regHost === homeHost),
    },
    {
      field: "Payment URL",
      value: paymentUrl || "N/A",
      keyIcon: "CreditCard",
      keyIconColor: "blue" as ColorScheme,
      matches: !!(regHost && payHost && regHost === payHost),
    },
    {
      field: "Return URL",
      value: returnUrl || "N/A",
      keyIcon: "CornerUpRight",
      keyIconColor: "blue" as ColorScheme,
      matches: !!(regHost && retHost && regHost === retHost),
    },
  ];

  return rows;
};

// Website quality checklist sample data
export const getWebsiteQualityChecklist = (activeCase?: any) => {
  // Example checklist items and statuses. The UI now expects only 'yes' | 'no'
  // where 'yes' means the check passes (good) and 'no' means it fails (bad).
  // Map previous 'pass' -> 'yes', 'fail'/'partial'/'neutral' -> 'no'.
  // Updated labels to match the new Metrics/UI naming. We replace the two
  // product-related cards (description + customisation) with a single
  // negative-phrased card so the UI displays the consolidated metric.
  return [
    { name: "Product Listing", status: "no" },
    { name: "Product Details", status: "no" },
    { name: "Product Images", status: "no" },
    { name: "Policy", status: "no" },
    { name: "Placeholder Text", status: "no" },
    { name: "Identical Pricing", status: "no" },
    { name: "TGTBT Pricing", status: "no" },
    { name: "Banned & Restricted Category", status: "no" },
    { name: "Impersonation", status: "no" },
  ].map((r) => ({ ...r }));
};

// Monitored dimensions used in the Merchant Overview -> Monitored Dimensions
// subsection. These are rendered with WebsiteQualityCard (name + status).
export const getMonitoredDimensions = (activeCase?: any) => {
  // Return only 'yes' | 'no' values (no partials). For demo purposes provide a
  // mix of 'yes' and 'no' so the UI shows both states. If `activeCase` contains
  // explicit flags for a dimension, respect those; otherwise fall back to the
  // sample defaults below.
  const sampleOverrides: Record<string, "yes" | "no"> = {
    "Registered Name": "yes",
    "Business Name": "no",
    "Website Content": "yes",
    "Website Domain": "yes",
    "Return URL": "no",
    "Payment URL": "no",
  };

  const names = Object.keys(sampleOverrides);

  return names.map((name) => {
    // Prefer explicit activeCase-derived value if present (coerce to 'yes'/'no')
    const raw =
      activeCase &&
      activeCase.monitoredDimensions &&
      activeCase.monitoredDimensions[name];
    let status: "yes" | "no" =
      sampleOverrides[name as keyof typeof sampleOverrides];
    if (raw === true || String(raw).toLowerCase() === "yes") status = "yes";
    if (raw === false || String(raw).toLowerCase() === "no") status = "no";
    return { name, status };
  });
};

// Social media / external presence sample helper
export const getSocialMediaOverview = (activeCase?: any) => {
  // Try to read common fields; fall back to reasonable sample values
  const s = activeCase?.social || {};

  // Helper to normalize many possible presence representations into a
  // canonical status used by the UI. This mirrors the logic in
  // SocialMediaCard.interpretPresence so sample-data mapping doesn't
  // accidentally treat truthy non-presence strings (like "N/A") as Active.
  const normalizePresence = (
    v: any
  ): "Active" | "Not Found" | "N/A" | undefined => {
    if (v === null) return "N/A";
    if (typeof v === "undefined") return undefined;
    if (typeof v === "boolean") return v ? "Active" : "Not Found";
    if (typeof v === "string") {
      const sv = v.trim().toLowerCase();
      if (["true", "yes"].includes(sv)) return "Active";
      if (["false", "no"].includes(sv)) return "Not Found";
      if (["na", "n/a", "null"].includes(sv)) return "N/A";
      return undefined;
    }
    // If it's an object, attempt common nested keys. Also try any key
    // that contains 'presence' or 'status' (e.g. 'youtube_presence',
    // 'linkedin_presence') so platform-prefixed keys are handled.
    if (v && typeof v === "object") {
      const candidateKeys = [
        "presence",
        "status",
        "value",
        "presence_status",
        "presenceValue",
      ];
      for (const k of candidateKeys) {
        if (Object.prototype.hasOwnProperty.call(v, k)) {
          const nested = v[k];
          const out = normalizePresence(nested as any);
          if (typeof out !== "undefined") return out;
        }
      }

      // Look for any key that includes 'presence' or 'status' (case-insensitive)
      const keys = Object.keys(v || {});
      for (const key of keys) {
        const kl = key.toLowerCase();
        if (kl.includes("presence") || kl.includes("status")) {
          try {
            const nested = (v as any)[key];
            const out = normalizePresence(nested as any);
            if (typeof out !== "undefined") return out;
          } catch (e) {
            // ignore and continue
          }
        }
      }
    }
    return undefined;
  };

  const rows = [
    {
      name: "LinkedIn",
      iconName: "Linkedin",
      // Prefer an explicit status on the nested object, then common top-level
      // keys. Normalize various representations so strings like "N/A" are
      // respected instead of treated as truthy.
      status:
        s.linkedIn?.status ||
        s.linkedin_status ||
        normalizePresence(s.linkedIn ?? s.linkedin) ||
        // If we couldn't normalize presence and a nested object exists,
        // prefer conservative 'Not Found' rather than assuming Active.
        (s.linkedIn || s.linkedin ? "Not Found" : "Not Found"),
      followers: s.linkedIn?.followers ?? s.linkedin_followers ?? 2340,
      // Add employees & connections for LinkedIn display
      employees: s.linkedIn?.employees ?? s.linkedin_employees ?? 120,
      connections: s.linkedIn?.connections ?? s.linkedin_connections ?? "500+",
      posts: s.linkedIn?.posts ?? s.linkedin_posts ?? undefined,
      url: s.linkedIn?.url ?? s.linkedin_url ?? s.linkedin ?? "",
    },
    {
      name: "Instagram",
      iconName: "Instagram",
      status:
        s.instagram?.status ||
        normalizePresence(s.instagram_presence) ||
        normalizePresence(s.instagram) ||
        "Not Found",
      followers: s.instagram?.followers ?? s.instagram_followers ?? 15600,
      posts: s.instagram?.posts ?? s.instagram_posts ?? 234,
      url: s.instagram?.url ?? s.instagram_url ?? s.instagram ?? "",
    },
    {
      name: "Facebook",
      iconName: "Facebook",
      status:
        s.facebook?.status ||
        normalizePresence(s.facebook_presence) ||
        normalizePresence(s.facebook) ||
        "Not Found",
      followers: s.facebook?.followers ?? s.facebook_followers ?? 8900,
      posts: s.facebook?.posts ?? s.facebook_posts ?? 156,
      url: s.facebook?.url ?? s.facebook_url ?? s.facebook ?? "",
    },
    {
      name: "YouTube",
      iconName: "Youtube",
      status:
        s.youtube?.status ||
        s.youtube_status ||
        normalizePresence(s.youtube_presence) ||
        normalizePresence(s.youtube) ||
        "Not Found",
      // expose both subscribers and followers: subscribers used by UI for YouTube
      subscribers: s.youtube?.subscribers ?? s.youtube_subscribers ?? 12000,
      followers:
        s.youtube?.followers ??
        s.youtube_followers ??
        s.youtube?.subscribers ??
        s.youtube_subscribers ??
        "N/A",
      posts: s.youtube?.videos ?? s.youtube_videos ?? "N/A",
      url: s.youtube?.url ?? s.youtube_url ?? s.youtube ?? "",
    },
  ];

  return rows;
};

// Marketplace overview: create marketplace cards in the same shape the UI
// expects. This centralizes marketplace logic so the overview tab doesn't
// duplicate the mapping code.
export const getMarketplaceOverview = (
  activeCase?: any,
  outputFormat?: Record<string, any>
) => {
  const of: Record<string, any> = outputFormat || {};
  const ac: Record<string, any> = (activeCase as any) || {};

  const platforms = [
    { key: "google", name: "Google", iconName: "Google" },
    { key: "amazon", name: "Amazon", iconName: "Amazon" },
    { key: "flipkart", name: "Flipkart", iconName: "Flipkart" },
    { key: "justdial", name: "Justdial", iconName: "Justdial" },
    { key: "indiamart", name: "Indiamart", iconName: "Indiamart" },
    { key: "meesho", name: "Meesho", iconName: "Meesho" },
  ];

  return platforms.map((p) => {
    const presenceKey = `market_${p.key}_presence`;
    const ratingKey = `market_${p.key}_rating`;
    const ratingCountKey = `market_${p.key}_rating_count`;
    const listingKey = `market_${p.key}_listing`;
    const verifiedKey = `market_${p.key}_verified`;

    const presence =
      typeof of[presenceKey] !== "undefined"
        ? Boolean(of[presenceKey])
        : Boolean(ac[presenceKey]);

    const rating =
      typeof of[ratingKey] !== "undefined"
        ? of[ratingKey]
        : typeof ac[ratingKey] !== "undefined"
        ? ac[ratingKey]
        : null;

    const rating_count =
      typeof of[ratingCountKey] !== "undefined"
        ? of[ratingCountKey]
        : typeof ac[ratingCountKey] !== "undefined"
        ? ac[ratingCountKey]
        : null;

    const listing =
      typeof of[listingKey] !== "undefined"
        ? of[listingKey]
        : typeof ac[listingKey] !== "undefined"
        ? ac[listingKey]
        : null;

    const verified =
      typeof of[verifiedKey] !== "undefined"
        ? Boolean(of[verifiedKey])
        : typeof ac[verifiedKey] !== "undefined"
        ? Boolean(ac[verifiedKey])
        : false;

    const status = presence ? "Active" : "Not Found";

    // Map marketplace info into the same shape SocialMediaCard expects
    return {
      type: "marketplace",
      iconName: (p as any).iconName || "ShoppingCart",
      name: p.name,
      status,
      followers: rating
        ? `${rating}${rating_count ? ` (${rating_count})` : ""}`
        : undefined,
      posts: listing || undefined,
      url: undefined,
      verified,
      raw: { presence, rating, rating_count, listing, verified },
    } as any;
  });
};

// Behavioural flags sample helper (used in Transaction -> Behaviourial flags)
// The flags represent the presence of suspicious behaviour. We now return
// 'yes' | 'no' where 'yes' indicates the flag IS present (bad) and 'no'
// indicates the flag is NOT present (good).
export const getBehaviouralFlags = (activeCase?: any) => {
  return [
    { name: "High Credit Card Value Transactions", status: "no" },
    { name: "Flat Value Transaction Pattern", status: "no" },
    { name: "Transaction Description Unaligned", status: "no" },
    { name: "Amount vs MCC Unaligned", status: "no" },
    { name: "Amount vs Listed Products Unaligned", status: "yes" },
  ].map((r) => ({ ...r }));
};

// Linkage categories used in the Fraud intelligence -> Linkage categories
// subsection. These are deliberately simple and intended for UI/demo use.
export const getLinkageCategories = (activeCase?: any) => {
  // Default to 'no' so UI shows a green (no-linkage) card when no data is
  // available. When linkage is present in the activeCase, mark 'yes'.
  // For demo we include both 'yes' and 'no' statuses so the Fraud UI shows
  // both states. If `activeCase.linkage` explicitly signals linkage for a
  // category, respect that value. Otherwise fall back to the sample mapping.
  const sampleYes = new Set(["Mobile"]);

  const categories = [
    "Phone",
    "Email",
    "Device",
    "Address",
    "Registered URL",
    "Return URL",
    "Payment URL",
    "Registered Name",
    "Business Name",
    "Backlinks",
  ];

  return categories.map((name) => {
    const explicit =
      activeCase &&
      activeCase.linkage &&
      typeof activeCase.linkage[name] !== "undefined"
        ? activeCase.linkage[name]
        : undefined;
    let status: "yes" | "no" = sampleYes.has(name) ? "yes" : "no";
    if (typeof explicit !== "undefined") {
      status = explicit ? "yes" : "no";
    }
    return { name, status };
  });
};
