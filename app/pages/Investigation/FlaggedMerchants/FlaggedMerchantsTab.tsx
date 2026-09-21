"use client";

import React, { FC, useEffect, useMemo, useState, useCallback } from "react";
import { Flag, Download, Search, Loader2, X, RotateCcw, Plus, Trash2, Edit2, Upload } from "lucide-react";
import { CustomTableView, Column } from "@/components/custom/CustomTableView";
import { fetchFlaggedMerchants, FlaggedMerchantDto, createFlaggedMerchant, bulkDeleteFlaggedMerchants, updateFlaggedMerchant } from "@/app/services/caseServices";
import * as XLSX from "xlsx";
import SectionHeaderWithFlags from "@/components/custom/SectionHeaderWithFlags";
import { BubbleTag } from "@/components/custom/BubbleTag";
import { Input } from "@/components/ui/input";
import { SortActionButton, SortDirection } from "@/components/custom/CustomList/SortActionButton";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const FlaggedMerchantsTab: FC = () => {
    const [data, setData] = useState<FlaggedMerchantDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortField, setSortField] = useState<string>("date");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

    // Add Merchant Modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addLoading, setAddLoading] = useState(false);
    const [addTab, setAddTab] = useState<"single" | "bulk">("single");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Selection & Delete state
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedRows, setSelectedRows] = useState<Record<string, any>[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);

    // Edit Merchant Modal state
    const [isEditMode, setIsEditMode] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [editingMerchantUid, setEditingMerchantUid] = useState<string | null>(null);

    // Form fields
    const [legalName, setLegalName] = useState("");
    const [pan, setPan] = useState("");
    const [cinInput, setCinInput] = useState("");
    const [gstnInput, setGstnInput] = useState("");
    const [contactNumbersInput, setContactNumbersInput] = useState("");
    const [emailIdsInput, setEmailIdsInput] = useState("");
    const [directorsInput, setDirectorsInput] = useState("");
    const [websiteUrlsInput, setWebsiteUrlsInput] = useState("");

    // Edit Form fields
    const [editLegalName, setEditLegalName] = useState("");
    const [editPan, setEditPan] = useState("");
    const [editCinInput, setEditCinInput] = useState("");
    const [editGstnInput, setEditGstnInput] = useState("");
    const [editContactNumbersInput, setEditContactNumbersInput] = useState("");
    const [editEmailIdsInput, setEditEmailIdsInput] = useState("");
    const [editDirectorsInput, setEditDirectorsInput] = useState("");
    const [editWebsiteUrlsInput, setEditWebsiteUrlsInput] = useState("");

    const handleDeleteSelected = async () => {
        if (selectedRows.length === 0) return;

        const confirmed = window.confirm(`Are you sure you want to delete ${selectedRows.length} selected merchant(s)?`);
        if (!confirmed) return;

        try {
            setIsDeleting(true);
            const uids = selectedRows.map((row) => row.uid).filter(Boolean);
            if (uids.length > 0) {
                await bulkDeleteFlaggedMerchants(uids);
                alert("Selected merchant(s) deleted successfully.");
            }
            setSelectedRows([]);
            setIsSelectionMode(false);
            await loadFlaggedMerchants(true);
        } catch (error) {
            console.error("Failed to delete flagged merchants:", error);
            alert("Failed to delete selected merchant(s).");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleAddMerchant = async () => {
        if (!legalName.trim() || !pan.trim()) return;

        try {
            setAddLoading(true);

            const splitBySeparator = (str: string) => {
                if (!str) return [];
                return str
                    .split(/[;,]/)
                    .map((s) => s.trim())
                    .filter((s) => s !== "");
            };

            const cin = splitBySeparator(cinInput);
            const gstn = splitBySeparator(gstnInput);
            const contact_numbers = splitBySeparator(contactNumbersInput);
            const email_ids = splitBySeparator(emailIdsInput);
            const website_urls = splitBySeparator(websiteUrlsInput);

            // Parse directors to array of objects: [{"name": "..."}]
            const directorsList = splitBySeparator(directorsInput);
            const directors = directorsList.map((d) => ({ name: d }));

            const payload = {
                legal_name: legalName.trim(),
                pan: pan.trim().toUpperCase(),
                cin,
                gstn,
                contact_numbers,
                email_ids,
                directors,
                website_urls,
            };

            await createFlaggedMerchant(payload);

            // Reset fields
            setLegalName("");
            setPan("");
            setCinInput("");
            setGstnInput("");
            setContactNumbersInput("");
            setEmailIdsInput("");
            setDirectorsInput("");
            setWebsiteUrlsInput("");

            setIsAddModalOpen(false);

            // Reload flagged merchants
            await loadFlaggedMerchants(true);
        } catch (error) {
            console.error("Failed to add flagged merchant:", error);
            alert("Failed to add flagged merchant. Please verify fields and try again.");
        } finally {
            setAddLoading(false);
        }
    };

    const handleDownloadTemplate = () => {
        try {
            const headers = [
                "Legal Name",
                "PAN",
                "CIN",
                "GSTN",
                "Contacts",
                "Email IDs",
                "Directors",
                "Website URLs"
            ];
            const sampleData = [
                {
                    "Legal Name": "Acme Corp Ltd",
                    "PAN": "ABCDE1234F",
                    "CIN": "U12345MH2021PTC123456; U65432DL2020PTC654321",
                    "GSTN": "27ABCDE1234F1Z5; 07ABCDE1234F1Z6",
                    "Contacts": "+91 9876543210; +91 9123456789",
                    "Email IDs": "info@acme.com; support@acme.com",
                    "Directors": "John Doe; Jane Smith",
                    "Website URLs": "acme.com; acme-group.com"
                }
            ];

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });
            
            ws['!cols'] = [
                { wch: 20 },
                { wch: 15 },
                { wch: 35 },
                { wch: 25 },
                { wch: 30 },
                { wch: 30 },
                { wch: 25 },
                { wch: 30 }
            ];

            XLSX.utils.book_append_sheet(wb, ws, 'Template');
            XLSX.writeFile(wb, 'flagged_merchants_template.xlsx');
        } catch (error) {
            console.error("Failed to download template:", error);
            alert("Failed to download Excel template.");
        }
    };

    const processImportedMerchants = async (jsonData: any[]) => {
        if (!jsonData || jsonData.length === 0) {
            alert("The uploaded file is empty.");
            return;
        }

        const getVal = (row: any, ...keys: string[]) => {
            for (const k of keys) {
                const foundKey = Object.keys(row).find(
                    (rk) => rk.toLowerCase().replace(/[\s_]/g, "") === k.toLowerCase().replace(/[\s_]/g, "")
                );
                if (foundKey) {
                    return String(row[foundKey] || "").trim();
                }
            }
            return "";
        };

        const splitBySeparator = (str: string) => {
            if (!str) return [];
            return str
                .split(/[;,]/)
                .map((s) => s.trim())
                .filter((s) => s !== "");
        };

        const parsedMerchants = jsonData.map((row) => {
            const legal_name = getVal(row, "Legal Name", "legal_name", "merchant_name", "name");
            const pan = getVal(row, "PAN", "pan");
            const cinStr = getVal(row, "CIN", "cin");
            const gstnStr = getVal(row, "GSTN", "gstn", "gstin");
            const contactsStr = getVal(row, "Contacts", "contact_numbers", "contact");
            const emailsStr = getVal(row, "Email IDs", "email_ids", "emails", "email");
            const directorsStr = getVal(row, "Directors", "directors", "director");
            const websitesStr = getVal(row, "Website URLs", "website_urls", "websites", "website_url");

            return {
                legal_name,
                pan: pan.toUpperCase(),
                cin: splitBySeparator(cinStr),
                gstn: splitBySeparator(gstnStr),
                contact_numbers: splitBySeparator(contactsStr),
                email_ids: splitBySeparator(emailsStr),
                directors: splitBySeparator(directorsStr).map(d => ({ name: d })),
                website_urls: splitBySeparator(websitesStr),
            };
        }).filter(m => m.legal_name && m.pan);

        if (parsedMerchants.length === 0) {
            alert("No valid merchants found. Please ensure 'Legal Name' (or 'Merchant Name') and 'PAN' columns are present and filled.");
            return;
        }

        const confirmed = window.confirm(`Found ${parsedMerchants.length} valid merchant(s) in the file. Would you like to import them?`);
        if (!confirmed) return;

        try {
            setAddLoading(true);
            for (const merchant of parsedMerchants) {
                await createFlaggedMerchant(merchant);
            }
            alert(`Successfully imported ${parsedMerchants.length} merchant(s).`);
            setIsAddModalOpen(false);
            setSelectedFile(null);
            setAddTab("single");
            await loadFlaggedMerchants(true);
        } catch (error) {
            console.error("Failed to import bulk merchants:", error);
            alert("An error occurred while importing merchants. Some merchants might have been imported.");
            await loadFlaggedMerchants(true);
        } finally {
            setAddLoading(false);
        }
    };

    const handleBulkConfirm = () => {
        if (!selectedFile) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
                await processImportedMerchants(jsonData);
            } catch (error) {
                console.error(error);
                alert("Failed to parse file. Please verify it is a valid CSV or Excel file.");
            }
        };
        reader.readAsArrayBuffer(selectedFile);
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            const ext = file.name.split('.').pop()?.toLowerCase();
            if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
                setSelectedFile(file);
            } else {
                alert("Please upload a valid CSV or Excel file (.csv, .xlsx, .xls)");
            }
        }
    };

    const sortFields = useMemo(() => [
        { key: "date", label: "Date" },
        { key: "merchantName", label: "Merchant Name" }
    ], []);

    const handleSortChange = (fieldKey: string, dir: SortDirection) => {
        setSortField(fieldKey);
        setSortDirection(dir);
    };

    const handleReset = () => {
        setSearchQuery('');
        setSortField('date');
        setSortDirection('desc');
    };

    const loadFlaggedMerchants = useCallback(async (forceRefresh = false) => {
        try {
            setLoading(true);
            const response = await fetchFlaggedMerchants(1000, forceRefresh);
            setData(response || []);
        } catch (error) {
            console.error("Failed to fetch flagged merchants:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadFlaggedMerchants();
    }, [loadFlaggedMerchants]);

    const formatDirectors = (directors: any[]) => {
        if (!directors || !Array.isArray(directors)) return "N/A";
        if (directors.length === 0) return "N/A";

        return directors.map(d => {
            if (typeof d === "string") return d;
            if (typeof d === "object" && d !== null) {
                if (d.name) return d.name;
                if (d.director_name) return d.director_name;
                if (d.legal_name) return d.legal_name;

                const values = Object.values(d).filter(v => typeof v === "string" || typeof v === "number");
                if (values.length > 0) return String(values[0]);
                return JSON.stringify(d);
            }
            return String(d);
        }).join(", ");
    };

    const handleOpenEditModal = (row: Record<string, any>) => {
        setEditingMerchantUid(row.uid || null);
        setEditLegalName(row.legal_name || "");
        setEditPan(row.pan || "");
        setEditCinInput(row.cin ? row.cin.join("; ") : "");
        setEditGstnInput(row.gstn ? row.gstn.join("; ") : "");
        setEditContactNumbersInput(row.contact_numbers ? row.contact_numbers.join("; ") : "");
        setEditEmailIdsInput(row.email_ids ? row.email_ids.join("; ") : "");
        setEditDirectorsInput(formatDirectors(row.directors));
        setEditWebsiteUrlsInput(row.website_urls ? row.website_urls.join("; ") : "");
        setIsEditModalOpen(true);
    };

    const handleEditMerchant = async () => {
        if (!editingMerchantUid || !editLegalName.trim() || !editPan.trim()) return;

        try {
            setEditLoading(true);

            const splitBySeparator = (str: string) => {
                if (!str) return [];
                return str
                    .split(/[;,]/)
                    .map((s) => s.trim())
                    .filter((s) => s !== "");
            };

            const cin = splitBySeparator(editCinInput);
            const gstn = splitBySeparator(editGstnInput);
            const contact_numbers = splitBySeparator(editContactNumbersInput);
            const email_ids = splitBySeparator(editEmailIdsInput);
            const website_urls = splitBySeparator(editWebsiteUrlsInput);

            // Parse directors to array of objects: [{"name": "..."}]
            const directorsList = splitBySeparator(editDirectorsInput);
            const directors = directorsList.map((d) => ({ name: d }));

            const payload = {
                legal_name: editLegalName.trim(),
                pan: editPan.trim().toUpperCase(),
                cin,
                gstn,
                contact_numbers,
                email_ids,
                directors,
                website_urls,
            };

            await updateFlaggedMerchant(editingMerchantUid, payload);

            setIsEditModalOpen(false);
            setIsEditMode(false);
            alert("Merchant updated successfully.");

            // Reload flagged merchants
            await loadFlaggedMerchants(true);
        } catch (error) {
            console.error("Failed to update flagged merchant:", error);
            alert("Failed to update flagged merchant. Please verify fields and try again.");
        } finally {
            setEditLoading(false);
        }
    };

    const filteredData = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return data;

        return data.filter(item =>
            (item.legal_name || "").toLowerCase().includes(query) ||
            (item.pan || "").toLowerCase().includes(query) ||
            (item.cin || []).some(c => c.toLowerCase().includes(query)) ||
            (item.gstn || []).some(g => g.toLowerCase().includes(query)) ||
            (item.contact_numbers || []).some(n => n.toLowerCase().includes(query)) ||
            (item.email_ids || []).some(e => e.toLowerCase().includes(query)) ||
            formatDirectors(item.directors).toLowerCase().includes(query) ||
            (item.website_urls || []).some(w => w.toLowerCase().includes(query))
        );
    }, [data, searchQuery]);

    const sortedAndFilteredData = useMemo(() => {
        const result = [...filteredData];
        result.sort((a, b) => {
            if (sortField === 'date') {
                const timeA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
                const timeB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
                return sortDirection === 'desc' ? timeB - timeA : timeA - timeB;
            } else if (sortField === 'merchantName') {
                const nameA = String(a.legal_name || '').toLowerCase();
                const nameB = String(b.legal_name || '').toLowerCase();
                return sortDirection === 'desc' ? nameB.localeCompare(nameA) : nameA.localeCompare(nameB);
            }
            return 0;
        });
        return result;
    }, [filteredData, sortField, sortDirection]);

    const tableData = useMemo(() => {
        return sortedAndFilteredData.map((item, index) => ({
            ...item,
            serialNo: index + 1,
        }));
    }, [sortedAndFilteredData]);

    const handleExportCSV = useCallback(() => {
        if (!data || data.length === 0) return;

        const headers = [
            "S.NO",
            "Merchant Name",
            "PAN",
            "CIN",
            "GSTN",
            "Contacts",
            "Email IDs",
            "Directors",
            "Website URLs",
            "Last Updated"
        ];

        const csvContent = [
            headers.join(","),
            ...tableData.map(item => [
                item.serialNo,
                `"${String(item.legal_name || "").replace(/"/g, '""')}"`,
                `"${String(item.pan || "").replace(/"/g, '""')}"`,
                `"${String(item.cin ? item.cin.join("; ") : "").replace(/"/g, '""')}"`,
                `"${String(item.gstn ? item.gstn.join("; ") : "").replace(/"/g, '""')}"`,
                `"${String(item.contact_numbers ? item.contact_numbers.join("; ") : "").replace(/"/g, '""')}"`,
                `"${String(item.email_ids ? item.email_ids.join("; ") : "").replace(/"/g, '""')}"`,
                `"${String(formatDirectors(item.directors)).replace(/"/g, '""')}"`,
                `"${String(item.website_urls ? item.website_urls.join("; ") : "").replace(/"/g, '""')}"`,
                `"${String(item.updated_at || "").replace(/"/g, '""')}"`
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `flagged_merchants_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [tableData, data]);

    const columns = useMemo(
        () => {
            const cols: Column[] = [
                {
                    key: "serialNo",
                    header: "S.NO",
                    width: "70px",
                    minWidth: "70px",
                    render: (val: number) => (
                        <span className="text-gray-500 font-medium">{val}</span>
                    ),
                },
                {
                    key: "updated_at",
                    header: "Date",
                    width: "160px",
                    minWidth: "160px",
                    render: (val: string) => {
                        if (!val) return <span className="text-gray-400 italic">N/A</span>;
                        const date = new Date(val);

                        const datePart = date.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                        });

                        const timePart = date.toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                        });

                        return (
                            <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-gray-800 text-[13px]">{datePart}</span>
                                <span className="text-[11px] text-gray-400 font-medium uppercase">{timePart}</span>
                            </div>
                        );
                    },
                },
                {
                    key: "legal_name",
                    header: "Merchant Name",
                    width: "180px",
                    minWidth: "180px",
                    render: (val: string) => (
                        <span className="font-semibold text-gray-800">{val || "N/A"}</span>
                    ),
                },
                {
                    key: "pan",
                    header: "PAN",
                    width: "110px",
                    minWidth: "110px",
                    render: (val: string) => (
                        <span className="font-semibold text-gray-700 tracking-wide uppercase">{val || "N/A"}</span>
                    ),
                },
                {
                    key: "cin",
                    header: "CIN",
                    width: "180px",
                    minWidth: "180px",
                    render: (val: string[]) => {
                        if (!val || val.length === 0) return <span className="text-gray-400 italic">N/A</span>;
                        return (
                            <div className="flex flex-col gap-0.5">
                                {val.map((item, i) => (
                                    <span key={i} className="text-xs text-gray-700 font-medium uppercase tracking-wider">
                                        {item}
                                    </span>
                                ))}
                            </div>
                        );
                    },
                },
                {
                    key: "gstn",
                    header: "GSTN",
                    width: "180px",
                    minWidth: "180px",
                    render: (val: string[]) => {
                        if (!val || val.length === 0) return <span className="text-gray-400 italic">N/A</span>;
                        return (
                            <div className="flex flex-col gap-0.5">
                                {val.map((item, i) => (
                                    <span key={i} className="text-xs text-blue-800 font-medium uppercase tracking-wider">
                                        {item}
                                    </span>
                                ))}
                            </div>
                        );
                    },
                },
                {
                    key: "contact_numbers",
                    header: "Contacts",
                    width: "150px",
                    minWidth: "150px",
                    render: (val: string[]) => {
                        if (!val || val.length === 0) return <span className="text-gray-400 italic">N/A</span>;
                        return (
                            <div className="flex flex-col gap-0.5">
                                {val.map((item, i) => (
                                    <span key={i} className="text-xs text-gray-700 font-medium">
                                        {item}
                                    </span>
                                ))}
                            </div>
                        );
                    },
                },
                {
                    key: "email_ids",
                    header: "Email IDs",
                    width: "180px",
                    minWidth: "180px",
                    render: (val: string[]) => {
                        if (!val || val.length === 0) return <span className="text-gray-400 italic">N/A</span>;
                        return (
                            <div className="flex flex-col gap-0.5 max-w-[180px] truncate">
                                {val.map((item, i) => (
                                    <a
                                        key={i}
                                        href={`mailto:${item}`}
                                        className="text-xs text-blue-600 hover:underline font-medium truncate"
                                        title={item}
                                    >
                                        {item}
                                    </a>
                                ))}
                            </div>
                        );
                    },
                },
                {
                    key: "directors",
                    header: "Directors",
                    width: "180px",
                    minWidth: "180px",
                    render: (val: any[]) => {
                        const formatted = formatDirectors(val);
                        if (formatted === "N/A") return <span className="text-gray-400 italic">N/A</span>;
                        return <span className="text-xs text-gray-700 font-medium">{formatted}</span>;
                    },
                },
                {
                    key: "website_urls",
                    header: "Website URLs",
                    width: "180px",
                    minWidth: "180px",
                    render: (val: string[]) => {
                        if (!val || val.length === 0) return <span className="text-gray-400 italic">N/A</span>;
                        return (
                            <div className="flex flex-col gap-0.5 max-w-[180px] truncate">
                                {val.map((item, i) => (
                                    <a
                                        key={i}
                                        href={item.startsWith("http") ? item : `https://${item}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:underline font-medium truncate"
                                        title={item}
                                    >
                                        {item}
                                    </a>
                                ))}
                            </div>
                        );
                    },
                },
            ];

            if (isEditMode) {
                cols.unshift({
                    key: "editAction",
                    header: "",
                    width: "60px",
                    minWidth: "60px",
                    render: (val: any, row: Record<string, any>) => (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditModal(row);
                            }}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md transition-all active:scale-[0.95] flex items-center justify-center"
                            title="Edit Merchant"
                        >
                            <Edit2 className="h-4 w-4 text-blue-600" />
                        </button>
                    ),
                });
            }

            return cols;
        },
        [isEditMode]
    );

    return (
        <div className="w-full px-2 pb-8 mt-4">
            <div className="mb-4">
                <SectionHeaderWithFlags
                    title="Flagged Merchants"
                    icon={Flag}
                    positiveFlags={[]}
                    negativeFlags={[]}
                    allowCollapse={false}
                    titleColorClass="text-blue-700"
                    iconColorClass="text-blue-700"
                />
            </div>

            <div className="mb-6 flex gap-3 w-full items-center">
                {/* Search Bar */}
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search flagged merchants by name, PAN, CIN, GSTN, email..."
                        className="w-full h-11 pl-10 pr-10 text-sm border-gray-200 focus-visible:ring-blue-500 rounded-xl shadow-sm transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                {loading && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    </div>
                )}

                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-600 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors font-medium text-sm shadow-sm whitespace-nowrap active:scale-[0.98] h-11"
                    title="Add Merchant"
                >
                    <Plus className="h-4 w-4 text-blue-600" />
                    <span>Add Merchant</span>
                </button>

                {isEditMode ? (
                    <Button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsEditMode(false);
                        }}
                        variant="outline"
                        className="bg-white border-gray-300 text-gray-600 hover:bg-gray-50 h-11 px-3 font-semibold shadow-sm transition-all active:scale-95 rounded-lg w-28 justify-center"
                    >
                        Cancel Edit
                    </Button>
                ) : (
                    <Button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsEditMode(true);
                            setIsSelectionMode(false);
                            setSelectedRows([]);
                        }}
                        variant="outline"
                        className="border-blue-600 text-blue-600 hover:bg-blue-50 h-11 font-semibold shadow-sm flex items-center gap-1.5 transition-all active:scale-95 bg-white rounded-lg w-24 justify-center"
                        title="Edit merchants"
                    >
                        <Edit2 size={16} /> Edit
                    </Button>
                )}

                {isSelectionMode ? (
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsSelectionMode(false);
                                setSelectedRows([]);
                            }}
                            variant="outline"
                            className="bg-white border-gray-300 text-gray-600 hover:bg-gray-50 h-11 px-3 font-semibold shadow-sm transition-all active:scale-95 rounded-lg w-24 justify-center"
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSelected();
                            }}
                            className="bg-red-600 text-white hover:bg-red-700 h-11 px-3 font-semibold shadow-sm flex items-center gap-1.5 transition-all active:scale-95 rounded-lg justify-center whitespace-nowrap min-w-[150px]"
                            disabled={selectedRows.length === 0 || isDeleting}
                        >
                            {isDeleting ? (
                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                            ) : (
                                <>
                                    <Trash2 size={16} /> Confirm ({selectedRows.length})
                                </>
                            )}
                        </Button>
                    </div>
                ) : (
                    <Button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsSelectionMode(true);
                            setIsEditMode(false);
                        }}
                        variant="outline"
                        className="border-red-600 text-red-600 hover:bg-red-50 h-11 font-semibold shadow-sm flex items-center gap-1.5 transition-all active:scale-95 bg-white rounded-lg w-24 justify-center"
                        title="Select rows to delete"
                    >
                        <Trash2 size={16} /> Delete
                    </Button>
                )}

                {/* Sort By Button */}
                <SortActionButton
                    sortFields={sortFields}
                    currentSortField={sortField}
                    currentSortDirection={sortDirection}
                    onSortChange={handleSortChange}
                    color="blueTextWhiteBg"
                    border={true}
                />

                <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 hover:border-red-300 rounded-lg hover:bg-red-50 transition-colors text-red-500 font-medium text-sm shadow-sm whitespace-nowrap active:scale-[0.98] h-11"
                    title="Reset Filters"
                >
                    <RotateCcw className="h-4 w-4 text-red-500" />
                    <span>Reset</span>
                </button>

                <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-blue-600 font-medium text-sm shadow-sm whitespace-nowrap active:scale-[0.98] h-11"
                    title="Export CSV"
                >
                    <Download className="h-4 w-4 text-blue-600" />
                    <span>Export CSV</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <CustomTableView
                    columns={columns}
                    data={tableData}
                    isLoading={loading}
                    initialRowLimit={1000}
                    isExpanded={true}
                    className="border-none shadow-none rounded-none"
                    headerAndTotalRowBg="blue-50"
                    hoverBgColor="blue-50"
                    enableRowSelection={isSelectionMode}
                    selectedRows={selectedRows}
                    onSelectedRowsChange={setSelectedRows}
                    rowIdKey="uid"
                />
            </div>

            {/* Add Merchant Dialog */}
            <Dialog open={isAddModalOpen} onOpenChange={(open) => {
                setIsAddModalOpen(open);
                if (!open) {
                    setSelectedFile(null);
                    setAddTab("single");
                }
            }}>
                <DialogContent className="max-w-2xl sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl bg-white">
                    <div className="bg-white p-6 pb-4">
                        <DialogHeader className="mb-4">
                            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Flag className="h-5 w-5 text-blue-600" />
                                Add Flagged Merchant
                            </DialogTitle>
                            <DialogDescription className="text-sm text-gray-500">
                                Record flagged merchants inside the database.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Segment Tabs */}
                        <div className="flex border-b border-gray-100 mb-5">
                            <button
                                type="button"
                                onClick={() => setAddTab("single")}
                                className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition-all ${
                                    addTab === "single"
                                        ? "border-blue-600 text-blue-600 font-bold"
                                        : "border-transparent text-gray-400 hover:text-gray-600"
                                }`}
                            >
                                Single Merchant
                            </button>
                            <button
                                type="button"
                                onClick={() => setAddTab("bulk")}
                                className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition-all ${
                                    addTab === "bulk"
                                        ? "border-blue-600 text-blue-600 font-bold"
                                        : "border-transparent text-gray-400 hover:text-gray-600"
                                }`}
                            >
                                Bulk Upload
                            </button>
                        </div>

                        {addTab === "single" ? (
                            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                                <div className="flex gap-4">
                                    <div className="flex-[2] space-y-1.5">
                                        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Merchant Name (Legal Name) <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            placeholder="Enter legal name"
                                            value={legalName}
                                            onChange={(e) => setLegalName(e.target.value)}
                                            className="w-full h-10 text-sm focus:ring-blue-500 border-gray-200 rounded-lg shadow-sm"
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            PAN <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            placeholder="Enter PAN"
                                            value={pan}
                                            onChange={(e) => setPan(e.target.value)}
                                            className="w-full h-10 text-sm focus:ring-blue-500 border-gray-200 rounded-lg shadow-sm uppercase"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-1 space-y-1.5">
                                        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            CIN
                                        </Label>
                                        <Input
                                            placeholder="CIN1; CIN2 (semicolon separated)"
                                            value={cinInput}
                                            onChange={(e) => setCinInput(e.target.value)}
                                            className="w-full h-10 text-sm focus:ring-blue-500 border-gray-200 rounded-lg shadow-sm"
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            GSTN
                                        </Label>
                                        <Input
                                            placeholder="GSTIN1; GSTIN2 (semicolon separated)"
                                            value={gstnInput}
                                            onChange={(e) => setGstnInput(e.target.value)}
                                            className="w-full h-10 text-sm focus:ring-blue-500 border-gray-200 rounded-lg shadow-sm"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-1 space-y-1.5">
                                        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Contacts
                                        </Label>
                                        <Input
                                            placeholder="Phone1; Phone2 (semicolon separated)"
                                            value={contactNumbersInput}
                                            onChange={(e) => setContactNumbersInput(e.target.value)}
                                            className="w-full h-10 text-sm focus:ring-blue-500 border-gray-200 rounded-lg shadow-sm"
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Email IDs
                                        </Label>
                                        <Input
                                            placeholder="email1@domain.com; email2@domain.com"
                                            value={emailIdsInput}
                                            onChange={(e) => setEmailIdsInput(e.target.value)}
                                            className="w-full h-10 text-sm focus:ring-blue-500 border-gray-200 rounded-lg shadow-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Directors
                                    </Label>
                                    <Input
                                        placeholder="Director Name 1; Director Name 2 (semicolon separated)"
                                        value={directorsInput}
                                        onChange={(e) => setDirectorsInput(e.target.value)}
                                        className="w-full h-10 text-sm focus:ring-blue-500 border-gray-200 rounded-lg shadow-sm"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Website URLs
                                    </Label>
                                    <Input
                                        placeholder="website1.com; website2.com (semicolon separated)"
                                        value={websiteUrlsInput}
                                        onChange={(e) => setWebsiteUrlsInput(e.target.value)}
                                        className="w-full h-10 text-sm focus:ring-blue-500 border-gray-200 rounded-lg shadow-sm"
                                    />
                                </div>
                            </div>
                        ) : (
                            /* Bulk Upload Panel */
                            <div className="space-y-5">
                                <div
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                    className="border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition-all group"
                                    onClick={() => document.getElementById("bulk-file-input")?.click()}
                                >
                                    <input
                                        id="bulk-file-input"
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        className="hidden"
                                        onChange={onFileChange}
                                    />
                                    <div className="h-12 w-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform text-blue-600">
                                        <Upload className="h-6 w-6" />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-800">
                                        {selectedFile ? selectedFile.name : "Drop Excel or CSV file here"}
                                    </span>
                                    <span className="text-xs text-gray-400 mt-1">
                                        {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : ".csv, .xlsx — up to 25 MB"}
                                    </span>
                                    {!selectedFile && (
                                        <button
                                            type="button"
                                            className="mt-4 px-4 py-1.5 bg-white border border-gray-200 text-gray-700 hover:border-gray-300 font-semibold text-xs rounded-lg shadow-sm transition-all"
                                        >
                                            Browse File
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Expected Columns</span>
                                    <div className="flex flex-wrap gap-1.5 max-w-full">
                                        {["Legal Name", "PAN", "CIN", "GSTN", "Contacts", "Email IDs", "Directors", "Website URLs"].map((col, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-600 text-xs rounded font-medium">
                                                {col}
                                            </span>
                                        ))}
                                    </div>
                                    <span className="text-[11px] text-gray-400 block mt-1">
                                        For multiple values, separate with a semicolon in the respective column.
                                    </span>
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={handleDownloadTemplate}
                                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-bold transition-all hover:underline"
                                    >
                                        <Download size={14} className="text-blue-600" />
                                        Download Template
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-4 px-6 flex justify-between gap-4 border-t border-gray-100">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setIsAddModalOpen(false);
                                setSelectedFile(null);
                                setAddTab("single");
                            }}
                            className="flex-1 h-11 text-gray-500 font-semibold bg-gray-50 hover:bg-gray-100 rounded-xl"
                        >
                            Cancel
                        </Button>
                        
                        {addTab === "single" ? (
                            <Button
                                className={`flex-1 h-11 font-semibold rounded-xl transition-all shadow-md ${
                                    legalName.trim() !== "" && pan.trim() !== "" && !addLoading
                                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                }`}
                                disabled={legalName.trim() === "" || pan.trim() === "" || addLoading}
                                onClick={handleAddMerchant}
                            >
                                {addLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    "Add Merchant"
                                )}
                            </Button>
                        ) : (
                            <Button
                                className={`flex-1 h-11 font-semibold rounded-xl transition-all shadow-md ${
                                    selectedFile && !addLoading
                                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                }`}
                                disabled={!selectedFile || addLoading}
                                onClick={handleBulkConfirm}
                            >
                                {addLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Importing...
                                    </>
                                ) : (
                                    "Run Pipeline"
                                )}
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Merchant Dialog */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-2xl sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl bg-white">
                    <div className="bg-white p-6">
                        <DialogHeader className="mb-4">
                            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Edit2 className="h-5 w-5 text-blue-600" />
                                Edit Flagged Merchant
                            </DialogTitle>
                            <DialogDescription className="text-sm text-gray-500">
                                Update details for this flagged merchant in the database.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                            <div className="flex gap-4">
                                <div className="flex-[2] space-y-1.5">
                                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Merchant Name (Legal Name) <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        placeholder="Enter legal name"
                                        value={editLegalName}
                                        onChange={(e) => setEditLegalName(e.target.value)}
                                        className="w-full h-10 text-sm focus:ring-blue-500 border-gray-200 rounded-lg shadow-sm"
                                    />
                                </div>
                                <div className="flex-1 space-y-1.5">
                                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        PAN <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        placeholder="Enter PAN"
                                        value={editPan}
                                        onChange={(e) => setEditPan(e.target.value)}
                                        className="w-full h-10 text-sm focus:ring-blue-500 border-gray-200 rounded-lg shadow-sm uppercase"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1 space-y-1.5">
                                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        CINs
                                    </Label>
                                    <Input
                                        placeholder="CIN1; CIN2 (semicolon separated)"
                                        value={editCinInput}
                                        onChange={(e) => setEditCinInput(e.target.value)}
                                        className="w-full h-10 text-sm focus:ring-blue-500 border-gray-200 rounded-lg shadow-sm"
                                    />
                                </div>
                                <div className="flex-1 space-y-1.5">
                                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        GSTN
                                    </Label>
                                    <Input
                                        placeholder="GSTIN1; GSTIN2 (semicolon separated)"
                                        value={editGstnInput}
                                        onChange={(e) => setEditGstnInput(e.target.value)}
                                        className="w-full h-10 text-sm focus:ring-blue-500 border-gray-200 rounded-lg shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1 space-y-1.5">
                                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Contacts
                                    </Label>
                                    <Input
                                        placeholder="Phone1; Phone2 (semicolon separated)"
                                        value={editContactNumbersInput}
                                        onChange={(e) => setEditContactNumbersInput(e.target.value)}
                                        className="w-full h-10 text-sm focus:ring-blue-500 border-gray-200 rounded-lg shadow-sm"
                                    />
                                </div>
                                <div className="flex-1 space-y-1.5">
                                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Email IDs
                                    </Label>
                                    <Input
                                        placeholder="email1@domain.com; email2@domain.com"
                                        value={editEmailIdsInput}
                                        onChange={(e) => setEditEmailIdsInput(e.target.value)}
                                        className="w-full h-10 text-sm focus:ring-blue-500 border-gray-200 rounded-lg shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Directors
                                </Label>
                                <Input
                                    placeholder="Director Name 1; Director Name 2 (semicolon separated)"
                                    value={editDirectorsInput}
                                    onChange={(e) => setEditDirectorsInput(e.target.value)}
                                    className="w-full h-10 text-sm focus:ring-blue-500 border-gray-200 rounded-lg shadow-sm"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Website URLs
                                </Label>
                                <Input
                                    placeholder="website1.com; website2.com (semicolon separated)"
                                    value={editWebsiteUrlsInput}
                                    onChange={(e) => setEditWebsiteUrlsInput(e.target.value)}
                                    className="w-full h-10 text-sm focus:ring-blue-500 border-gray-200 rounded-lg shadow-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 px-6 flex justify-between gap-4 border-t border-gray-100">
                        <Button
                            variant="ghost"
                            onClick={() => setIsEditModalOpen(false)}
                            className="flex-1 h-11 text-gray-500 font-semibold bg-gray-50 hover:bg-gray-100 rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button
                            className={`flex-1 h-11 font-semibold rounded-xl transition-all shadow-md ${editLegalName.trim() !== "" && editPan.trim() !== "" && !editLoading
                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                }`}
                            disabled={editLegalName.trim() === "" || editPan.trim() === "" || editLoading}
                            onClick={handleEditMerchant}
                        >
                            {editLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default FlaggedMerchantsTab;
