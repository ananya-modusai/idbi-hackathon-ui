"use client";

import React, { FC, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus, Upload, FileText, Info, Loader2, CheckCircle2, AlertCircle, Check, ChevronsUpDown, Search } from "lucide-react";
import { BubbleTag } from "@/components/custom/BubbleTag";
import { clearCache, createMerchant, enqueueMerchant, fetchMerchants, uploadMerchantDoc } from "@/app/services/caseServices";
import { useInvestigationCaseStore } from "@/app/store/investigation/investigationCaseStore";
import { MerchantItemType } from "@/app/types/merchant";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface RunMerchantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RunMerchantModal: FC<RunMerchantModalProps> = ({
  open,
  onOpenChange,
}) => {
  const [activeTab, setActiveTab] = useState("single");
  const [merchantName, setMerchantName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [mccCode, setMccCode] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [gstin, setGstin] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [vpaIds, setVpaIds] = useState<string[]>([]);
  const [newVpa, setNewVpa] = useState("");

  const [merchants, setMerchants] = useState<any[]>([]);
  const [isExisting, setIsExisting] = useState(false);
  const [selectedMerchantIds, setSelectedMerchantIds] = useState<string[]>([]);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<{ current: number, total: number } | null>(null);

  React.useEffect(() => {
    const getMerchants = async () => {
      try {
        const data = await fetchMerchants(1000);

        const sorted = [...data].sort((a, b) => {
          const nameA = (a.name || "").toLowerCase();
          const nameB = (b.name || "").toLowerCase();
          return nameA.localeCompare(nameB);
        });
        setMerchants(sorted);
      } catch (err) {
        console.error("Failed to fetch merchants", err);
      }
    };
    getMerchants();
  }, []);

  React.useEffect(() => {
    if (open) {
      setActiveTab("single");
      setMerchantName("");
      setWebsiteUrl("");
      setMccCode("");
      setBusinessCategory("");
      setGstin("");
      setAddressLine("");
      setVpaIds([]);
      setNewVpa("");
      setIsExisting(false);
      setSelectedMerchantIds([]);
      setComboboxOpen(false);
      setLoading(false);
      setFile(null);
      setProgress(null);
    }
  }, [open]);

  const handleAddVpa = () => {
    if (newVpa.trim() && !vpaIds.includes(newVpa.trim())) {
      setVpaIds([...vpaIds, newVpa.trim()]);
      setNewVpa("");
    }
  };

  const handleRemoveVpa = (vpa: string) => {
    setVpaIds(vpaIds.filter((v) => v !== vpa));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleRunPipeline = async () => {
    setLoading(true);
    setProgress(null);
    clearCache();
    try {
      if (activeTab === "single") {
        if (isExisting) {
          if (selectedMerchantIds.length === 0) return;
          console.log("[RunMerchantModal] Bulk enqueuing existing merchants:", selectedMerchantIds);
          await enqueueMerchant(undefined, selectedMerchantIds);
          useInvestigationCaseStore.getState().fetchInvestigationCases(true);
        } else {
          const payload = {
            name: merchantName,
            website: websiteUrl,
            vpa_ids: vpaIds,
            mcc_code: mccCode,
            business_category: businessCategory,
            address: addressLine,
            gstn: gstin,
          };
          const response = await createMerchant(payload);
          console.log("[RunMerchantModal] createMerchant response:", response);
          const mid = response.merchant_id || response.id || response.data?.id || response.data?.merchant_id;
          if (mid) {
            console.log("[RunMerchantModal] Enqueuing merchant:", mid);
            await enqueueMerchant(mid);
            // Refresh store to reflect running state and start polling
            useInvestigationCaseStore.getState().fetchInvestigationCases(true);
          } else {
            console.warn("[RunMerchantModal] No merchant ID found in response", response);
          }
        }
      } else {
        if (!file) return;

        // Backend handles parsing, merchant creation, and enqueueing.
        // The UI only needs to upload the file.
        const response = await uploadMerchantDoc(file);
        console.log("[RunMerchantModal] uploadMerchantDoc response:", response);

        // Refresh store to reflect running state and start polling
        useInvestigationCaseStore.getState().fetchInvestigationCases(true);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Pipeline execution failed:", error);
      alert(error instanceof Error ? error.message : "Pipeline execution failed");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  const isFormValid =
    activeTab === "single"
      ? isExisting
        ? selectedMerchantIds.length > 0
        : (merchantName.trim() !== "" && websiteUrl.trim() !== "")
      : file !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
        <div className="bg-white p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold text-gray-900">
              Run Merchant Pipeline
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Enter merchant details or bulk upload via Excel
            </DialogDescription>
          </DialogHeader>

          <Tabs
            defaultValue="single"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="flex w-full bg-transparent border-b border-gray-100 rounded-none h-11 p-0 mb-5 font-semibold">
              <TabsTrigger
                value="single"
                className="px-6 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent transition-all text-gray-500 text-sm font-semibold"
              >
                Single Merchant
              </TabsTrigger>
              <TabsTrigger
                value="bulk"
                className="px-6 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent transition-all text-gray-500 text-sm font-semibold"
              >
                Bulk Upload
              </TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="space-y-4 mt-0">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-50 mb-4">
                <Checkbox
                  id="existing"
                  checked={isExisting}
                  onCheckedChange={(checked) => {
                    setIsExisting(!!checked);
                    // Reset all fields when switching modes
                    setMerchantName("");
                    setGstin("");
                    setWebsiteUrl("");
                    setBusinessCategory("");
                    setMccCode("");
                    setAddressLine("");
                    setVpaIds([]);
                    setSelectedMerchantIds([]);
                  }}
                  className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <Label htmlFor="existing" className="text-sm font-medium text-gray-600 cursor-pointer">
                  Select from existing merchants
                </Label>
              </div>

              {isExisting && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Select Merchants <span className="text-red-500">*</span>
                    </Label>
                    <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={comboboxOpen}
                          className="w-full h-11 text-sm border-gray-200 rounded-xl focus:ring-blue-500 shadow-sm transition-all bg-white justify-between px-3 font-normal hover:bg-white text-left"
                        >
                          <span className="truncate flex-1">
                            {selectedMerchantIds.length > 0
                              ? `Selected (${selectedMerchantIds.length}) merchant${selectedMerchantIds.length === 1 ? '' : 's'}`
                              : "Choose merchants..."}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl border-gray-100 shadow-xl overflow-hidden" align="start">
                        <Command className="w-full">
                          <CommandInput placeholder="Search merchants..." className="h-10" />
                          <CommandList
                            className="max-h-[300px] overflow-y-auto"
                            onWheel={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                            <CommandEmpty>No merchant found.</CommandEmpty>
                            <CommandGroup>
                              {merchants.map((m) => {
                                const isSelected = selectedMerchantIds.includes(m.id);
                                return (
                                  <CommandItem
                                    key={m.id}
                                    value={`${m.name || m.legalName || m.tradeName || m.registeredName || ""} ${m.id}`}
                                    onSelect={() => {
                                      if (isSelected) {
                                        setSelectedMerchantIds(selectedMerchantIds.filter((id) => id !== m.id));
                                      } else {
                                        setSelectedMerchantIds([...selectedMerchantIds, m.id]);
                                      }
                                    }}
                                    className="cursor-pointer py-2.5 px-3 flex items-center justify-between"
                                  >
                                    <span className="truncate">
                                      {m.name || m.legalName || m.tradeName || m.registeredName || m.id}
                                    </span>
                                    <Check
                                      className={cn(
                                        "h-4 w-4 text-blue-600",
                                        isSelected ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {selectedMerchantIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50/50 rounded-xl border border-gray-100 max-h-36 overflow-y-auto">
                      {selectedMerchantIds.map((id) => {
                        const m = merchants.find((m) => m.id === id);
                        const name = m?.name || m?.legalName || m?.tradeName || m?.registeredName || id;
                        return (
                          <div
                            key={id}
                            className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium border border-blue-100/50 transition-all"
                          >
                            <span className="truncate max-w-[150px]">{name}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedMerchantIds(selectedMerchantIds.filter(x => x !== id))}
                              className="text-blue-400 hover:text-blue-600 transition-colors ml-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {!isExisting && (
                <>
                  <div className="flex gap-4">
                    <div className="flex-[2] space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-500">
                        Merchant Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="Add Name"
                        value={merchantName}
                        onChange={(e) => setMerchantName(e.target.value)}
                        disabled={isExisting}
                        className="w-full h-10 text-sm focus:ring-blue-500 border-gray-200 rounded-lg shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-500">
                        GSTIN
                      </Label>
                      <Input
                        placeholder="Add GSTIN"
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value)}
                        disabled={isExisting}
                        className="w-full h-10 text-sm focus:ring-blue-500 border-gray-200 rounded-lg shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-500">
                      Website URL <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Add URL"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      disabled={isExisting}
                      className="w-full h-10 text-sm focus:ring-blue-500 border-gray-200 rounded-lg shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-500">
                        Business Category
                      </Label>
                      <Input
                        placeholder="Add Category"
                        value={businessCategory}
                        onChange={(e) => setBusinessCategory(e.target.value)}
                        disabled={isExisting}
                        className="w-full h-10 text-sm focus:ring-blue-500 border-gray-200 rounded-lg shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-500">
                        MCC Code
                      </Label>
                      <Input
                        placeholder="Add Code"
                        value={mccCode}
                        onChange={(e) => setMccCode(e.target.value)}
                        disabled={isExisting}
                        className="w-full h-10 text-sm focus:ring-blue-500 border-gray-200 rounded-lg shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <Label className="text-xs font-semibold text-gray-500">
                      Business Address
                    </Label>
                    <div className="space-y-2">
                      <Input
                        placeholder="Add Address"
                        value={addressLine}
                        onChange={(e) => setAddressLine(e.target.value)}
                        disabled={isExisting}
                        className="w-full h-10 text-sm focus:ring-blue-500 border-gray-200 rounded-lg shadow-sm disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                  </div>



                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-500">
                      VPA IDs
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {vpaIds.map((vpa) => (
                        <div
                          key={vpa}
                          className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs border border-green-100 transition-all hover:bg-green-100"
                        >
                          <span>{vpa}</span>
                          {!isExisting && (
                            <button
                              onClick={() => handleRemoveVpa(vpa)}
                              className="text-green-400 hover:text-green-600 ml-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="merchant@upi"
                        value={newVpa}
                        onChange={(e) => setNewVpa(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddVpa()}
                        disabled={isExisting}
                        className="flex-1 h-10 text-sm border-gray-200 focus:ring-blue-500 rounded-lg shadow-sm font-mono disabled:bg-gray-50 disabled:text-gray-500"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddVpa}
                        disabled={isExisting}
                        className="h-10 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-100 rounded-lg shadow-sm font-semibold disabled:opacity-50"
                      >
                        + Add
                      </Button>
                    </div>
                  </div>
                </>
              )}

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-3 mt-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Info className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-xs text-blue-800 leading-relaxed font-medium">
                  The pipeline will run compliance and risk checks on this
                  merchant and add them to your watchlist once processed.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="bulk" className="space-y-6 mt-0">
              <div
                className={`border-2 border-dashed ${file ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-50'} rounded-xl p-8 flex flex-col items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer group relative`}
                onClick={() => document.getElementById('bulk-upload-input')?.click()}
              >
                <input
                  id="bulk-upload-input"
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className={`${file ? 'bg-blue-100' : 'bg-white'} p-3 rounded-xl shadow-sm mb-4 group-hover:scale-110 transition-transform`}>
                  {file ? <CheckCircle2 className="w-6 h-6 text-blue-600" /> : <Upload className="w-6 h-6 text-blue-600" />}
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1 text-center">
                  {file ? file.name : "Drop file here"}
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "CSV or Excel (.xlsx, .xls) — up to 25 MB"}
                </p>
                <Button variant="outline" size="sm" className="h-9 px-6 bg-white border-gray-200 shadow-sm hover:bg-gray-50 font-semibold rounded-lg">
                  {file ? "Change File" : "Browse File"}
                </Button>

                {(progress || loading) && (
                  <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center rounded-xl">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                    <p className="text-sm font-semibold text-gray-900">Processing...</p>
                    {progress && (
                      <p className="text-xs text-gray-500">{progress.current} / {progress.total}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700">Expected Columns</p>
                <div className="flex flex-wrap gap-2">
                  {['merchant_name', 'website_url', 'mcc_code', 'business_category', 'gstin', 'address', 'vpa_ids'].map(col => (
                    <span key={col} className="bg-white border border-gray-200 text-gray-600 px-3 py-1 rounded-md text-xs font-medium">
                      {col}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  For multiple values, separate with a semicolon in the respective column
                </p>
                <button
                  onClick={() => {
                    const columns = ['merchant_name', 'website_url', 'mcc_code', 'business_category', 'gstin', 'address', 'vpa_ids'];
                    const csvContent = "data:text/csv;charset=utf-8," + columns.join(",");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", "merchant_pipeline_template.csv");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="text-xs text-blue-600 font-semibold hover:underline flex items-center"
                >
                  <FileText className="w-3.5 h-3.5 mr-1" /> Download Template
                </button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="bg-white p-4 px-6 flex justify-between gap-4 border-t border-gray-100">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-11 text-gray-500 font-semibold bg-gray-50 hover:bg-gray-100 rounded-xl"
          >
            Cancel
          </Button>
          <Button
            className={`flex-1 h-11 font-semibold rounded-xl ${isFormValid && !loading
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
              } transition-all shadow-md`}
            disabled={!isFormValid || loading}
            onClick={handleRunPipeline}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running...
              </>
            ) : "Run Pipeline"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
