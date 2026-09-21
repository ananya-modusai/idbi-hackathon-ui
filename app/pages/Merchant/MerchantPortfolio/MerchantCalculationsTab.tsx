"use client";

import { FC, useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calculator,
  Plus,
  TrendingDown,
  Search,
  X,
  Users,
  DollarSign,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Download,
  Edit,
  Trash,
} from "lucide-react";
import { SectionHeaderWithFlags } from "@/components/custom/SectionHeaderWithFlags";
import { CustomTableView, Column } from "@/components/custom/CustomTableView";
import { StatCard } from "@/components/custom/StatCard";
import { ActionButton } from "@/components/custom/ActionButton";
import { colorSchemes } from "@/components/custom/CustomColorScheme";
import { AddMerchantDialog } from "./AddMerchantDialog";
import { merchantService } from "@/app/services/merchantServices";
import { useRiskMetricsStore } from "@/app/store/merchant/riskMetricsStore";
import { industryService } from "@/app/services/industryServices";
import { API } from "@/app/services/axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useProfileStore } from "@/app/store/authentication/profileStore";
import { watchlistService } from "@/app/services/watchlistServices";
import { KeyMetrics } from "@/components/custom/KeyMetrics";

interface MerchantCalculationData {
  mid: string;
  cin: string;
  merchantName: string;
  runDate: string;
  cpvMonthly: number;
  tpvMonthly: number;
  collateral: number;
  lgd: number;
  add: number;
  gNdx: number;
  nNdx: number;
  var: number;
  settlementDays: number;
  eld: number;
  versionNo?: number;
  // ID of the risk_metrics record returned by the risk_metrics API
  metricId?: string;
}

const MerchantCalculationsTab: FC = () => {
  // Sample data - replace with actual API call
  const [calculationsData, setCalculationsData] = useState<
    MerchantCalculationData[]
  >([
    // Add sample data or fetch from API
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddingMerchant, setIsAddingMerchant] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMetricsExpanded, setIsMetricsExpanded] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const { organizationId } = useProfileStore();
  // Selection mode state - when true, the table will show checkboxes for each row
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedRows, setSelectedRows] = useState<MerchantCalculationData[]>([]);
  // Edit mode state
  const [editingRow, setEditingRow] = useState<MerchantCalculationData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Normalize NA/NaN/null values to a single "N/A"
  const isNAValue = (value: any) =>
    value === null ||
    value === undefined ||
    (typeof value === "number" && Number.isNaN(value)) ||
    (typeof value === "string" && /^(na|n\/a)$/i.test(value.trim()));

  // Format number with commas and 2 decimal places
  const formatNumber = (value: number | string | null | undefined): string => {
    if (isNAValue(value)) return "N/A";
    const num = Number(value);
    if (Number.isNaN(num)) return "N/A";
    return num.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Format number with commas and no decimal places (for VaR)
  const formatNumberNoDecimal = (
    value: number | string | null | undefined
  ): string => {
    if (isNAValue(value)) return "N/A";
    const num = Number(value);
    if (Number.isNaN(num)) return "N/A";
    return Math.round(num).toLocaleString("en-IN");
  };

  // Format number with commas and 1 decimal place (for Settlement Days)
  const formatNumberOneDecimal = (
    value: number | string | null | undefined
  ): string => {
    if (isNAValue(value)) return "N/A";
    const num = Number(value);
    if (Number.isNaN(num)) return "N/A";
    return num.toLocaleString("en-IN", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
  };

  // Filter data based on search query
  const filteredCalculationsData = useMemo(() => {
    if (!searchQuery.trim()) return calculationsData;
    const query = searchQuery.toLowerCase();
    return calculationsData.filter(
      (item) =>
        item.cin?.toLowerCase().includes(query) ||
        item.merchantName?.toLowerCase().includes(query)
    );
  }, [calculationsData, searchQuery]);

  // Calculate metrics
  const totalVaR = useMemo(() => {
    return calculationsData.reduce((sum, item) => sum + (item.var || 0), 0);
  }, [calculationsData]);

  const totalTPV = useMemo(() => {
    return calculationsData.reduce(
      (sum, item) => sum + (item.tpvMonthly || 0),
      0
    );
  }, [calculationsData]);

  const totalELD = useMemo(() => {
    return calculationsData.reduce((sum, item) => sum + (item.eld || 0), 0);
  }, [calculationsData]);

  const avgSettlementDays = useMemo(() => {
    if (calculationsData.length === 0) return 0;
    const sum = calculationsData.reduce(
      (sum, item) => sum + (item.settlementDays || 0),
      0
    );
    return sum / calculationsData.length;
  }, [calculationsData]);

  const totalNetNDX = useMemo(() => {
    return calculationsData.reduce((sum, item) => sum + (item.nNdx || 0), 0);
  }, [calculationsData]);

  // Prepare metrics for KeyMetrics component
  const keyMetricsData = useMemo(() => {
    return [
      {
        label: "Merchants / Total TPV",
        value: `${calculationsData.length} / ${formatNumberNoDecimal(totalTPV)}`,
        icon: `<Users className="h-5 w-5 text-blue-500" />`,
      },
      {
        label: "Total VaR",
        value: `₹${formatNumberNoDecimal(totalVaR)}`,
        icon: `<AlertTriangle className="h-5 w-5 text-red-500" />`,
      },
      {
        label: "Total ELD",
        value: `₹${formatNumberNoDecimal(totalELD)}`,
        icon: `<TrendingDown className="h-5 w-5 text-orange-500" />`,
      },
      {
        label: "Avg Settlement Days",
        value: `T+${formatNumberOneDecimal(avgSettlementDays)}`,
        icon: `<Calendar className="h-5 w-5 text-purple-500" />`,
      },
      {
        label: "Total Net NDX",
        value: `₹${formatNumberNoDecimal(totalNetNDX)}`,
        icon: `<TrendingUp className="h-5 w-5 text-indigo-500" />`,
      },
    ];
  }, [
    calculationsData.length,
    totalTPV,
    totalVaR,
    totalELD,
    avgSettlementDays,
    totalNetNDX,
    formatNumberNoDecimal,
    formatNumberOneDecimal,
  ]);

  // Format date
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Handle edit button click
  const handleEditClick = (row: MerchantCalculationData) => {
    setEditingRow(row);
    setIsEditDialogOpen(true);
  };

  // Delete selected rows by calling the metrics DELETE endpoint for each selected metric
  const handleDeleteSelected = async () => {
    if (selectedRows.length === 0) {
      setIsSelectionMode(false);
      return;
    }

    const confirmed = window.confirm(
      `Delete ${selectedRows.length} selected merchant(s)? This cannot be undone.`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      // Call delete for each selected row that has a metricId
      const deleteResults = await Promise.allSettled(
        selectedRows.map(async (s) => {
          // Use metric_id from risk_metrics API response
          const metricId = String(s.metricId || "").trim();
          
          if (!metricId) {
            console.warn(
              `Skipping delete - missing metricId:`,
              { metricId, row: s }
            );
            throw new Error(`Missing metricId`);
          }

          console.log(
            `Deleting metric: metricId=${metricId}`
          );
          
          try {
            await merchantService.deleteMetrics(metricId);
            return { success: true, metricId };
          } catch (err: any) {
            console.error(
              `Failed to delete metric ${metricId}:`,
              err
            );
            // Re-throw to be caught by Promise.allSettled
            throw err;
          }
        })
      );

      // Check for any failures
      const failures = deleteResults.filter(
        (result) => result.status === "rejected"
      );
      if (failures.length > 0) {
        console.error(
          `Failed to delete ${failures.length} out of ${selectedRows.length} metrics`
        );
        // Still remove successfully deleted items from UI
        const successfulDeletes = deleteResults
          .filter((result) => result.status === "fulfilled")
          .map((result) => {
            if (result.status === "fulfilled") {
              return result.value;
            }
            return null;
          })
          .filter(Boolean) as Array<{ metricId: string }>;

        // Remove only successfully deleted rows from local state
        if (successfulDeletes.length > 0) {
          setCalculationsData((prev) =>
            prev.filter(
              (r) =>
                !successfulDeletes.some(
                  (s) =>
                    String(r.metricId) === s.metricId
                )
            )
          );
        }

        // Show error message if some failed
        if (failures.length === selectedRows.length) {
          alert(
            `Failed to delete selected metrics. Please check the console for details.`
          );
        } else {
          alert(
            `Successfully deleted ${successfulDeletes.length} metric(s), but ${failures.length} failed. Please check the console for details.`
          );
        }
      } else {
        // All deletions succeeded - remove all selected rows from local state
        setCalculationsData((prev) =>
          prev.filter(
            (r) =>
              !selectedRows.some(
                (s) =>
                  String(r.metricId) === String(s.metricId)
              )
          )
        );
      }

      setSelectedRows([]);
      setIsSelectionMode(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Define table columns
  const columns: Column[] = [
    {
      key: "edit",
      header: "",
      sortable: false,
      width: "40px",
      minWidth: "40px",
      align: "center",
      render: (value: any, row: Record<string, any>) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleEditClick(row as MerchantCalculationData);
          }}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Edit"
        >
          <Edit className="h-4 w-4 text-gray-600" />
        </button>
      ),
    },
    {
      key: "srNo",
      header: "Sr. No.",
      sortable: false,
      minWidth: "80px",
      render: (value: any, row: Record<string, any>) => {
        // Calculate row number based on filtered data
        const rowIndex = filteredCalculationsData.findIndex(
          (item) => item.mid === (row as MerchantCalculationData).mid
        );
        return <span>{rowIndex >= 0 ? rowIndex + 1 : ""}</span>;
      },
    },
    {
      key: "merchantName",
      header: "Company Name",
      sortable: true,
      minWidth: "200px",
      render: (value: any) => <span>{value || "N/A"}</span>,
    },
    {
      key: "cin",
      header: "CIN",
      sortable: true,
      minWidth: "150px",
      render: (value: any) => (
        <span className="font-medium">{value || "N/A"}</span>
      ),
    },
    {
      key: "runDate",
      header: "Run Date",
      sortable: true,
      minWidth: "120px",
      render: (value: any) => (
        <span className="break-words">{formatDate(value)}</span>
      ),
    },
    {
      key: "cpvMonthly",
      header: "CPV Monthly",
      sortable: true,
      minWidth: "120px",
      render: (value: any) => (
        <span className="break-words">{formatNumberNoDecimal(value)}</span>
      ),
    },
    {
      key: "tpvMonthly",
      header: "TPV Monthly",
      sortable: true,
      minWidth: "120px",
      render: (value: any) => (
        <span className="break-words">{formatNumberNoDecimal(value)}</span>
      ),
    },
    {
      key: "collateral",
      header: "Collateral",
      sortable: true,
      minWidth: "120px",
      render: (value: any) => (
        <span className="break-words">{formatNumberNoDecimal(value)}</span>
      ),
    },
    {
      key: "lgd",
      header: "LGD",
      sortable: true,
      minWidth: "100px",
      render: (value: any) => (
        <span>{formatNumber(value) === "N/A" ? "N/A" : `${formatNumber(value)}%`}</span>
      ),
    },
    {
      key: "add",
      header: "ADD",
      sortable: true,
      minWidth: "100px",
      render: (value: any) => <span>{formatNumber(value)}</span>,
    },
    {
      key: "gNdx",
      header: "Gross-NDX",
      sortable: true,
      minWidth: "120px",
      render: (value: any) => (
        <span className="break-words">{formatNumberNoDecimal(value)}</span>
      ),
    },
    {
      key: "nNdx",
      header: "Net-NDX",
      sortable: true,
      minWidth: "120px",
      render: (value: any) => (
        <span className="break-words">{formatNumberNoDecimal(value)}</span>
      ),
    },
    {
      key: "var",
      header: "VaR",
      sortable: true,
      minWidth: "120px",
      render: (value: any) => (
        <span className="font-semibold break-words">
          {formatNumberNoDecimal(value)}
        </span>
      ),
    },
    {
      key: "settlementDays",
      header: "Settlement Days (T+x)",
      sortable: true,
      minWidth: "160px",
      render: (value: any) => <span>T+{formatNumberOneDecimal(value)}</span>,
    },
    {
      key: "eld",
      header: "ELD",
      sortable: true,
      minWidth: "120px",
      render: (value: any) => (
        <span className="break-words">{formatNumberNoDecimal(value)}</span>
      ),
    },
  ];

  const handleAddMerchant = () => {
    setIsAddDialogOpen(true);
  };

  // Download CSV handler
  const handleDownloadCSV = () => {
    // Extract headers from columns (excluding edit column)
    const headers = columns
      .filter((column) => column.key !== "edit")
      .map((column) => {
        if (typeof column.header === "string") {
          return column.header;
        } else {
          return column.key;
        }
      });

    // Create CSV header row
    let csvContent = headers.join(",") + "\n";

    // Add data rows using filtered data
    filteredCalculationsData.forEach((row, index) => {
      const csvRow = columns
        .filter((column) => column.key !== "edit") // Exclude edit column from CSV
        .map((column) => {
          // Handle Sr. No. column specially
          if (column.key === "srNo") {
            return String(index + 1);
          }

          let cellValue = (row as any)?.[column.key];

          // Handle different value types
          if (cellValue === null || cellValue === undefined) {
            return "";
          }

          // Format values based on column key to match table display
          if (column.key === "var") {
            cellValue = formatNumberNoDecimal(cellValue);
          } else if (column.key === "settlementDays") {
            cellValue = `T+${formatNumberOneDecimal(cellValue)}`;
          } else if (column.key === "runDate") {
            cellValue = formatDate(cellValue);
          } else if (
            [
              "cpvMonthly",
              "tpvMonthly",
              "collateral",
              "add",
              "gNdx",
              "nNdx",
              "eld",
            ].includes(column.key)
          ) {
            cellValue = formatNumber(cellValue);
          } else if (column.key === "lgd") {
            cellValue = `${formatNumber(cellValue)}%`;
          }

          // Convert to string and escape quotes
          const stringValue = String(cellValue).replace(/"/g, '""');

          // Wrap in quotes if contains comma, newline or quotes
          return /[,\n"]/.test(stringValue) ? `"${stringValue}"` : stringValue;
        })
        .join(",");

      csvContent += csvRow + "\n";
    });

    // Download the CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const filename = "merchant_calculations.csv";

    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Fetch risk_metrics data when component mounts
  useEffect(() => {
    const fetchRiskMetricsData = async () => {
      setIsLoadingData(true);
      try {
        // Fetch all risk_metrics data
        const riskMetricsResponse = await API.get(
          `/api/v1/credit-insolvency/risk_metrics`
        );

        if (
          riskMetricsResponse.data?.success &&
          riskMetricsResponse.data?.data &&
          Array.isArray(riskMetricsResponse.data.data)
        ) {
          const riskMetricsList = riskMetricsResponse.data.data;

          // Fetch watchlist to get merchant details (CIN, name)
          let watchlistMap = new Map<string, any>();
          if (organizationId) {
            try {
              const watchlistResult = await watchlistService.getOrganizationWatchlist(
                organizationId
              );
              if (watchlistResult.success && watchlistResult.data) {
                watchlistResult.data.forEach((item: any) => {
                  watchlistMap.set(item.merchant_id, item);
                });
              }
            } catch (err) {
              console.warn("Failed to fetch watchlist:", err);
            }
          }

          // Process each merchant in risk_metrics
          const processedData = await Promise.all(
            riskMetricsList.map(async (item: any) => {
              const merchantId = item.merchant_id;
              const versionNo = item.version_no;

              // Get merchant details from watchlist
              const watchlistItem = watchlistMap.get(merchantId);
              const cin = watchlistItem?.merchant_info?.cin || "";
              const merchantName =
                watchlistItem?.merchant_info?.legal_name ||
                watchlistItem?.merchant_info?.trade_name ||
                "";

              // Fetch version to get runDate
              let runDate = "";
              try {
                const versionResponse = await merchantService.getMerchantVersions(
                  merchantId
                );
                if (
                  versionResponse.success &&
                  versionResponse.versions &&
                  Array.isArray(versionResponse.versions)
                ) {
                  const matchingVersion = versionResponse.versions.find(
                    (v: any) => v.version === versionNo
                  );
                  if (matchingVersion) {
                    runDate = matchingVersion.date;
                  } else if (versionResponse.versions.length > 0) {
                    // Fallback to first version if exact match not found
                    runDate = versionResponse.versions[0].date;
                  }
                }
              } catch (err) {
                console.warn(
                  `Failed to fetch versions for ${merchantId}:`,
                  err
                );
              }

              // Fetch getRiskMetrics to get LGD and ADD (after we know runDate so we can pass date)
              let lgdRate = 0;
              let addDays = 0;
              // Mirror Overview/ProbabilityOfDefault logic: prefer final_pd, then pd_score
              const apiPdFromRiskMetrics =
                (typeof item.final_pd === "number" ? item.final_pd : undefined) ??
                (typeof item.pd_score === "number" ? item.pd_score : undefined);
              let pdScore = apiPdFromRiskMetrics || 0;
              try {
                const params: { version_no?: string; date?: string } = {};
                if (versionNo) {
                  params.version_no = versionNo.toString();
                }
                if (runDate) {
                  params.date = runDate;
                }
                const getRiskMetricsResponse = await API.get(
                  `/api/v1/credit-insolvency/${merchantId}/getRiskMetrics`,
                  { params }
                );
                if (getRiskMetricsResponse.data?.data) {
                  const metricsData = getRiskMetricsResponse.data.data as any;
                  lgdRate = metricsData.lgd_rate || 0;
                  addDays = metricsData.add_days || 0;
                  // Use final_pd for calculations (same as Overview), fallback to pd_score
                  if (typeof metricsData.final_pd === "number") {
                    pdScore = metricsData.final_pd;
                  } else if (typeof metricsData.pd_score === "number") {
                    pdScore = metricsData.pd_score;
                  }
                }
              } catch (err) {
                console.warn(
                  `Failed to fetch getRiskMetrics for ${merchantId}:`,
                  err
                );
              }

              // Fetch industry ADD
              let industryAdd = addDays;
              try {
                const addValue = await industryService.getIndustryAdd(merchantId);
                if (addValue !== null) {
                  industryAdd = addValue;
                }
              } catch (err) {
                // Use company ADD as fallback
                industryAdd = addDays;
              }

              // Use the actual ADD value (prefer company ADD, same as PD section)
              const selectedADD = addDays > 0 ? addDays : industryAdd;

              // Get values from risk_metrics API
              const cpvDaily = item.cpv || 0;
              const tpvDaily = item.tpv || 0;
              const collateral = item.collateral || 0;

              // Calculate derived values using PD section formulas
              const grossNDX = cpvDaily * selectedADD;
              const netNDX = Math.max(0, grossNDX - collateral);
              const valueAtRisk = (netNDX * pdScore) / 100;
              const settlementDays = tpvDaily > 0 ? valueAtRisk / tpvDaily : 0;
              // ELD = N-NDX * LGD (LGD is stored as decimal 0..1 in getRiskMetrics)
              const expectedLoss = netNDX * lgdRate;

              return {
                mid: merchantId,
                cin: cin,
                merchantName: merchantName,
                runDate: runDate,
                cpvMonthly: cpvDaily,
                tpvMonthly: tpvDaily,
                collateral: collateral,
                lgd: lgdRate * 100, // Convert to percentage for display
                add: selectedADD,
                gNdx: grossNDX,
                nNdx: netNDX,
                var: valueAtRisk,
                settlementDays: settlementDays,
                eld: expectedLoss,
                versionNo: versionNo,
                metricId: item.id,
              } as MerchantCalculationData;
            })
          );

          setCalculationsData(processedData);
        }
      } catch (error) {
        console.error("Error fetching risk metrics data:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchRiskMetricsData();
  }, [organizationId]);

  // Prevent page scrolling when this tab is active
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyOverflowX = document.body.style.overflowX;
    const originalBodyOverflowY = document.body.style.overflowY;
    const originalBodyClass = document.body.className;

    // Prevent body scrolling
    document.body.style.overflow = "hidden";
    document.body.style.overflowX = "hidden";
    document.body.style.overflowY = "hidden";
    document.body.classList.add("calculations-tab-active");

    // Also prevent html scrolling
    const html = document.documentElement;
    const originalHtmlOverflow = html.style.overflow;
    const originalHtmlOverflowX = html.style.overflowX;
    const originalHtmlOverflowY = html.style.overflowY;
    const originalHtmlClass = html.className;
    html.style.overflow = "hidden";
    html.style.overflowX = "hidden";
    html.style.overflowY = "hidden";
    html.classList.add("calculations-tab-active");

    // Find and disable ScrollArea scrolling in parent
    const scrollAreas = document.querySelectorAll(
      "[data-radix-scroll-area-viewport]"
    );
    scrollAreas.forEach((area: any) => {
      if (
        area.closest(".calculations-tab-container") ||
        area.closest('[class*="calculations"]')
      ) {
        area.style.overflow = "hidden";
        area.style.overflowX = "hidden";
        area.style.overflowY = "hidden";
      }
    });

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.overflowX = originalBodyOverflowX;
      document.body.style.overflowY = originalBodyOverflowY;
      document.body.className = originalBodyClass;

      html.style.overflow = originalHtmlOverflow;
      html.style.overflowX = originalHtmlOverflowX;
      html.style.overflowY = originalHtmlOverflowY;
      html.className = originalHtmlClass;

      // Restore ScrollArea scrolling (query only active ones in the DOM)
      const currentScrollAreas = document.querySelectorAll(
        "[data-radix-scroll-area-viewport]"
      );
      currentScrollAreas.forEach((area: any) => {
        area.style.overflow = "";
        area.style.overflowX = "";
        area.style.overflowY = "";
      });
    };
  }, []);

  const handleAddMerchantSubmit = async (data: {
    merchantId: string;
    cin: string;
    merchantName: string;
    cpv: number;
    tpv: number;
    collateral: number;
    runDate: string;
    versionNo: number;
  }) => {
    setIsAddingMerchant(true);
    try {
      // First, fetch PD (prefer final_pd over pd_score) and LGD from getRiskMetrics API (same as PD section)
      let initialPdScore = 0;
      let initialLgdRate = 0;
      let addDays = 0;
      try {
        const params: { version_no?: string; date?: string } = {};
        if (data.versionNo) {
          params.version_no = data.versionNo.toString();
        }
        if (data.runDate) {
          params.date = data.runDate;
        }
        const getRiskMetricsResponse = await API.get(
          `/api/v1/credit-insolvency/${data.merchantId}/getRiskMetrics`,
          { params }
        );
        if (getRiskMetricsResponse.data?.data) {
          const metricsData = getRiskMetricsResponse.data.data as any;
          if (typeof metricsData.final_pd === "number") {
            initialPdScore = metricsData.final_pd;
          } else if (typeof metricsData.pd_score === "number") {
            initialPdScore = metricsData.pd_score;
          } else {
            initialPdScore = 0;
          }
          initialLgdRate = metricsData.lgd_rate || 0;
          addDays = metricsData.add_days || 0;
        }
      } catch (err) {
        console.warn(
          "Failed to fetch metrics from getRiskMetrics, will use 0:",
          err
        );
      }

      // Call risk_metrics API with GET request
      let pdScore = initialPdScore;
      let lgdRate = initialLgdRate;

      try {
        const riskMetricsParams: { merchant_id?: string; version_no?: string; date?: string } = {};
        if (data.merchantId) {
          riskMetricsParams.merchant_id = data.merchantId;
        }
        if (data.versionNo) {
          riskMetricsParams.version_no = data.versionNo.toString();
        }
        if (data.runDate) {
          riskMetricsParams.date = data.runDate;
        }
        
        const riskMetricsResponse = await API.get(
          `/api/v1/credit-insolvency/risk_metrics`,
          { params: riskMetricsParams }
        );

        // The API returns an array in data.data
        if (riskMetricsResponse.data?.success && riskMetricsResponse.data?.data && Array.isArray(riskMetricsResponse.data.data)) {
          // Find the matching merchant data
          const merchantData = riskMetricsResponse.data.data.find(
            (item: any) => item.merchant_id === data.merchantId && item.version_no === data.versionNo
          );
          
          if (merchantData) {
            // Mirror Overview/ProbabilityOfDefault logic: prefer final_pd, then pd_score
            const apiPd =
              (typeof merchantData.final_pd === "number" ? merchantData.final_pd : undefined) ??
              (typeof merchantData.pd_score === "number" ? merchantData.pd_score : undefined);
            // Prefer getRiskMetrics if it returned a non-zero PD, else use API PD
            pdScore = (initialPdScore || apiPd || 0) as number;
            // Overwrite LGD from getRiskMetrics API (as per requirement)
            lgdRate = initialLgdRate || 0;
            // Note: CPV, TPV, Collateral are from user input, not from API response
          }
        }
      } catch (err) {
        console.error("Failed to fetch risk metrics:", err);
        // Continue with initial values from getRiskMetrics
        pdScore = initialPdScore;
        lgdRate = initialLgdRate;
      }

      // Fetch industry ADD
      let industryAdd = addDays;
      try {
        const addValue = await industryService.getIndustryAdd(data.merchantId);
        if (addValue !== null) {
          industryAdd = addValue;
        }
      } catch (err) {
        console.warn("Failed to fetch industry ADD, using company ADD:", err);
        industryAdd = addDays;
      }

      // Use the actual ADD value (prefer company ADD, same as PD section)
      const selectedADD = addDays > 0 ? addDays : industryAdd;

      // Calculate derived values using the same formulas as ProbabilityOfDefault
      // Note: Assuming cpv and tpv are daily values (same as PD section uses cpvDaily and tpvDaily)
      const cpvDaily = data.cpv;
      const tpvDaily = data.tpv;
      const grossNDX = cpvDaily * selectedADD;
      const netNDX = Math.max(0, grossNDX - data.collateral); // Same as Overview/PD section
      // VAR = nNDX * (pd_score / 100) where pd_score is a percentage (e.g., 3.42 for 3.42%)
      const valueAtRisk = (netNDX * pdScore) / 100; // Value at Risk: nNDX * PD score (as percentage)
      const settlementDays = tpvDaily > 0 ? valueAtRisk / tpvDaily : 0; // T+X: VaR / TPV
      // ELD = N-NDX * LGD (LGD is stored as decimal 0..1 in getRiskMetrics)
      const expectedLoss = netNDX * lgdRate;

      // POST to risk_metrics API
      try {
        const riskMetricsPayload = {
          cpv: cpvDaily,
          tpv: tpvDaily,
          collateral: data.collateral,
          lgd: initialLgdRate, // Use LGD from getRiskMetrics API (decimal 0-1)
          version_no: data.versionNo,
        };

        await API.post(
          `/api/v1/credit-insolvency/${data.merchantId}/risk_metrics`,
          riskMetricsPayload
        );
      } catch (err) {
        console.error("Failed to POST risk_metrics:", err);
        // Continue with adding to local state even if API call fails
      }

        const newCalculation: MerchantCalculationData = {
        mid: data.merchantId,
        cin: data.cin,
        merchantName: data.merchantName,
        runDate: data.runDate,
        cpvMonthly: cpvDaily,
        tpvMonthly: tpvDaily,
        collateral: data.collateral,
        lgd: lgdRate * 100, // Convert to percentage
        add: selectedADD,
        gNdx: grossNDX,
        nNdx: netNDX,
        var: valueAtRisk,
        settlementDays: settlementDays,
        eld: expectedLoss,
        versionNo: data.versionNo,
      };

      setCalculationsData((prev) => [...prev, newCalculation]);
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Error adding merchant:", error);
    } finally {
      setIsAddingMerchant(false);
    }
  };

  const handleEditMerchantSubmit = async (data: {
    merchantId: string;
    cin: string;
    merchantName: string;
    cpv: number;
    tpv: number;
    collateral: number;
    runDate: string;
    versionNo: number;
  }) => {
    if (!editingRow) return;

    setIsAddingMerchant(true);
    try {
      // First, fetch PD (prefer final_pd over pd_score) and LGD from getRiskMetrics API (same as PD section)
      let initialPdScore = 0;
      let initialLgdRate = 0;
      let addDays = 0;
      try {
        const params: { version_no?: string; date?: string } = {};
        if (data.versionNo) {
          params.version_no = data.versionNo.toString();
        }
        if (data.runDate) {
          params.date = data.runDate;
        }
        const getRiskMetricsResponse = await API.get(
          `/api/v1/credit-insolvency/${data.merchantId}/getRiskMetrics`,
          { params }
        );
        if (getRiskMetricsResponse.data?.data) {
          const metricsData = getRiskMetricsResponse.data.data as any;
          if (typeof metricsData.final_pd === "number") {
            initialPdScore = metricsData.final_pd;
          } else if (typeof metricsData.pd_score === "number") {
            initialPdScore = metricsData.pd_score;
          } else {
            initialPdScore = 0;
          }
          initialLgdRate = metricsData.lgd_rate || 0;
          addDays = metricsData.add_days || 0;
        }
      } catch (err) {
        console.warn(
          "Failed to fetch metrics from getRiskMetrics, will use 0:",
          err
        );
      }

      // Call risk_metrics API with GET request
      let pdScore = initialPdScore;
      let lgdRate = initialLgdRate;

      try {
        const riskMetricsParams: { merchant_id?: string; version_no?: string; date?: string } = {};
        if (data.merchantId) {
          riskMetricsParams.merchant_id = data.merchantId;
        }
        if (data.versionNo) {
          riskMetricsParams.version_no = data.versionNo.toString();
        }
        if (data.runDate) {
          riskMetricsParams.date = data.runDate;
        }
        
        const riskMetricsResponse = await API.get(
          `/api/v1/credit-insolvency/risk_metrics`,
          { params: riskMetricsParams }
        );

        // The API returns an array in data.data
        if (riskMetricsResponse.data?.success && riskMetricsResponse.data?.data && Array.isArray(riskMetricsResponse.data.data)) {
          // Find the matching merchant data
          const merchantData = riskMetricsResponse.data.data.find(
            (item: any) => item.merchant_id === data.merchantId && item.version_no === data.versionNo
          );
          
          if (merchantData) {
            // Mirror Overview/ProbabilityOfDefault logic: prefer final_pd, then pd_score
            const apiPd =
              (typeof merchantData.final_pd === "number" ? merchantData.final_pd : undefined) ??
              (typeof merchantData.pd_score === "number" ? merchantData.pd_score : undefined);
            // Prefer getRiskMetrics if it returned a non-zero PD, else use API PD
            pdScore = (initialPdScore || apiPd || 0) as number;
            // Overwrite LGD from getRiskMetrics API (as per requirement)
            lgdRate = initialLgdRate || 0;
            // Note: CPV, TPV, Collateral are from user input, not from API response
          }
        }
      } catch (err) {
        console.error("Failed to fetch risk metrics:", err);
        // Continue with initial values from getRiskMetrics
        pdScore = initialPdScore;
        lgdRate = initialLgdRate;
      }

      // Fetch industry ADD
      let industryAdd = addDays;
      try {
        const addValue = await industryService.getIndustryAdd(data.merchantId);
        if (addValue !== null) {
          industryAdd = addValue;
        }
      } catch (err) {
        console.warn("Failed to fetch industry ADD, using company ADD:", err);
        industryAdd = addDays;
      }

      // Use the actual ADD value (prefer company ADD, same as PD section)
      const selectedADD = addDays > 0 ? addDays : industryAdd;

      // Calculate derived values using the same formulas as ProbabilityOfDefault
      // Note: Assuming cpv and tpv are daily values (same as PD section uses cpvDaily and tpvDaily)
      const cpvDaily = data.cpv;
      const tpvDaily = data.tpv;
      const grossNDX = cpvDaily * selectedADD;
      const netNDX = Math.max(0, grossNDX - data.collateral); // Same as Overview/PD section
      // VAR = nNDX * (pd_score / 100) where pd_score is a percentage (e.g., 3.42 for 3.42%)
      const valueAtRisk = (netNDX * pdScore) / 100; // Value at Risk: nNDX * PD score (as percentage)
      const settlementDays = tpvDaily > 0 ? valueAtRisk / tpvDaily : 0; // T+X: VaR / TPV
      // ELD = N-NDX * LGD (LGD is stored as decimal 0..1 in getRiskMetrics)
      const expectedLoss = netNDX * lgdRate;

      // Call updateRiskMetrics API with values from dialog and selected row
      try {
        if (!editingRow.metricId) {
          throw new Error("Metric ID is missing from selected row");
        }

        // Get LGD from selected row (convert from percentage to decimal)
        const lgdDecimal = (editingRow.lgd || 0) / 100;
        
        // Get version_no from selected row
        const versionNo = editingRow.versionNo || 0;

        const updateRiskMetricsPayload = {
          cpv: data.cpv,
          tpv: data.tpv,
          collateral: data.collateral,
          lgd: lgdDecimal,
          version_no: versionNo,
        };

        await merchantService.updateRiskMetrics(
          editingRow.metricId,
          updateRiskMetricsPayload
        );
      } catch (err) {
        console.error("Failed to call updateRiskMetrics:", err);
        // Continue with updating local state even if API call fails
      }

      const updatedCalculation: MerchantCalculationData = {
        mid: data.merchantId,
        cin: data.cin,
        merchantName: data.merchantName,
        runDate: data.runDate,
        cpvMonthly: cpvDaily,
        tpvMonthly: tpvDaily,
        collateral: data.collateral,
        lgd: lgdRate * 100, // Convert to percentage
        add: selectedADD,
        gNdx: grossNDX,
        nNdx: netNDX,
        var: valueAtRisk,
        settlementDays: settlementDays,
        eld: expectedLoss,
        versionNo: data.versionNo,
        metricId: editingRow.metricId, // Preserve metricId from selected row
      };

      // Update the existing row instead of adding a new one
      setCalculationsData((prev) =>
        prev.map((item) =>
          item.mid === editingRow.mid && item.versionNo === editingRow.versionNo
            ? updatedCalculation
            : item
        )
      );
      setIsEditDialogOpen(false);
      setEditingRow(null);
    } catch (error) {
      console.error("Error editing merchant:", error);
    } finally {
      setIsAddingMerchant(false);
    }
  };

  return (
    <motion.div
      className="w-full h-full overflow-hidden flex flex-col calculations-tab-container"
      style={{
        maxWidth: "100%",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        overflowX: "hidden",
        overflowY: "hidden",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      {/* Section Header */}
      <motion.div
        className="mb-4 flex-shrink-0"
        style={{ width: "100%", maxWidth: "100%" }}
      >
        <SectionHeaderWithFlags
          title="Merchant Calculations"
          icon={Calculator}
          positiveFlags={[]}
          negativeFlags={[]}
          mildPositiveFlags={[]}
          titleColorClass={colorSchemes.blue.text}
          iconColorClass={colorSchemes.blue.text}
          allowCollapse={false}
          initialRowLimit={5}
          onDownload={handleDownloadCSV}
          showDownload={true}
        />
      </motion.div>

      {/* Search Bar and Add Button Row */}
      <div
        className="mb-4 flex items-center gap-4 flex-shrink-0"
        style={{ width: "100%", maxWidth: "100%", overflow: "hidden" }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search merchants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-8 w-full h-10 border-gray-300 bg-inherit shadow"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          <ActionButton
            id="add-merchant"
            text="ADD MERCHANT"
            icon={Plus}
            color="blueTextWhiteBg"
            onClick={handleAddMerchant}
            border={true}
          />
          {isSelectionMode ? (
            <div className="flex items-center gap-2">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSelectionMode(false);
                  setSelectedRows([]);
                }}
                variant="outline"
                className="bg-white border-gray-300 text-gray-600 hover:bg-gray-50 h-10 px-4 font-semibold shadow-sm transition-all active:scale-95"
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSelected();
                }}
                className="bg-red-600 text-white hover:bg-red-700 h-10 px-4 font-semibold shadow-sm flex items-center gap-2 transition-all active:scale-95"
                disabled={selectedRows.length === 0 || isDeleting}
              >
                {isDeleting ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash size={18} /> Confirm Delete ({selectedRows.length})
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setIsSelectionMode(true);
              }}
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50 h-10 font-semibold shadow-sm flex items-center gap-2 transition-all active:scale-95"
              title="Select rows to delete"
            >
              <Trash size={18} /> DELETE 
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="mb-4 flex-shrink-0">
        <KeyMetrics
          hardcodedMetrics={keyMetricsData}
          isMetricsExpanded={isMetricsExpanded}
          setIsMetricsExpanded={setIsMetricsExpanded}
          showCollapse={false}
          showHeader={false}
          gridCols={5}
        />
      </div>

      {/* Table Container - Takes remaining space and handles scrolling */}
      <div
        className="flex-1 min-h-0"
        style={{
          maxWidth: "100%",
          width: "100%",
          overflow: "auto",
          overflowX: "auto",
          overflowY: "auto",
          border: "1px solid #e5e7eb",
          borderRadius: "0.375rem",
        }}
      >
        <div
          style={{
            minWidth: "min-content",
          }}
        >
          {isLoadingData ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading calculations data...</div>
            </div>
          ) : (
            <CustomTableView
                columns={columns}
                data={filteredCalculationsData}
                initialRowLimit={999}
                showCSVExport={false}
                minColumnWidth="80px"
                className="table-fixed-width"
                // Enable row selection when header edit/delete is clicked
                enableRowSelection={isSelectionMode}
                selectedRows={selectedRows}
                onSelectedRowsChange={(rows: Record<string, any>[]) =>
                  setSelectedRows(rows as MerchantCalculationData[])
                }
                // Use merchant id as unique row identifier
                rowIdKey="mid"
                // Freeze Edit (index 0), Sr. No. (index 1) and Company Name (index 2)
                frozenColumnIndices={[0, 1, 2]}
              />
          )}
        </div>
      </div>

      {/* Add Merchant Dialog */}
      <AddMerchantDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSubmit={handleAddMerchantSubmit}
        isLoading={isAddingMerchant}
      />

      {/* Edit Merchant Dialog */}
      {editingRow && (
        <AddMerchantDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setEditingRow(null);
          }}
          onSubmit={handleEditMerchantSubmit}
          isLoading={isAddingMerchant}
          isEditMode={true}
          initialData={{
            merchantId: editingRow.mid,
            cin: editingRow.cin,
            merchantName: editingRow.merchantName,
            cpv: editingRow.cpvMonthly,
            tpv: editingRow.tpvMonthly,
            collateral: editingRow.collateral,
            runDate: editingRow.runDate,
            versionNo: editingRow.versionNo || 0,
          }}
        />
      )}
    </motion.div>
  );
};

export default MerchantCalculationsTab;
