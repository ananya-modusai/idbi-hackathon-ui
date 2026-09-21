"use client";

import { FC, useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import CustomList, {
  SortField,
  SortDirection,
} from "@/components/custom/CustomList/customList";
import { CustomListItemProps } from "@/components/custom/CustomList/customListItem";
import { SortActionButton } from "@/components/custom/CustomList/SortActionButton";
import { DownloadActionButton } from "@/components/custom/CustomList/DownloadActionButton";
import { Plus, Eye, ChevronRight, PenLine, RotateCcw } from "lucide-react";
import { ActionButton } from "@/components/custom/ActionButton";
import { useSidebarCollapsed } from "@/app/hooks/useSidebarCollapsed";
import { useMerchantIdStore } from "@/app/store/merchant/merchantIdStore";

import {
  getColorClasses,
  getTextColorClass,
  ColorScheme,
} from "@/components/custom/CustomColorScheme";
import { SectionHeaderWithFlags } from "@/components/custom/SectionHeaderWithFlags";
import { BubbleTag } from "@/components/custom/BubbleTag";
import { EditMerchantDialog } from "./EditMerchantDialog";
import { useMerchantNavigation } from "@/app/hooks/useMerchantNavigation";
import { watchlistService, WatchlistItem } from "@/app/services/watchlistServices";
import { useProfileStore } from "@/app/store/authentication/profileStore";
import { AddToWatchlistDialog } from "./AddToWatchlistDialog";
// import { conglomerateMapping } from '@/app/utils/conglomerateMapping';
// Removed unused import

import { WatchlistMerchantData } from "@/app/types/merchant";

interface MerchantWatchlistItem extends CustomListItemProps {
  originalData: WatchlistMerchantData;
}

const monitoringFrequencyOptions = [
  { value: "Daily", label: "Daily" },
  { value: "Weekly", label: "Weekly" },
  { value: "Monthly", label: "Monthly" },
];

const statusOptions = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

const riskSegmentOptions = [
  { value: "Very Low", label: "Very Low" },
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
  { value: "Very High", label: "Very High" },
];

// Columns included in the Excel export.
const exportFields = [
  "merchantName",
  "cin",
  "monitoringFrequency",
  "status",
  "industry",
  "industryRiskSegment",
  "final_pd",
  "cpv_score",
  "tpv_score",
  "collateral_score",
  "industry_add",
  "lgd_rate",
  "addedDate",
  "lastUpdatedDate",
];

const MerchantWatchlistTab: FC = () => {
  // A collapsed sidebar frees width: the export actions move up onto the filter
  // rows and the search takes a full-width row of its own.
  const isSidebarCollapsed = useSidebarCollapsed();
  const { merchantIdList, fetchMerchantIdList } = useMerchantIdStore();
  const {
    organizationId,
    isAdmin,
    isLoading: isProfileLoading,
    fetchProfile,
  } = useProfileStore();

  // Loading states
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(false);
  const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false);
  const [isUpdatingFrequency, setIsUpdatingFrequency] = useState(false);

  // Sort state management
  const [currentSortField, setCurrentSortField] = useState<string>("");
  const [currentSortDirection, setCurrentSortDirection] =
    useState<SortDirection>("asc");

  // Handler for sort changes
  const handleSortChange = (fieldKey: string, direction: SortDirection) => {
    setCurrentSortField(fieldKey);
    setCurrentSortDirection(direction);
  };

  // Define sort fields for the watchlist
  const sortFields = useMemo<SortField[]>(
    () => [
      {
        key: "merchantName",
        label: "Merchant Name",
        sortFunction: (a, b) => {
          const aData = (a as MerchantWatchlistItem).originalData;
          const bData = (b as MerchantWatchlistItem).originalData;
          return aData.merchantName.localeCompare(bData.merchantName);
        },
      },
      {
        key: "originalData.monitoringFrequency",
        label: "Monitoring Frequency",
        sortFunction: (a, b) => {
          const aData = (a as MerchantWatchlistItem).originalData;
          const bData = (b as MerchantWatchlistItem).originalData;
          const frequencyOrder = { Daily: 0, Weekly: 1, Monthly: 2 };
          return (
            frequencyOrder[aData.monitoringFrequency] -
            frequencyOrder[bData.monitoringFrequency]
          );
        },
      },
      {
        key: "pdScore",
        label: "PD Score",
        sortFunction: (a, b) => {
          const aData = (a as MerchantWatchlistItem).originalData;
          const bData = (b as MerchantWatchlistItem).originalData;
          return (
            getMetricNumber(aData as unknown as Record<string, unknown>, "final_pd") -
            getMetricNumber(bData as unknown as Record<string, unknown>, "final_pd")
          );
        },
      },
      {
        key: "originalData.status",
        label: "Status",
        sortFunction: (a, b) => {
          const aData = (a as MerchantWatchlistItem).originalData;
          const bData = (b as MerchantWatchlistItem).originalData;
          return aData.status.localeCompare(bData.status);
        },
      },
      {
        key: "originalData.industry",
        label: "Industry",
        sortFunction: (a, b) => {
          const aData = (a as MerchantWatchlistItem).originalData;
          const bData = (b as MerchantWatchlistItem).originalData;
          return aData.industry.localeCompare(bData.industry);
        },
      },
      {
        key: "originalData.mid",
        label: "Merchant ID",
        sortFunction: (a, b) => {
          const aData = (a as MerchantWatchlistItem).originalData;
          const bData = (b as MerchantWatchlistItem).originalData;
          return aData.mid.localeCompare(bData.mid);
        },
      },
      {
        key: "originalData.industryRiskSegment",
        label: "Industry Risk",
        sortFunction: (a, b) => {
          const aData = (a as MerchantWatchlistItem).originalData;
          const bData = (b as MerchantWatchlistItem).originalData;
          const riskOrder = {
            Severe: 0,
            "Very High": 1,
            High: 2,
            Medium: 3,
            Low: 4,
            "Very Low": 5,
          };

          // Handle cases where risk segment might be undefined
          const aRisk = aData.industryRiskSegment;
          const bRisk = bData.industryRiskSegment;

          if (!aRisk && !bRisk) return 0; // Both undefined, equal
          if (!aRisk) return 1; // a is undefined, put it after b
          if (!bRisk) return -1; // b is undefined, put it after a

          return riskOrder[aRisk] - riskOrder[bRisk];
        },
      },
    ],
    []
  );

  // Fetch profile on mount (only if organizationId is not already available)
  useEffect(() => {
    if (!organizationId && !isProfileLoading) {
      fetchProfile();
    }
  }, [organizationId, isProfileLoading, fetchProfile]);

  // Helper function to get color scheme for monitoring frequency
  const getFrequencyColorScheme = (
    frequency: "Daily" | "Weekly" | "Monthly"
  ): ColorScheme => {
    switch (frequency) {
      case "Daily":
        return "orange";
      case "Weekly":
        return "yellow";
      case "Monthly":
        return "blue";
      default:
        return "gray";
    }
  };

  // Helper function to get color scheme for risk segment (consistent with ProbabilityOfDefault.tsx)
  const getRiskColorScheme = (
    riskSegment: "Very Low" | "Low" | "Medium" | "High" | "Very High" | "Severe"
  ): ColorScheme => {
    switch (riskSegment) {
      case "Very Low":
        return "green";
      case "Low":
        return "blue";
      case "Medium":
        return "yellow";
      case "High":
        return "orange";
      case "Very High":
        return "red";
      case "Severe":
        return "red"; // Treat Severe as Very High
      default:
        return "gray";
    }
  };

  // Helper function to create watchlist item UI from data
  const createWatchlistItem = useCallback(
    (
      data: {
        merchantName: string;
        mid: string;
        cin?: string;
        monitoringFrequency: "Daily" | "Weekly" | "Monthly";
        addedDate?: string;
        datetime?: string;
        lastUpdatedDate?: string;
        status: string;
        industry?: string;
        industryRiskSegment?:
          | "Very Low"
          | "Low"
          | "Medium"
          | "High"
          | "Very High"
          | "Severe";
        // metrics - optional, can be present in either snake_case or camelCase depending on source
  final_pd?: number;
  pdScore?: number;
  pd_score?: number;
        cpv?: number;
        cpv_score?: number;
        tpv?: number;
        tpv_score?: number;
        collateral?: number;
        collateral_score?: number;
        industryADD?: number;
        industry_add?: number;
        lgd?: number;
        lgd_rate?: number;
      },
      itemId: string
    ): MerchantWatchlistItem => {
      const frequencyColorScheme = getFrequencyColorScheme(
        data.monitoringFrequency
      );
      const colorClasses = getColorClasses(frequencyColorScheme);
      const textColorClass = getTextColorClass(frequencyColorScheme);

      return {
        itemID: itemId,
        title: (
          // CIN moved in with the other bubble tags on the right, so the name
          // gets the width back instead of being crunched by a fixed column.
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <BubbleTag
              text={data.status || "Active"}
              color={data.status === "Inactive" ? "red" : "green"}
              fixedWidth={80}
            />
            <span className={`text-base font-semibold ${textColorClass} min-w-0`}>
              {data.merchantName}
            </span>
            {/* {conglomerateMapping[data.merchantName] && (
            <BubbleTag
              text={conglomerateMapping[data.merchantName]}
              color="blueTextWhiteBg"
              withBorder={true}
            />
          )} */}
          </div>
        ),
        subtitle: undefined,
        mainContent: undefined,
        bottomLeftContent: undefined,
        bottomRightContent: undefined,
        topRightContent: (
          <div className="flex items-center gap-2">
            <BubbleTag
              text={`CIN ${data.cin || "N/A"}`}
              color="grayTextWhiteBg"
              withBorder={true}
            />
            <BubbleTag
              text={
                data.industryRiskSegment
                  ? `${data.industry || "Unknown Industry"} - ${
                      data.industryRiskSegment === "Severe"
                        ? "Very High"
                        : data.industryRiskSegment
                    } Risk`
                  : data.industry || "Unknown Industry"
              }
              color={
                data.industryRiskSegment
                  ? getRiskColorScheme(data.industryRiskSegment)
                  : "blueTextWhiteBg"
              }
              withBorder={!data.industryRiskSegment}
              // fixedWidth={320}
            />
            <BubbleTag
              text={`PD Score ${formatFinalPdValue(data.final_pd )}`}
              color="yellowTextWhiteBg"
              withBorder={true}
              fixedWidth={120}
            />
            <BubbleTag
              text={data.monitoringFrequency}
              color={frequencyColorScheme}
              fixedWidth={80}
            />
            {isAdmin && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setEditMerchant({
                      ...data,
                      industry: data.industry || "Industry N/A",
                      merchantId: data.mid,
                      pdScore: getMetricNumber(data, "final_pd"),
                    });
                }}
                className="cursor-pointer"
              >
                <BubbleTag
                  text="Edit"
                  color="blueTextWhiteBg"
                  hasInsideIcon={true}
                  icon={<PenLine className="h-3.5 w-3.5" />}
                  onHover={true}
                  withBorder={true}
                  fixedWidth={80}
                />
              </div>
            )}
          </div>
        ),
        rightMainIcon: ChevronRight,
        originalData: {
          merchantName: data.merchantName,
          merchantId: data.mid,
          mid: data.mid,
          cin: data.cin,
          monitoringFrequency: data.monitoringFrequency,
          status: data.status || "Active",
          industry: data.industry || "Industry N/A",
          industryRiskSegment: data.industryRiskSegment,
          // Normalize numeric metrics using helper: prefer final_pd
          final_pd: getMetricNumber(data, "final_pd"),
          pdScore: getMetricNumber(data, "final_pd"),
          pd_score: getMetricNumber(data, "final_pd"),
          cpv: getMetricNumber(data, "cpv", "cpv_score"),
          cpv_score: getMetricNumber(data, "cpv_score", "cpv"),
          tpv: getMetricNumber(data, "tpv", "tpv_score"),
          tpv_score: getMetricNumber(data, "tpv_score", "tpv"),
          collateral: getMetricNumber(data, "collateral", "collateral_score"),
          collateral_score: getMetricNumber(
            data,
            "collateral_score",
            "collateral"
          ),
          industryAdd: getMetricNumber(data, "industryADD", "industry_add"),
          industry_add: getMetricNumber(data, "industry_add", "industryADD"),
          lgd: getMetricNumber(data, "lgd", "lgd_rate"),
          lgd_rate: getMetricNumber(data, "lgd_rate", "lgd"),
          addedDate: data.addedDate,
          lastUpdatedDate: data.lastUpdatedDate,
        } as unknown as WatchlistMerchantData,
        themeColor: colorClasses,
      };
    },
    [isAdmin]
  );

  const [watchlistItems, setWatchlistItems] = useState<MerchantWatchlistItem[]>(
    []
  );

  // Get unique industries from watchlist items for filter options
  const industryOptions = useMemo(() => {
    const uniqueIndustries = Array.from(
      new Set(
        watchlistItems
          .map((item) => item.originalData.industry)
          .filter((industry) => industry && industry !== "Industry N/A")
      )
    ).sort();

    return uniqueIndustries.map((industry) => ({
      value: industry,
      label: industry,
    }));
  }, [watchlistItems]);

  // Sorted watchlist items based on current sort state
  const sortedWatchlistItems = useMemo(() => {
    // If no sort field is selected, return items in their current state (without additional sorting)
    if (!currentSortField) return watchlistItems;

    const sortField = sortFields.find((f) => f.key === currentSortField);
    if (sortField && sortField.sortFunction) {
      // Create a new array and sort it
      const sorted = [...watchlistItems].sort((a, b) => {
        const result = sortField.sortFunction!(a, b);
        return currentSortDirection === "desc" ? -result : result;
      });
      return sorted;
    }

    return watchlistItems;
  }, [watchlistItems, currentSortField, currentSortDirection, sortFields]);

  // Fetch merchant list when organization ID changes (in parallel, not blocking)
  useEffect(() => {
    if (organizationId && merchantIdList.length === 0) {
      fetchMerchantIdList();
    }
  }, [organizationId, merchantIdList.length, fetchMerchantIdList]);

  // Process watchlist data - fetch immediately when organizationId is available
  // Don't wait for merchantIdList since watchlist API already includes merchant_info
  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!organizationId) return;

      setIsWatchlistLoading(true);
      try {
        const result = await watchlistService.getOrganizationWatchlist(
          organizationId
        );
        if (!result.success || !result.data) {
          setIsWatchlistLoading(false);
          return;
        }

        // Use merchant_info from watchlist API response directly (no need to wait for merchantIdList)
  const processedItems: MerchantWatchlistItem[] = result.data.map((watchlistItem: WatchlistItem) => {
          // Use merchant_info from API response, fallback to merchantIdList if available
          const merchantInfo = watchlistItem.merchant_info;
          const merchantFromList = merchantIdList.find(
            (m) => m.id === watchlistItem.merchant_id
          );

          return createWatchlistItem(
            {
              merchantName: merchantInfo?.legal_name || merchantFromList?.legalName || "Unknown Merchant",
              mid: watchlistItem.merchant_id,
              cin: merchantInfo?.cin || merchantFromList?.cin || undefined,
              monitoringFrequency:
                watchlistItem.frequency_to_refresh_probedata || "Monthly",
              addedDate: watchlistItem.watchlist_added_date.split("T")[0],
              lastUpdatedDate: watchlistItem.updated_at
                ? watchlistItem.updated_at.split("T")[0]
                : undefined,
              status: watchlistItem.is_active ? "Active" : "Inactive",
              industry: watchlistItem.industry,
              industryRiskSegment: watchlistItem.risk_segment as
                | "Very Low"
                | "Low"
                | "Medium"
                | "High"
                | "Very High"
                | "Severe"
                | undefined,
              // metrics from watchlist API (normalized via getMetricNumber)
              final_pd: getMetricNumber(
                watchlistItem as unknown as Record<string, unknown>,
                "final_pd"
              ),
              cpv_score: getMetricNumber(
                watchlistItem as unknown as Record<string, unknown>,
                "cpv_score",
                "cpv"
              ),
              tpv_score: getMetricNumber(
                watchlistItem as unknown as Record<string, unknown>,
                "tpv_score",
                "tpv"
              ),
              collateral_score: getMetricNumber(
                watchlistItem as unknown as Record<string, unknown>,
                "collateral_score",
                "collateral"
              ),
              lgd_rate: getMetricNumber(
                watchlistItem as unknown as Record<string, unknown>,
                "lgd_rate",
                "lgd"
              ),
              industry_add: getMetricNumber(
                watchlistItem as unknown as Record<string, unknown>,
                "industry_add",
                "industryADD"
              ),
            },
            watchlistItem.id
          );
        });

        // Sort by monitoring frequency then alphabetically by name
        const sortedItems = processedItems.sort((a, b) => {
          const frequencyOrder = { Daily: 0, Weekly: 1, Monthly: 2 };
          const frequencyComparison =
            frequencyOrder[a.originalData.monitoringFrequency] -
            frequencyOrder[b.originalData.monitoringFrequency];
          if (frequencyComparison !== 0) {
            return frequencyComparison;
          }
          return a.originalData.merchantName.localeCompare(
            b.originalData.merchantName
          );
        });

        setWatchlistItems(sortedItems);
      } catch (error) {
        console.error("Failed to fetch watchlist:", error);
      } finally {
        setIsWatchlistLoading(false);
      }
    };

    fetchWatchlist();
    // Note: merchantIdList is intentionally not in dependencies to avoid re-fetching
    // We use merchant_info from API response as primary source, merchantIdList as fallback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, createWatchlistItem]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [editMerchant, setEditMerchant] = useState<
    MerchantWatchlistItem["originalData"] | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Reset search when closing dropdown
  useEffect(() => {
    if (!isAddDialogOpen) {
      setSearchQuery("");
      setIsDropdownOpen(false);
    }
  }, [isAddDialogOpen]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isDropdownOpen &&
        !(event.target as HTMLElement).closest(".merchant-dropdown")
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Filter functions

  const frequencyFilterFunction = (
    item: CustomListItemProps,
    selectedValues: string[]
  ) => {
    if (selectedValues.length === 0) return true;
    const merchantItem = item as MerchantWatchlistItem;
    return selectedValues.includes(
      merchantItem.originalData.monitoringFrequency
    );
  };

  const statusFilterFunction = (
    item: CustomListItemProps,
    selectedValues: string[]
  ) => {
    if (selectedValues.length === 0) return true;
    const merchantItem = item as MerchantWatchlistItem;
    return selectedValues.includes(merchantItem.originalData.status);
  };

  const industryFilterFunction = (
    item: CustomListItemProps,
    selectedValues: string[]
  ) => {
    if (selectedValues.length === 0) return true;
    const merchantItem = item as MerchantWatchlistItem;
    return selectedValues.includes(merchantItem.originalData.industry);
  };

  const riskSegmentFilterFunction = (
    item: CustomListItemProps,
    selectedValues: string[]
  ) => {
    if (selectedValues.length === 0) return true;
    const merchantItem = item as MerchantWatchlistItem;
    if (!merchantItem.originalData.industryRiskSegment) return false;

    // Treat 'Severe' as 'Very High' for filtering
    const riskSegment =
      merchantItem.originalData.industryRiskSegment === "Severe"
        ? "Very High"
        : merchantItem.originalData.industryRiskSegment;

    return selectedValues.includes(riskSegment);
  };

  const searchFilterFunction = (
    item: CustomListItemProps,
    selectedValues: string[]
  ) => {
    const query = selectedValues[0] || "";
    if (!query.trim()) return true;

    const merchantItem = item as MerchantWatchlistItem;
    const searchQuery = query.toLowerCase();
    return (
      merchantItem.originalData.merchantName
        .toLowerCase()
        .includes(searchQuery) ||
      merchantItem.originalData.mid.toLowerCase().includes(searchQuery) ||
      merchantItem.originalData.monitoringFrequency
        .toLowerCase()
        .includes(searchQuery)
    );
  };

  const handleAddToWatchlist = async (data: {
    merchant_id: string;
    frequency_to_refresh_probedata: "Monthly" | "Weekly" | "Daily";
    frequency_to_refresh_external_insights: "Monthly" | "Weekly" | "Daily";
    frequency_to_refresh_annual_report: "Yearly";
    is_active: boolean;
  }) => {
    if (!organizationId) {
      console.error("No organization ID available");
      return;
    }

    setIsAddingToWatchlist(true);
    try {
      const result = await watchlistService.addToWatchlist({
        organization_id: organizationId,
        merchant_id: data.merchant_id,
        frequency_to_refresh_probedata: data.frequency_to_refresh_probedata,
        frequency_to_refresh_external_insights:
          data.frequency_to_refresh_external_insights,
        frequency_to_refresh_annual_report:
          data.frequency_to_refresh_annual_report,
      });

      if (result.success) {
        // Find the merchant from merchantIdList
        const merchant = merchantIdList.find((m) => m.id === data.merchant_id);
        if (!merchant) {
          console.error("Merchant not found in list");
          return;
        }

        // Add the new item to the UI
        const newItemId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${data.merchant_id}`;
        const newItem = createWatchlistItem(
          {
            merchantName: merchant.legalName,
            mid: data.merchant_id,
            monitoringFrequency: data.frequency_to_refresh_probedata,
            addedDate: new Date().toISOString().split("T")[0],
            lastUpdatedDate: new Date().toISOString().split("T")[0],
            status: data.is_active ? "Active" : "Inactive",
            industry: "Industry N/A", // Default industry for new items
            industryRiskSegment: undefined, // Will be fetched later if available
            pdScore: 0, // Default PD score for new items
          },
          newItemId
        );

        setWatchlistItems((prev) => {
          const updatedItems = [...prev, newItem];
          // Sort by monitoring frequency then alphabetically by name
          return updatedItems.sort((a, b) => {
            const frequencyOrder = { Daily: 0, Weekly: 1, Monthly: 2 };
            const frequencyComparison =
              frequencyOrder[a.originalData.monitoringFrequency] -
              frequencyOrder[b.originalData.monitoringFrequency];
            if (frequencyComparison !== 0) {
              return frequencyComparison;
            }
            return a.originalData.merchantName.localeCompare(
              b.originalData.merchantName
            );
          });
        });
        setIsAddDialogOpen(false);
      } else {
        console.error("Failed to add to watchlist:", result.error);
      }
    } catch (error) {
      console.error("Error adding to watchlist:", error);
    } finally {
      setIsAddingToWatchlist(false);
    }
  };

  const { navigateToMerchantInsolvency } = useMerchantNavigation();

  const handleItemClick = (item: CustomListItemProps) => {
    const merchantItem = item as MerchantWatchlistItem;
    console.log("Clicked merchant:", merchantItem.originalData);
    navigateToMerchantInsolvency(merchantItem.originalData.mid, { cin: merchantItem.originalData.cin });
  };

  const handleEditSave = useCallback(
    async (updates: {
      monitoringFrequency: "Daily" | "Weekly" | "Monthly";
      industry?: string;
      industryId?: string;
    }): Promise<void> => {
      if (!editMerchant || !organizationId) return;

      setIsUpdatingFrequency(true);
      try {
        // Update frequency
        const frequencyResult = await watchlistService.updateFrequency(
          organizationId,
          editMerchant.mid,
          {
            frequency_to_refresh_probedata: updates.monitoringFrequency,
            frequency_to_refresh_external_insights: updates.monitoringFrequency,
            frequency_to_refresh_annual_report: "Yearly",
          }
        );

        // Update industry if provided
        let industryResult = {
          success: true,
          error: null as string | null,
          data: null,
        };
        if (updates.industryId) {
          industryResult = await watchlistService.changeMerchantIndustry(
            editMerchant.mid,
            { industry_id: updates.industryId }
          );
        }

        if (frequencyResult.success && industryResult.success) {
          setWatchlistItems((prevItems) => {
            const updatedItems = prevItems.map((item) => {
              if (item.originalData.mid === editMerchant.mid) {
                const updatedData = {
                  ...item.originalData,
                  monitoringFrequency: updates.monitoringFrequency,
                  industry:
                    updates.industry ||
                    item.originalData.industry ||
                    "Industry N/A",
                  industryRiskSegment: item.originalData.industryRiskSegment,
                  merchantId: item.originalData.mid,
                  pdScore: item.originalData.pdScore,
                  lastUpdatedDate: new Date().toISOString().split("T")[0],
                };
                return createWatchlistItem(updatedData, item.itemID);
              }
              return item;
            });

            // Sort by monitoring frequency then alphabetically by name
            return updatedItems.sort((a, b) => {
              const frequencyOrder = { Daily: 0, Weekly: 1, Monthly: 2 };
              const frequencyComparison =
                frequencyOrder[a.originalData.monitoringFrequency] -
                frequencyOrder[b.originalData.monitoringFrequency];
              if (frequencyComparison !== 0) {
                return frequencyComparison;
              }
              return a.originalData.merchantName.localeCompare(
                b.originalData.merchantName
              );
            });
          });
          setEditMerchant(null);
        } else {
          console.error(
            "Failed to update:",
            !frequencyResult.success
              ? frequencyResult.error
              : industryResult.error
          );
          throw new Error(
            !frequencyResult.success
              ? frequencyResult.error || "Failed to update frequency"
              : industryResult.error || "Failed to update industry"
          );
        }
      } catch (error) {
        console.error("Error updating merchant:", error);
        throw error; // Re-throw so the dialog can handle the error state
      } finally {
        setIsUpdatingFrequency(false);
      }
    },
    [editMerchant, organizationId, createWatchlistItem]
  );

  // helper to fetch numeric metric from a variety of keys
  function getMetricNumber<T extends Record<string, unknown>>(
    obj: T,
    ...keys: string[]
  ): number {
    for (const k of keys) {
      if (k in obj) {
        const v = obj[k as keyof T];
        if (typeof v === "number") return v as number;
        if (typeof v === "string" && v.trim() !== "") {
          const n = Number(v as unknown as string);
          if (!Number.isNaN(n)) return n;
        }
      }
    }
    return 0;
  }

  function formatFinalPdValue(value: unknown): string {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === "string") {
      const v = value.trim();
      if (v === "") return "N/A";
      if (/^(NA|N\/A)$/i.test(v)) return "N/A";
      const n = Number(v);
      if (!Number.isNaN(n)) return `${n.toFixed(2)}%`;
      return v;
    }
    if (typeof value === "number") return `${value.toFixed(2)}%`;
    return "N/A";
  }

  return (
    <motion.div
      className="w-full min-w-0 px-2 pb-2"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
    >
      {/* Section Header */}
      <motion.div className="mb-4">
        <SectionHeaderWithFlags
          title="Merchant Watchlist"
          icon={Eye}
          positiveFlags={[]}
          negativeFlags={[]}
          mildPositiveFlags={[]}
          titleColorClass="text-blue-700"
          iconColorClass="text-blue-700"
          allowCollapse={false}
          initialRowLimit={5}
        />
      </motion.div>

      {/* Add to Watchlist Dialog */}
      <AddToWatchlistDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        availableMerchants={merchantIdList.filter(
          (merchant) =>
            !watchlistItems.some(
              (item) => item.originalData.mid === merchant.id
            )
        )}
        onSubmit={handleAddToWatchlist}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <CustomList
        items={sortedWatchlistItems}
        searchFields={["title", "subtitle"]}
        onItemClick={handleItemClick}
        showTimeline={false}
        disableInternalSorting={true}
        showToggleOptionCounts={true}
        initialRowLimit={200}
        animationDuration={0} // Disabled animations - show all merchants instantly
        loading={
          isProfileLoading ||
          isWatchlistLoading ||
          isAddingToWatchlist ||
          isUpdatingFrequency
        }
        loaderSpecs={{
          size: "lg",
          color: "blue",
          type: "spinner",
          text: isProfileLoading
            ? "Loading profile..."
            : isWatchlistLoading
            ? "Loading watchlist..."
            : isAddingToWatchlist
            ? "Adding to watchlist..."
            : isUpdatingFrequency
            ? "Updating frequency..."
            : "Loading...",
          textColor: "blue",
        }}
        primaryFilterGroup={[
          {
            id: "frequency",
            label: "Monitoring Frequency",
            type: "togglebuttons",
            options: monitoringFrequencyOptions,
            selectedValues: [],
            onFilterChange: () => {},
            filterFunction: frequencyFilterFunction,
            showLabel: true,
            actionElements: (
              <div className="flex gap-2 items-center">
                <SortActionButton
                  sortFields={sortFields}
                  currentSortField={currentSortField}
                  currentSortDirection={currentSortDirection}
                  onSortChange={handleSortChange}
                  color="blueTextWhiteBg"
                  border={true}
                />
                {isSidebarCollapsed && (
                  <>
                    <DownloadActionButton
                      items={sortedWatchlistItems}
                      fields={exportFields}
                      listTitle="Merchant Watchlist"
                      color="blueTextWhiteBg"
                      border={true}
                      className="px-5"
                    />
                    {isAdmin && (
                      <ActionButton
                        id="add-to-watchlist"
                        text="Add to Watchlist"
                        icon={Plus}
                        color="blueTextWhiteBg"
                        onClick={() => setIsAddDialogOpen(true)}
                        border={true}
                        className="px-5"
                      />
                    )}
                  </>
                )}
              </div>
            ),
          },
          {
            id: "status",
            label: "Status",
            type: "togglebuttons",
            options: statusOptions,
            selectedValues: [],
            onFilterChange: () => {},
            filterFunction: statusFilterFunction,
            showLabel: true,
          },
        ]}
        secondaryFilterGroups={[
          {
            id: "industry",
            label: "Industry",
            type: "multiselect",
            // Grows into whatever the row has left, capped so it never gets
            // absurdly wide. It cannot push siblings now that a capped group no
            // longer claims a full-row flex basis.
            maxWidth: "600px",
            options: industryOptions,
            selectedValues: [],
            onFilterChange: () => {},
            filterFunction: industryFilterFunction,
            showLabel: true,
          },
          {
            id: "risk",
            label: "Industry Risk",
            type: "togglebuttons",
            options: riskSegmentOptions,
            selectedValues: [],
            onFilterChange: () => {},
            filterFunction: riskSegmentFilterFunction,
            showLabel: true,
            actionElements: isSidebarCollapsed && isAdmin ? (
              <div className="flex gap-2 items-center">
                <ActionButton
                  id="reset-to-default"
                  text="Reset to Default"
                  icon={RotateCcw}
                  color="orange"
                  onClick={() => {
                    // TODO: Add reset functionality
                    console.log("Reset to default clicked");
                  }}
                  border={true}
                  className="px-5"
                />
              </div>
            ) : undefined,
          },
        ]}
        tertiaryFilterGroups={[
          {
            id: "search",
            label: "Search",
            type: "searchbar",
            // With the sidebar open the export buttons share this row, so cap the
            // search and leave room for them; collapsed it has the row to itself.
            maxWidth: isSidebarCollapsed ? undefined : "calc(100% - 660px)",
            options: [],
            selectedValues: [],
            onFilterChange: () => {},
            filterFunction: searchFilterFunction,
            showLabel: false,
            searchPlaceholder: "Search by merchant name, MID, frequency...",
            onSearchChange: () => {},
            actionElements: isSidebarCollapsed ? undefined : (
              <div className="flex gap-2 items-center">
                <DownloadActionButton
                  items={sortedWatchlistItems}
                  fields={exportFields}
                  listTitle="Merchant Watchlist"
                  color="blueTextWhiteBg"
                  border={true}
                  className="px-5"
                />
                {isAdmin && (
                  <>
                    <ActionButton
                      id="add-to-watchlist"
                      text="Add to Watchlist"
                      icon={Plus}
                      color="blueTextWhiteBg"
                      onClick={() => setIsAddDialogOpen(true)}
                      border={true}
                      className="px-5"
                    />
                    <ActionButton
                      id="reset-to-default"
                      text="Reset to Default"
                      icon={RotateCcw}
                      color="orange"
                      onClick={() => {
                        // TODO: Add reset functionality
                        console.log("Reset to default clicked");
                      }}
                      border={true}
                      className="px-5"
                    />
                  </>
                )}
              </div>
            ),
          },
        ]}
        emptyState={{
          icon: Eye,
          title: "No merchants in watchlist",
          description: "Add merchants to start monitoring their activities.",
        }}
      />

      {/* Edit Merchant Dialog */}
      {editMerchant && (
        <EditMerchantDialog
          isOpen={!!editMerchant}
          onClose={() => setEditMerchant(null)}
          merchant={editMerchant}
          onSave={handleEditSave}
        />
      )}
    </motion.div>
  );
};

export default MerchantWatchlistTab;
