"use client";

import React, { FC, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Download,
  Search,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
  X,
  Plus
} from "lucide-react";
import { CustomTableView } from "@/components/custom/CustomTableView";
import {
  fetchContexts,
  ContextDto,
  updateContext,
  deleteContext,
  createContext,
  clearContextsCache
} from "@/app/services/caseServices";
import SectionHeaderWithFlags from "@/components/custom/SectionHeaderWithFlags";
import CustomListFilter, { useFilterState, FilterGroupsState } from "@/components/custom/CustomList/customListFilter";
import { SortActionButton, SortDirection } from "@/components/custom/CustomList/SortActionButton";
import { BubbleTag } from "@/components/custom/BubbleTag";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const ContextCell: React.FC<{ text: string }> = ({ text }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkTruncation = () => {
      if (textRef.current) {
        const { scrollHeight, clientHeight } = textRef.current;
        setIsTruncated(scrollHeight > clientHeight);
      }
    };

    checkTruncation();
    // Use requestAnimationFrame to ensure layout is complete before measuring
    const rafId = requestAnimationFrame(checkTruncation);
    
    window.addEventListener("resize", checkTruncation);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", checkTruncation);
    };
  }, [text, isExpanded]);

  if (!text) return <span className="text-gray-400 italic">N/A</span>;

  return (
    <div className="flex flex-col items-start gap-1 w-full max-w-full">
      <div
        ref={textRef}
        className="font-semibold text-gray-800 break-words whitespace-pre-wrap text-left"
        style={
          isExpanded
            ? {}
            : {
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
        }
      >
        {text}
      </div>
      {(isTruncated || isExpanded) && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-800 text-xs font-bold mt-1 focus:outline-none transition-colors"
        >
          {isExpanded ? "Show Less" : "More"}
        </button>
      )}
    </div>
  );
};

const ContextTab: FC = () => {
  const [data, setData] = useState<ContextDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [selectedContext, setSelectedContext] = useState<ContextDto | null>(null);

  // Fields for forms
  const [contextText, setContextText] = useState("");
  const [metadataUser, setMetadataUser] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [actionLoading, setActionLoading] = useState(false);

  // Sorting state
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const loadContexts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchContexts();
      if (response && response.success) {
        setData(response.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch contexts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContexts();
  }, [loadContexts]);

  const filterGroups: FilterGroupsState = useMemo(() => ({
    tertiary: [
      {
        id: "search",
        label: "Search",
        type: "searchbar" as const,
        options: [],
        selectedValues: [],
        onFilterChange: (values: string[]) => { },
        searchPlaceholder: "Search by context or metadata...",
        actionElements: (
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                setContextText("");
                setMetadataUser("");
                setIsActive(true);
                setIsAddModalOpen(true);
              }}
              className="bg-white hover:bg-blue-50 text-blue-600 border border-blue-600 font-bold h-10 px-4 rounded-xl flex items-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Add Context
            </Button>
            <SortActionButton
              sortFields={[
                { key: 'updated_at', label: 'Last Updated' },
                { key: 'context_text', label: 'Context' }
              ]}
              currentSortField="updated_at"
              currentSortDirection={sortDirection}
              onSortChange={(field, direction) => setSortDirection(direction)}
            />
          </div>
        )
      }
    ]
  }), [sortDirection]);

  const { filterState, setFilterState } = useFilterState(filterGroups);
  const searchQuery = filterState.searchbarQueries["search"] || "";

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);

    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    let filtered = data;

    if (query) {
      filtered = filtered.filter(item =>
        (item.context_text || "").toLowerCase().includes(query) ||
        (item.metadata_user || "").toLowerCase().includes(query)
      );
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.updated_at || 0).getTime();
      const dateB = new Date(b.updated_at || 0).getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [data, searchQuery, sortDirection]);

  const tableData = useMemo(() => {
    return filteredData.map((item, index) => ({
      ...item,
      serialNo: index + 1,
    }));
  }, [filteredData]);

  const handleExportCSV = useCallback(() => {
    if (!data || data.length === 0) return;

    const headers = ["S.NO", "Context", "Active", "Metadata User", "Last Updated"];
    const csvContent = [
      headers.join(","),
      ...tableData.map(item => [
        item.serialNo,
        `"${String(item.context_text || "").replace(/"/g, '""')}"`,
        item.is_active ? "True" : "False",
        `"${String(item.metadata_user || "").replace(/"/g, '""')}"`,
        `"${formatDate(item.updated_at)}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `contexts_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [tableData, data]);

  const handleEditClick = (context: ContextDto) => {
    setSelectedContext(context);
    setContextText(context.context_text);
    setMetadataUser(context.metadata_user || "");
    setIsActive(context.is_active);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (context: ContextDto) => {
    setSelectedContext(context);
    setIsDeleteModalOpen(true);
  };

  const handleCreate = async () => {
    if (!contextText.trim()) return;

    try {
      setActionLoading(true);
      await createContext({
        context_text: contextText,
        metadata_user: metadataUser,
        is_active: isActive
      });
      alert("Context added successfully");
      setIsAddModalOpen(false);
      setContextText("");
      setMetadataUser("");
      setIsActive(true);
      clearContextsCache();
      loadContexts();
    } catch (error) {
      alert("Failed to add context");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedContext || !contextText.trim()) return;

    try {
      setActionLoading(true);
      await updateContext(selectedContext.id, {
        context_text: contextText,
        metadata_user: metadataUser,
        is_active: isActive
      });
      alert("Context updated successfully");
      setIsEditModalOpen(false);
      clearContextsCache();
      loadContexts();
    } catch (error) {
      alert("Failed to update context");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedContext) return;

    try {
      setActionLoading(true);
      await deleteContext(selectedContext.id);
      alert("Context deleted successfully");
      setIsDeleteModalOpen(false);
      clearContextsCache();
      loadContexts();
    } catch (error) {
      alert("Failed to delete context");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "serialNo",
        header: "S.NO",
        width: "100px",
        render: (val: number) => (
          <span className="text-gray-500 font-medium">{val}</span>
        ),
      },
      {
        key: "context_text",
        header: "Context",
        width: "300px",
        render: (val: string) => (
          <ContextCell text={val} />
        ),
      },
      {
        key: "is_active",
        header: "Active",
        // width: "80px",
        align: "center",
        render: (val: boolean) => (
          <span
            className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-bold ${val
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
              }`}
          >
            {val ? "Active" : "Inactive"}
          </span>
        ),
      },
      {
        key: "metadata_user",
        header: "Metadata User",
        // width: "120px",
        render: (val: string) => (
          <span className="text-gray-600 font-medium text-[13px]">{val || "N/A"}</span>
        ),
      },
      {
        key: "updated_at",
        header: "Last Updated",
        // width: "80px",
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
        key: "actions",
        header: "Actions",
        width: "200px",
        align: "center",
        render: (_: any, row: ContextDto) => (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-4 border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg flex items-center gap-2 font-medium transition-all"
              onClick={() => handleEditClick(row)}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-4 border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg flex items-center gap-2 font-medium transition-all"
              onClick={() => handleDeleteClick(row)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <motion.div
      className="w-full px-2 pb-8 mt-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div className="mb-4">
        <SectionHeaderWithFlags
          title="Context"
          icon={BookOpen}
          positiveFlags={[]}
          negativeFlags={[]}
          allowCollapse={false}
          titleColorClass="text-blue-700"
          iconColorClass="text-blue-700"
          rightElement={
            <div className="flex items-center gap-3">
              <BubbleTag
                text="Export CSV"
                color="blue"
                clickable
                onClick={handleExportCSV}
                withBorder={true}
                hasInsideIcon={true}
                icon={<Download className="h-3 w-3" />}
                size="md"
              />
            </div>
          }
        />
      </motion.div>

      <div className="mb-6">
        <CustomListFilter
          filterGroups={filterGroups}
          filterState={filterState}
          setFilterState={setFilterState}
          showFilterToggle={false}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <CustomTableView
          columns={columns as any}
          data={tableData}
          isLoading={loading}
          initialRowLimit={100}
          isExpanded={true}
          className="border-none shadow-none rounded-none"
          headerAndTotalRowBg="blue-50"
          hoverBgColor="blue-50"
        />
      </div>

      {/* Add Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-white px-6 py-5 flex items-center gap-3 border-b border-gray-100">
            <Plus className="h-5 w-5 text-blue-600" />
            <DialogTitle className="text-xl font-bold text-blue-700">Add New Context</DialogTitle>
          </div>

          <div className="px-6 py-8 space-y-6 bg-white">
            <div className="space-y-2">
              <Label htmlFor="add-context-text" className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Context
              </Label>
              <Textarea
                id="add-context-text"
                value={contextText}
                onChange={(e) => setContextText(e.target.value)}
                placeholder="Enter context..."
                className="w-full min-h-[100px] text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl shadow-sm transition-all resize-none"
              />
              <p className="text-xs text-gray-400">Specify the primary context content.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-metadata-user" className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Metadata User
              </Label>
              <Input
                id="add-metadata-user"
                value={metadataUser}
                onChange={(e) => setMetadataUser(e.target.value)}
                placeholder="Enter user name or details..."
                className="w-full h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl shadow-sm transition-all"
              />
              <p className="text-xs text-gray-400">User metadata or reference for this context entry.</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="space-y-0.5">
                <Label htmlFor="add-is-active" className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Active
                </Label>
                <p className="text-xs text-gray-400">Specify if this context is currently active.</p>
              </div>
              <Switch
                id="add-is-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
            <Button
              variant="ghost"
              onClick={() => setIsAddModalOpen(false)}
              className="px-6 h-11 text-gray-500 font-semibold hover:bg-gray-100 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={actionLoading || !contextText.trim()}
              className="px-8 h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-200 transition-all active:scale-95 flex items-center gap-2"
            >
              {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Add Context"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-white px-6 py-5 flex items-center gap-3 border-b border-gray-100">
            <Pencil className="h-5 w-5 text-blue-600" />
            <DialogTitle className="text-xl font-bold text-blue-700">Edit Context</DialogTitle>
          </div>

          <div className="px-6 py-8 space-y-6 bg-white">
            <div className="space-y-2">
              <Label htmlFor="edit-context-text" className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Context
              </Label>
              <Textarea
                id="edit-context-text"
                value={contextText}
                onChange={(e) => setContextText(e.target.value)}
                placeholder="Enter context..."
                className="w-full min-h-[100px] text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl shadow-sm transition-all resize-none"
              />
              <p className="text-xs text-gray-400">Update the description for this context.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-metadata-user" className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Metadata User
              </Label>
              <Input
                id="edit-metadata-user"
                value={metadataUser}
                onChange={(e) => setMetadataUser(e.target.value)}
                placeholder="Enter user name or details..."
                className="w-full h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl shadow-sm transition-all"
              />
              <p className="text-xs text-gray-400">Update user metadata or reference.</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="space-y-0.5">
                <Label htmlFor="edit-is-active" className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Active
                </Label>
                <p className="text-xs text-gray-400">Specify if this context is currently active.</p>
              </div>
              <Switch
                id="edit-is-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
            <Button
              variant="ghost"
              onClick={() => setIsEditModalOpen(false)}
              className="px-6 h-11 text-gray-500 font-semibold hover:bg-gray-100 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={actionLoading || !contextText.trim()}
              className="px-8 h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-200 transition-all active:scale-95 flex items-center gap-2"
            >
              {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-white px-6 py-5 flex items-center gap-3 border-b border-gray-100">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <DialogTitle className="text-xl font-bold text-red-600">Delete Context</DialogTitle>
          </div>

          <div className="px-6 py-8 bg-white">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center">
                <Trash2 className="h-8 w-8 text-red-500" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-bold text-gray-800">Confirm Deletion</p>
                <p className="text-gray-500 max-w-xs">
                  Are you sure you want to remove this context entry? This action is permanent and cannot be reversed.
                </p>
              </div>
            </div>

            {selectedContext && (
              <div className="mt-8 p-4 bg-red-50/50 rounded-2xl border border-red-100 flex flex-col items-center">
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Target Context</span>
                <p className="text-sm font-bold text-red-700 text-center break-all">{selectedContext.context_text}</p>
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
            <Button
              variant="ghost"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-6 h-11 text-gray-500 font-semibold hover:bg-gray-100 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={actionLoading}
              className="px-8 h-11 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md shadow-red-200 transition-all active:scale-95 flex items-center gap-2"
            >
              {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Delete Permanently"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default ContextTab;
