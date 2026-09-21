"use client";

import { FC, useEffect, useState } from "react";
import { Copy, FileDown } from "lucide-react";
import { motion } from "framer-motion";
import { MerchantItemType } from "@/app/types";
import { BubbleTag } from "@/components/custom/BubbleTag";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/custom/CustomSelect";
import {
  industryService,
  MerchantIndustry,
} from "@/app/services/industryServices";
import { useMerchantVersionsStore } from "@/app/store/merchant/merchantVersionsStore";
// import { conglomerateMapping } from '@/app/utils/conglomerateMapping';

interface InsolvencyPageHeaderProps {
  activeMerchant: MerchantItemType;
  sections: Array<{ id: string; title: string }>;
  onGenerateReport?: () => void;
  onGenerateFullReport?: () => void;
  onDateChange?: (date: string, versionNo: number) => void;
}

interface VersionOption {
  label: string;
  value: string;
  version_no?: number;
}

const InsolvencyPageHeader: FC<InsolvencyPageHeaderProps> = ({
  activeMerchant,
  sections,
  onGenerateReport,
  onGenerateFullReport,
  onDateChange,
}) => {
  const [merchantIndustry, setMerchantIndustry] =
    useState<MerchantIndustry | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [dateOptions, setDateOptions] = useState<VersionOption[]>([]);

  // Format date as "15 Feb 2025"
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Debug log to help trace activeMerchant updates
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[InsolvencyPageHeader] activeMerchant changed:', activeMerchant);
  }, [activeMerchant]);

  useEffect(() => {
    const fetchMerchantIndustry = async () => {
      if (activeMerchant?.id) {
        const industryData = await industryService.getMerchantIndustry(
          activeMerchant.id
        );
        setMerchantIndustry(industryData);
      }
    };

    fetchMerchantIndustry();
  }, [activeMerchant?.id]);

  const { fetchVersions, versions: allVersions } = useMerchantVersionsStore();
  const versions = allVersions[activeMerchant?.id] || [];

  useEffect(() => {
    const resolveVersions = async () => {
      if (activeMerchant?.id) {
        try {
          const versionsData = await fetchVersions(activeMerchant.id);
          if (versionsData && versionsData.length > 0) {
            const options = versionsData.map((version: any) => {
              const formattedDate = formatDate(version.date);
              return {
                label: formattedDate,
                value: version.date,
                version_no: version.version ?? version.version_no ?? 0,
              };
            });
            setDateOptions(options);
            // When the active merchant changes, always select the latest run date
            // returned by the server and notify the parent via onDateChange.
            if (options.length > 0) {
              const latestOption = options[options.length - 1];
              const latestDate = latestOption.value;
              const latestVersionNo = latestOption.version_no || 0;
              setSelectedDate(latestDate);
              if (onDateChange) {
                onDateChange(latestDate, latestVersionNo);
              }
            }
          }
        } catch (error) {
          console.error("Error fetching versions:", error);
          // Fallback to empty options on error
          setDateOptions([]);
        }
      }
    };

    resolveVersions();
  }, [activeMerchant?.id, fetchVersions]);

  const copyId = () => {
    navigator.clipboard.writeText(activeMerchant.cin || activeMerchant.id);
  };

  return (
    <div className="space-y-2">
      {activeMerchant && (
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-blue-600 leading-none">
                {activeMerchant.legalName}
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-500 leading-none">
                {/* {conglomerateMapping[activeMerchant.legalName] && (
                  <BubbleTag
                    text={conglomerateMapping[activeMerchant.legalName]}
                    color="blueTextWhiteBg"
                    withBorder={true}
                  />
                )} */}
                <BubbleTag
                  text={merchantIndustry?.industry || "Loading industry..."}
                  color={
                    merchantIndustry?.risk_segment === "Medium"
                      ? "yellowTextWhiteBg"
                      : merchantIndustry?.risk_segment === "High"
                      ? "redTextWhiteBg"
                      : merchantIndustry?.risk_segment === "Low"
                      ? "greenTextWhiteBg"
                      : "cyanTextWhiteBg"
                  }
                  withBorder={true}
                />
                <span>[CIN {activeMerchant.cin || activeMerchant.id}]</span>
                <button
                  onClick={copyId}
                  className="text-blue-500 hover:text-blue-700 flex items-center justify-center h-4"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            {(onGenerateFullReport || onGenerateReport) && (
              <div className="flex items-center gap-2">
                {(onGenerateFullReport || onGenerateReport) && (
                  <CustomSelect
                    value={selectedDate}
                    onValueChange={(date) => {
                      setSelectedDate(date);
                      const selectedVersion = versions.find((v: any) => v.date === date);
                      const versionNo = selectedVersion?.version || 0;
                      if (onDateChange) {
                        onDateChange(date, versionNo);
                      }
                    }}
                    options={dateOptions}
                    className="w-40"
                    size="sm"
                  />
                )}
                {onGenerateFullReport && (
                  <Button
                    onClick={onGenerateFullReport}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    <FileDown className="h-4 w-4" />
                    Full Report
                  </Button>
                )}
                {onGenerateReport && (
                  <Button
                    onClick={onGenerateReport}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    <FileDown className="h-4 w-4" />
                    Page Report
                  </Button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default InsolvencyPageHeader;
