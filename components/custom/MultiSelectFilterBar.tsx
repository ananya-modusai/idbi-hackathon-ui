import React, { useEffect, useRef, useState } from "react";
import { MultiSelect } from "@/components/ui/multi-select2";
import {
  SortActionButton,
  SortDirection,
} from "@/components/custom/CustomList/SortActionButton";
import CustomListActionButton, {
  ActionButtonGroup,
} from "@/components/custom/CustomList/customListActionButton";

type Item = {
  label: string;
  key: string;
  subItems?: string[];
};

export const ITEMS: Item[] = [
  {
    label: "Risk Flags",
    key: "risk_flags",
    subItems: [
      "GF001",
      "GF002",
      "GF003",
      "RF001",
      "RF002",
      "RF003",
      "RF004",
      "RF005",
      "RF006",
      "RF007",
      "RF008",
      "RF009",
      "RF010",
      "RF011",
      "RF012",
      "RF013",
      "RF014",
      "RF015",
      "RF016",
      "RF017",
    ],
  },
  {
    label: "Merchant Integrity",
    key: "merchant_integrity",
    subItems: [
      "Identity Verification.Trade / Business Name / Brand Name",
      "Business Classification.mcc",
      "Registration Details.pan",
      "Registration Details.cin",
      "Registration Details.gstn",
      "Address Details.registered_address",
      "Contact Details.email",
      "Contact Details.phone",
      "Key Personnel.owner",
    ],
  },
  {
    label: "Web analysis",
    key: "web_analysis",
    subItems: [
      "Product & Content Quality.no_product_listing",
      "Product & Content Quality.products_without_description_or_customization",
      "Product & Content Quality.product_without_images",
      "Product & Content Quality.policy_not_found",
      "Product & Content Quality.found_placeholder_text",
      "Product & Content Quality.identical_pricing",
      "Product & Content Quality.tgbt",
      "Transaction Behaviour.txn_website_data_unaligned",
      "Product & Content Quality.website_not_loading",
      // RF017 Sub-rules
      "flagged_merchant_match",
    ],
  },
  // {
  //   label: "Transaction Patterns",
  //   key: "transaction_patterns",
  //   subItems: [
  //     // Payment metrics
  //     "Payment Metrics.high_value_cc_txn",
  //     // Transaction Behaviour metrics
  //     "Transaction Behaviour.flat_value_pattern",
  //     "Transaction Behaviour.txn_description_unaligned",
  //     "Transaction Behaviour.txn_amount_unaligned",
  //     "Transaction Behaviour.txn_website_data_unaligned",
  //     "Payment Metrics.cc_txn_concentration",
  //   ],
  // },
  {
    label: "Impersonation",
    key: "impersonation",
    subItems: [
      // use the RF006 subrule names so they match the API and show
      // explicit triggered values (registered_name, brand_name, logo_image, primary_website_url)
      "registered_name",
      "brand_name",
      "logo_image",
      "primary_website_url",
    ],
  },
  {
    label: "Social Media & Marketplace",
    key: "social_media_marketplace",
    subItems: [
      "Social Media Presence.LinkedIn.linkedin_presence",
      "Social Media Presence.Instagram.instagram_presence",
      "Social Media Presence.Facebook.facebook_presence",
      "Social Media Presence.YouTube.youtube_presence",
      "Marketplace Presence.Google.market_google_presence",
      "Marketplace Presence.Amazon.market_amazon_presence",
      "Marketplace Presence.Flipkart.market_flipkart_presence",
      "Marketplace Presence.Justdial.market_justdial_presence",
      "Marketplace Presence.Indiamart.market_indiamart_presence",
      "Marketplace Presence.Meesho.market_meesho_presence",
    ],
  },
  {
    label: "Scam Intelligence",
    key: "scam_intelligence",
    subItems: [
      "Scam Signals.external_scam_list_matches",
      "Scam Signals.custom_scam_list_matches",
      "Scam Signals.url_scam_keyword_matches",
      "Scam Signals.scam_legalname",
      "Scam Signals.scam_businessname",
      "Scam Signals.scam_websitecontent",
      "Scam Signals.scam_websitedomain",
    ],
  },
  // {
  //   label: "Ownership",
  //   key: "ownership",
  //   subItems: [
  //     "Website & Brand Validation.Brand Name on website mismatch",
  //     "Website & Brand Validation.Legal Name on website mismatch",
  //     "Risk Flags.vintage_merchant_flag",
  //     "Risk Flags.corporate_merchant_flag",
  //     "Website & Brand Validation.gst_registration",
  //   ],
  // },
];

// Export the default keys for the Risk Flags group so other components can
// initialize table columns independently of the UI selection state.
export const DEFAULT_RISK_FLAG_KEYS: string[] =
  ITEMS.find((it) => it.key === "risk_flags")?.subItems ?? [];

// Mapping of metric keys to friendly display labels
export const METRIC_LABEL_MAP: Record<string, string> = {
  "Product & Content Quality.no_product_listing": "has Product Listing",
  "Product & Content Quality.products_without_description_or_customization":
    "No Product Details",
  "Product & Content Quality.product_without_images": "No Product Images",
  "Product & Content Quality.policy_not_found": "No Policy",
  "Product & Content Quality.found_placeholder_text": "Placeholder text Found",
  "Product & Content Quality.identical_pricing": "Identical Pricing",
  "Product & Content Quality.tgbt": "TGTBT Pricing",
  "Transaction Behaviour.txn_website_data_unaligned":
    "Business Activity Mismatch",
  "Payment Metrics.high_value_cc_txn": "High Credit Card Value Transactions",
  "Transaction Behaviour.flat_value_pattern": "Flat Value Transaction Pattern",
  "Transaction Behaviour.txn_description_unaligned":
    "Transaction Description unaligned LOB",
  "Transaction Behaviour.txn_amount_unaligned": "Amount vs MCC Unaligned",
  "Payment Metrics.cc_txn_concentration":
    "Credit Card Transaction Concentration",
  "Product & Content Quality.website_not_loading": "website_not_loading",
  "Social Media Presence.LinkedIn.linkedin_presence": "Linkedin Presence",
  "Social Media Presence.Instagram.instagram_presence": "Instagram Presence",
  "Social Media Presence.Facebook.facebook_presence": "Facebook Presence",
  "Social Media Presence.YouTube.youtube_presence": "Youtube Presence",
  "Marketplace Presence.Google.market_google_presence": "Google Presence",
  "Marketplace Presence.Amazon.market_amazon_presence": "Amazon Presence",
  "Marketplace Presence.Flipkart.market_flipkart_presence": "Flipkart Presence",
  "Marketplace Presence.Justdial.market_justdial_presence": "Justdial Presence",
  "Marketplace Presence.Indiamart.market_indiamart_presence":
    "Indiamart Presence",
  "Marketplace Presence.Meesho.market_meesho_presence": "Meesho Presence",
  "Scam Signals.external_scam_list_matches": "External Insights Confirmed Scam",
  "Scam Signals.custom_scam_list_matches": "Custom Scam List",
  "Scam Signals.url_scam_keyword_matches": "URL scam list",
  "Scam Signals.scam_legalname": "Registered Name Scam",
  "Scam Signals.scam_businessname": "Business Name Scam",
  "Scam Signals.scam_websitecontent": "Website Content Scam",
  "Scam Signals.scam_websitedomain": "Website Domain Scam",
  "Website & Brand Validation.Brand Name on website mismatch":
    "Brand Name Mismatch",
  "Website & Brand Validation.Legal Name on website mismatch":
    "Legal Name Mismatch",
  "Risk Flags.vintage_merchant_flag": "Thin File Merchant",
  "Risk Flags.corporate_merchant_flag": "Informal Organization Structure",
  "Website & Brand Validation.gst_registration": "GST Status",
  "Product & Content Quality.registered_name_impersonation":
    "Registered Name Impersonation",
  "Product & Content Quality.brand_name_impersonation":
    "Brand Name Impersonation",
  "Product & Content Quality.logo_impersonation": "Logo Impersonation",
  "Product & Content Quality.url_impersonation": "URL Impersonation",
  // Labels for RF006 subrule keys
  registered_name: "Registered Name Impersonation",
  brand_name: "Brand Name Impersonation",
  logo_image: "Logo Impersonation",
  primary_website_url: "URL Impersonation",
  flagged_merchant_match: "Flagged Merchant Match",
  "Identity Verification.Trade / Business Name / Brand Name": "Trade Name",
  "Business Classification.mcc": "MCC Code",
  "Registration Details.pan": "PAN",
  "Registration Details.cin": "CIN",
  "Registration Details.gstn": "GSTN",
  "Address Details.registered_address": "Registered Address",
  "Contact Details.email": "Contact Email",
  "Contact Details.phone": "Contact Phone",
  "Key Personnel.owner": "Owner Name",
};

// Helper function to get display label for a metric key
export const getMetricLabel = (key: string): string => {
  return METRIC_LABEL_MAP[key] || key;
};

// Map specific RF/GF flags to the metric keys that should be auto-selected
// when the flag is selected. We construct some entries dynamically from the
// ITEMS groups so they stay in-sync with the available dropdown options.
const buildFlagToMetricMap = () => {
  const findGroup = (k: string) =>
    ITEMS.find((it) => it.key === k)?.subItems ?? [];

  const webAnalysis = findGroup("web_analysis") as string[];
  const scamIntelligence = findGroup("scam_intelligence") as string[];
  const socialMediaMarketplace = findGroup(
    "social_media_marketplace"
  ) as string[];
  const impersonation = findGroup("impersonation") as string[];

  return {
    // RF -> metric keys
    RF005: [
      "Website & Brand Validation.Brand Name on website mismatch",
      "Website & Brand Validation.Legal Name on website mismatch",
      "Transaction Behaviour.txn_website_data_unaligned",
    ],
    RF006: impersonation,
    // RF009 -> all web analysis except business activity mismatch
    RF009: webAnalysis.filter(
      (k) => k !== "Transaction Behaviour.txn_website_data_unaligned"
    ),
    RF011: scamIntelligence,
    RF017: ["flagged_merchant_match"],
    GF001: socialMediaMarketplace,
  } as Record<string, string[]>;
};

// Small chevron down svg used in the control
const ChevronDown = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5 7.5L10 12.5L15 7.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronRight = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7.5 5L12.5 10L7.5 15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const MultiSelectFilterBar: React.FC<{
  className?: string;
  onSelectionChange?: (selected: string[]) => void;
  selectedItems?: string[];
  caseId?: string;
  // optional sort controls to render above the search bar
  sortFields?: { key: string; label: string }[];
  currentSortField?: string | null;
  currentSortDirection?: SortDirection;
  onSortChange?: (fieldKey: string, dir: SortDirection) => void;
  onReset?: () => void;
}> = ({
  className = "",
  onSelectionChange,
  selectedItems,
  caseId,
  sortFields,
  currentSortField,
  currentSortDirection,
  onSortChange,
  onReset,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  // Track which item's submenu (by key) is currently hovered so we can
  // Track which item's submenu (by key) is currently open. We switch from
  // hover-based menus to click/toggle-based submenus so each option can show
  // its own filter bar (search input) like the transaction ledger UI.
  const [openSubmenuKey, setOpenSubmenuKey] = useState<string | null>(null);
  // Per-option filter text used to filter subItems in each submenu.
  const [submenuFilters, setSubmenuFilters] = useState<Record<string, string>>(
    {}
  );
  const [loading, setLoading] = useState(false);

  // Keep a ref to the latest callback so we don't have to include the
  // parent's (possibly unstable) function in the effect dependency array.
  // This prevents the effect from re-running simply because the parent
  // passed a new inline function each render.
  const onSelectionChangeRef = useRef(onSelectionChange);
  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  // Auto-select based on red flags was driven by the now-removed fetchOutputFormat API.
  // No-op: metrics table starts with nothing pre-selected.
  useEffect(() => {
    // nothing to fetch
  }, [caseId]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        // Close dropdown and any open submenu when clicking outside
        setOpen(false);
        setOpenSubmenuKey(null);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setOpenSubmenuKey(null);
      }
    };

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
      // close any open submenu
      setOpenSubmenuKey(null);
    };
  }, []);

  // Toggle a selection; we update local state here and notify parent via
  // an effect so the parent's state update doesn't occur during this
  // component's render (avoids "setState in render" warnings).
  const toggleSelection = (col: string) => {
    setSelected((prev) => ({ ...prev, [col]: !prev[col] }));
  };

  // Toggle which submenu is open. (kept for backward compat but not used in new layout)
  const toggleSubmenu = (key: string) => {
    setOpenSubmenuKey((prev) => (prev === key ? null : key));
  };

  const updateSubmenuFilter = (key: string, value: string) => {
    setSubmenuFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Select all metrics across all categories
  const handleSelectAll = () => {
    const all = ITEMS.flatMap((it) => it.subItems || []);
    const newSelected: Record<string, boolean> = {};
    all.forEach((k) => (newSelected[k] = true));
    setSelected(newSelected);
    // notify parent with list of keys
    if (onSelectionChangeRef.current) onSelectionChangeRef.current([...all]);
  };

  // Handler for MultiSelect changes per category — update global selected map
  const handleCategoryChange = (subItems: string[], newValues: string[]) => {
    setSelected((prev) => {
      // Build the new state
      const copy = { ...prev };
      subItems.forEach((s) => {
        copy[s] = newValues.includes(s);
      });
      return copy;
    });
  };

  // Track the last prop value to avoid unnecessary updates
  const lastSelectedItemsRef = useRef<string[] | undefined>(undefined);

  // Sync internal state with selectedItems prop when it changes
  // Only update if the prop value is actually different from what we last synced
  useEffect(() => {
    if (selectedItems !== undefined) {
      const prev = lastSelectedItemsRef.current;
      const current = selectedItems;

      // Check if they're different (compare sorted arrays)
      const prevSorted = prev ? [...prev].sort().join(",") : "";
      const currentSorted = [...current].sort().join(",");

      if (prevSorted !== currentSorted) {
        lastSelectedItemsRef.current = current;
        const newSelected: Record<string, boolean> = {};
        current.forEach((item) => {
          newSelected[item] = true;
        });
        setSelected(newSelected);
      }
    } else if (
      selectedItems === undefined &&
      lastSelectedItemsRef.current !== undefined
    ) {
      // If prop becomes undefined, clear selection
      lastSelectedItemsRef.current = undefined;
      setSelected({});
    }
  }, [selectedItems]);

  // When a RF/GF flag is selected we want to automatically select other
  // metric keys. Conversely, when a flag is deselected we should remove
  // the auto-selected metrics unless another active flag also requires
  // them. This effect keeps that mapping in sync.
  // We use a ref to track which metrics were auto-selected so we only remove them
  // if they're no longer required by any flag.
  const autoSelectedMetricsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Build the set of all risk flag keys
    const riskFlagKeys = new Set(
      ITEMS.find((it) => it.key === "risk_flags")?.subItems ?? []
    );

    // Check if any risk flags changed by comparing the previous state
    const activeRiskFlags = Object.keys(selected).filter(
      (k) => riskFlagKeys.has(k) && selected[k]
    );

    const flagMap = buildFlagToMetricMap();
    const newAutoSelected = new Set<string>();

    // Calculate which metrics should be auto-selected based on active risk flags
    activeRiskFlags.forEach((flag) => {
      const metrics = flagMap[flag];
      if (metrics) {
        metrics.forEach((m) => newAutoSelected.add(m));
      }
    });

    setSelected((prev) => {
      const copy: Record<string, boolean> = { ...prev };
      let changed = false;

      // Remove metrics that were auto-selected but are no longer needed
      autoSelectedMetricsRef.current.forEach((metricKey) => {
        if (!newAutoSelected.has(metricKey)) {
          // Only remove if this metric is currently true
          if (copy[metricKey]) {
            copy[metricKey] = false;
            changed = true;
          }
        }
      });

      // Add newly required metrics from active flags
      newAutoSelected.forEach((metricKey) => {
        if (!copy[metricKey]) {
          copy[metricKey] = true;
          changed = true;
        }
      });

      autoSelectedMetricsRef.current = newAutoSelected;
      return changed ? copy : prev;
    });
  }, [selected]);

  // Track the last emitted chosen array to avoid re-emitting an identical
  // value (which would cause the parent to update and potentially trigger
  // a render loop if the parent setter creates a new array reference).
  const lastEmittedRef = useRef<string[] | null>(null);

  useEffect(() => {
    const chosen = Object.keys(selected).filter((k) => selected[k]);
    const prev = lastEmittedRef.current;
    const same =
      prev &&
      prev.length === chosen.length &&
      prev.every((v, i) => v === chosen[i]);
    if (!same) {
      lastEmittedRef.current = chosen;
      if (onSelectionChangeRef.current) onSelectionChangeRef.current(chosen);
    }
  }, [selected]);

  const row1Keys = ["risk_flags", "merchant_integrity", "web_analysis"];
  const row2Keys = [
    "impersonation",
    "scam_intelligence",
    "social_media_marketplace",
  ];

  const row1Items = ITEMS.filter((it) => row1Keys.includes(it.key));
  const row2Items = ITEMS.filter((it) => row2Keys.includes(it.key));

  return (
    <div className={`mb-3 pt-4 ${className}`} ref={containerRef}>
      <div className="flex flex-col gap-4">
        {/* Row 1: Risk Flags, Merchant Integrity, Web Analysis */}
        <div className="flex items-start gap-4 flex-wrap">
          {row1Items.map((it) => (
            <div key={it.key} className="flex items-center gap-3 min-w-[220px]">
              <div className="text-sm font-medium text-blue-600 whitespace-nowrap mr-2">
                {it.label}
              </div>
              {it.subItems && it.subItems.length > 0 ? (
                <div className="flex-1 min-w-[180px]">
                  <MultiSelect
                    options={it.subItems.map((s) => ({
                      value: s,
                      label: getMetricLabel(s),
                    }))}
                    value={it.subItems.filter((s) => !!selected[s])}
                    onValueChange={(vals: string[]) =>
                      handleCategoryChange(it.subItems as string[], vals)
                    }
                    placeholder={it.label}
                    className="w-72 border-gray-300 bg-inherit shadow"
                    compactSummary={
                      (it.subItems.filter((s) => !!selected[s]) || []).length >
                      1
                    }
                    compactSummaryFormatter={(sel) =>
                      `${sel.length} Metrics Selected`
                    }
                  />
                </div>
              ) : (
                <div className="text-sm text-gray-500">No options</div>
              )}
            </div>
          ))}
        </div>

        {/* Row 2: Impersonation, Scam Intelligence, Social Media & Marketplace */}
        <div className="flex items-start gap-4 flex-wrap">
          {row2Items.map((it) => (
            <div key={it.key} className="flex items-center gap-3 min-w-[220px]">
              <div className="text-sm font-medium text-blue-600 whitespace-nowrap mr-2">
                {it.label}
              </div>
              {it.subItems && it.subItems.length > 0 ? (
                <div className="flex-1 min-w-[180px]">
                  <MultiSelect
                    options={it.subItems.map((s) => ({
                      value: s,
                      label: getMetricLabel(s),
                    }))}
                    value={it.subItems.filter((s) => !!selected[s])}
                    onValueChange={(vals: string[]) =>
                      handleCategoryChange(it.subItems as string[], vals)
                    }
                    placeholder={it.label}
                    className="w-72 border-gray-300 bg-inherit shadow"
                    compactSummary={
                      (it.subItems.filter((s) => !!selected[s]) || []).length >
                      1
                    }
                    compactSummaryFormatter={(sel) =>
                      `${sel.length} Metrics Selected`
                    }
                  />
                </div>
              ) : (
                <div className="text-sm text-gray-500">No options</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MultiSelectFilterBar;
