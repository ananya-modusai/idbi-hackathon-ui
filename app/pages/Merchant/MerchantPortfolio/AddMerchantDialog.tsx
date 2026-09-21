import { FC, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ActionButton } from "@/components/custom/ActionButton";
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  watchlistService,
  WatchlistItem,
} from "@/app/services/watchlistServices";
import { useProfileStore } from "@/app/store/authentication/profileStore";
import { merchantService } from "@/app/services/merchantServices";

interface AddMerchantDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    merchantId: string;
    cin: string;
    merchantName: string;
    cpv: number;
    tpv: number;
    collateral: number;
    runDate: string;
    versionNo: number;
  }) => void;
  isLoading?: boolean;
  initialData?: {
    merchantId: string;
    cin: string;
    merchantName: string;
    cpv: number;
    tpv: number;
    collateral: number;
    runDate: string;
    versionNo: number;
  };
  isEditMode?: boolean;
}

interface VersionOption {
  label: string;
  value: string;
  version_no: number;
}

export const AddMerchantDialog: FC<AddMerchantDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  initialData,
  isEditMode = false,
}) => {
  const { organizationId, fetchProfile } = useProfileStore();
  const [selectedMerchant, setSelectedMerchant] = useState<string>("");
  const [cpv, setCpv] = useState("5000000");
  const [tpv, setTpv] = useState("10000000");
  const [collateral, setCollateral] = useState("0");
  const [runDate, setRunDate] = useState("");
  const [watchlistMerchants, setWatchlistMerchants] = useState<WatchlistItem[]>(
    []
  );
  const [isLoadingMerchants, setIsLoadingMerchants] = useState(false);
  const [dateOptions, setDateOptions] = useState<VersionOption[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [merchantSearchOpen, setMerchantSearchOpen] = useState(false);
  const [merchantSearchQuery, setMerchantSearchQuery] = useState("");

  // Format date as "15 Feb 2025"
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Fetch watchlist merchants when dialog opens
  useEffect(() => {
    const fetchMerchants = async () => {
      if (!isOpen) return;

      // Ensure we have organizationId
      if (!organizationId) {
        await fetchProfile();
      }

      const orgId = useProfileStore.getState().organizationId;
      if (!orgId) {
        console.warn("No organizationId available");
        return;
      }

      setIsLoadingMerchants(true);
      try {
        const result = await watchlistService.getOrganizationWatchlist(orgId);
        if (result.success && result.data) {
          // Remove duplicate merchants by merchant_id
          const data = result.data as WatchlistItem[];
          const uniqueMerchants = Array.from(
            new Map(data.map((m: WatchlistItem) => [m.merchant_id, m])).values()
          ) as WatchlistItem[];
          setWatchlistMerchants(uniqueMerchants);
        }
      } catch (error) {
        console.error("Error fetching watchlist merchants:", error);
      } finally {
        setIsLoadingMerchants(false);
      }
    };

    fetchMerchants();
  }, [isOpen, organizationId, fetchProfile]);

  // Fetch versions when merchant is selected
  useEffect(() => {
    const fetchVersions = async () => {
      if (!selectedMerchant) {
        setDateOptions([]);
        setRunDate("");
        return;
      }

      setIsLoadingVersions(true);
      try {
        const response = await merchantService.getMerchantVersions(
          selectedMerchant
        );
        if (response.success && response.versions) {
          setVersions(response.versions);
          const options: VersionOption[] = response.versions.map((version: any) => {
            const formattedDate = formatDate(version.date);
            return {
              label: formattedDate,
              value: version.date,
              version_no: version.version || 0,
            };
          });
          setDateOptions(options);
          // Set the first version as selected by default (unless in edit mode with initialData)
          if (options.length > 0) {
            if (isEditMode && initialData && initialData.runDate) {
              // In edit mode, use the initial runDate if it exists in options
              const matchingOption = options.find(
                (opt: VersionOption) => opt.value === initialData.runDate
              );
              if (matchingOption) {
                setRunDate(matchingOption.value);
              } else {
                setRunDate(options[0].value);
              }
            } else {
              setRunDate(options[0].value);
            }
          }
        } else {
          setVersions([]);
          setDateOptions([]);
          setRunDate("");
        }
      } catch (error) {
        console.error("Error fetching versions:", error);
        // Fallback to empty options on error
        setVersions([]);
        setDateOptions([]);
        setRunDate("");
      } finally {
        setIsLoadingVersions(false);
      }
    };

    fetchVersions();
  }, [selectedMerchant, isEditMode, initialData]);

  // Initialize form with initialData when in edit mode
  useEffect(() => {
    if (isOpen && isEditMode && initialData) {
      setSelectedMerchant(initialData.merchantId);
      setCpv(initialData.cpv.toString());
      setTpv(initialData.tpv.toString());
      setCollateral(initialData.collateral.toString());
      setRunDate(initialData.runDate);
    }
  }, [isOpen, isEditMode, initialData]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedMerchant("");
      setCpv("5000000");
      setTpv("10000000");
      setCollateral("0");
      setRunDate("");
      setDateOptions([]);
      setVersions([]);
      setMerchantSearchOpen(false);
      setMerchantSearchQuery("");
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!selectedMerchant || !cpv || !tpv || !collateral || !runDate) {
      return;
    }

    const merchant = watchlistMerchants.find(
      (m) => m.merchant_id === selectedMerchant
    );
    if (!merchant) {
      return;
    }

    // Find the selected version to get version_no
    const selectedVersion = versions.find((v) => v.date === runDate);
    // In edit mode, use initialData versionNo if available, otherwise use selected version
    const versionNo =
      isEditMode && initialData
        ? initialData.versionNo
        : selectedVersion?.version || 0;

    onSubmit({
      merchantId: merchant.merchant_id,
      cin: merchant.merchant_info?.cin || "",
      merchantName:
        merchant.merchant_info?.legal_name ||
        merchant.merchant_info?.trade_name ||
        "",
      cpv: parseFloat(cpv) || 0,
      tpv: parseFloat(tpv) || 0,
      collateral: parseFloat(collateral) || 0,
      runDate: runDate,
      versionNo: versionNo,
    });
  };

  const isFormValid = selectedMerchant && cpv && tpv && collateral && runDate;

  // Filter merchants based on search query
  const filteredMerchants = watchlistMerchants.filter((merchant) => {
    if (!merchantSearchQuery) return true;
    const query = merchantSearchQuery.toLowerCase();
    const cin = merchant.merchant_info?.cin || "";
    const legalName = merchant.merchant_info?.legal_name || "";
    const tradeName = merchant.merchant_info?.trade_name || "";
    return (
      cin.toLowerCase().includes(query) ||
      legalName.toLowerCase().includes(query) ||
      tradeName.toLowerCase().includes(query)
    );
  });

  // Get selected merchant display text
  const selectedMerchantDisplay = selectedMerchant
    ? (() => {
        // In edit mode, use initialData if available
        if (isEditMode && initialData) {
          return initialData.cin && initialData.merchantName
            ? `${initialData.cin} - ${initialData.merchantName}`
            : initialData.merchantName || initialData.cin || selectedMerchant;
        }
        const merchant = watchlistMerchants.find(
          (m) => m.merchant_id === selectedMerchant
        );
        if (!merchant) return "";
        const cin = merchant.merchant_info?.cin || "";
        const name =
          merchant.merchant_info?.legal_name ||
          merchant.merchant_info?.trade_name ||
          "";
        return cin && name ? `${cin} - ${name}` : name || cin || merchant.merchant_id;
      })()
    : "";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Merchant" : "Add Merchant"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 overflow-x-hidden">
          {/* CIN-Merchant Name Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="merchant">CIN-Merchant Name</Label>
            <Popover open={merchantSearchOpen} onOpenChange={setMerchantSearchOpen}>
              <PopoverTrigger asChild>
                <button
                  id="merchant"
                  role="combobox"
                  aria-expanded={merchantSearchOpen}
                  className={cn(
                    "w-full justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    "flex items-center gap-2 overflow-x-hidden"
                  )}
                  disabled={isLoadingMerchants || isEditMode}
                >
                  <span className="truncate min-w-0">
                    {isLoadingMerchants
                      ? "Loading merchants..."
                      : selectedMerchantDisplay || "Select merchant"}
                  </span>
                  <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="p-0 overflow-x-hidden" align="start" style={{ width: "var(--radix-popover-trigger-width)", maxWidth: "100%" }}>
                <Command shouldFilter={false} className="overflow-x-hidden">
                  <CommandInput
                    placeholder="Search by CIN or name..."
                    value={merchantSearchQuery}
                    onValueChange={setMerchantSearchQuery}
                    className="overflow-x-hidden"
                  />
                  <CommandList className="max-h-[200px] overflow-x-hidden">
                    <CommandEmpty>No merchants found.</CommandEmpty>
                    <CommandGroup>
                      {filteredMerchants.map((merchant) => {
                        const cin = merchant.merchant_info?.cin || "";
                        const name =
                          merchant.merchant_info?.legal_name ||
                          merchant.merchant_info?.trade_name ||
                          "";
                        const displayText =
                          cin && name
                            ? `${cin} - ${name}`
                            : name || cin || merchant.merchant_id;
                        return (
                          <CommandItem
                            key={merchant.merchant_id}
                            value={displayText}
                            onSelect={() => {
                              setSelectedMerchant(merchant.merchant_id);
                              setMerchantSearchOpen(false);
                              setMerchantSearchQuery("");
                            }}
                            className="overflow-x-hidden"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 shrink-0",
                                selectedMerchant === merchant.merchant_id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <span className="truncate">{displayText}</span>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* CPV Input */}
          <div className="space-y-2">
            <Label htmlFor="cpv">CPV</Label>
            <Input
              id="cpv"
              type="number"
              placeholder="Enter CPV"
              value={cpv}
              onChange={(e) => setCpv(e.target.value)}
              className="w-full"
              step="0.01"
              min="0"
            />
          </div>

          {/* TPV Input */}
          <div className="space-y-2">
            <Label htmlFor="tpv">TPV</Label>
            <Input
              id="tpv"
              type="number"
              placeholder="Enter TPV"
              value={tpv}
              onChange={(e) => setTpv(e.target.value)}
              className="w-full"
              step="0.01"
              min="0"
            />
          </div>

          {/* Collateral Input */}
          <div className="space-y-2">
            <Label htmlFor="collateral">Collateral</Label>
            <Input
              id="collateral"
              type="number"
              placeholder="Enter Collateral"
              value={collateral}
              onChange={(e) => setCollateral(e.target.value)}
              className="w-full"
              step="0.01"
              min="0"
            />
          </div>

          {/* Run Date Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="runDate">Run Date</Label>
            <Select
              value={runDate}
              onValueChange={setRunDate}
              disabled={!selectedMerchant || isLoadingVersions}
            >
              <SelectTrigger id="runDate" className="w-full">
                <SelectValue
                  placeholder={
                    !selectedMerchant
                      ? "Select merchant first"
                      : isLoadingVersions
                      ? "Loading dates..."
                      : dateOptions.length === 0
                      ? "No dates available"
                      : "Select Run Date"
                  }
                />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]" style={{ width: "var(--radix-select-trigger-width)" }}>
                {dateOptions.length > 0 ? (
                  dateOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-2 py-1.5 text-sm text-gray-500 text-center">
                    No dates available
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <ActionButton
              text="Cancel"
              onClick={onClose}
              color="blueTextWhiteBg"
              border={true}
              disabled={isLoading}
            />
            <ActionButton
              text={
                isLoading
                  ? isEditMode
                    ? "Updating..."
                    : "Adding..."
                  : isEditMode
                  ? "Edit Merchant"
                  : "Add Merchant"
              }
              onClick={handleSubmit}
              disabled={!isFormValid || isLoading}
              color="blue"
              border={true}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            </ActionButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
