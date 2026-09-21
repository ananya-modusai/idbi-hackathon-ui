"use client";

import React, { FC, useMemo, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Flag, 
  Download, 
  Pencil, 
  Trash2, 
  AlertTriangle, 
  Plus 
} from "lucide-react";
import { CustomTableView } from "@/components/custom/CustomTableView";
import SectionHeaderWithFlags from "@/components/custom/SectionHeaderWithFlags";
import CustomListFilter, { useFilterState, FilterGroupsState } from "@/components/custom/CustomList/customListFilter";
import { SortActionButton, SortDirection } from "@/components/custom/CustomList/SortActionButton";
import { BubbleTag } from "@/components/custom/BubbleTag";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  fetchBannedCategories, 
  createBannedCategory, 
  updateBannedCategory, 
  deleteBannedCategory, 
  clearBannedCategoriesCache 
} from "@/app/services/caseServices";

export interface RestrictedCategoryDto {
  id: string;
  content: string;
  type?: string;
  updated_at: string;
}

const RestrictedCategoryTab: FC = () => {
  const [data, setData] = useState<RestrictedCategoryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState<RestrictedCategoryDto | null>(null);
  const [editContent, setEditContent] = useState("");
  const [addContent, setAddContent] = useState("");
  const [addType, setAddType] = useState<"BANNED" | "RESTRICTED">("RESTRICTED");
  const [editType, setEditType] = useState<"BANNED" | "RESTRICTED">("RESTRICTED");

  // Sorting state
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const loadRestrictedCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchBannedCategories("RESTRICTED");
      if (response && response.success) {
        setData((response.data || []) as any);
      }
    } catch (error) {
      console.error("Failed to fetch restricted categories:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRestrictedCategories();
  }, [loadRestrictedCategories]);

  const filterGroups: FilterGroupsState = useMemo(() => ({
    tertiary: [
      {
        id: "search",
        label: "Search",
        type: "searchbar" as const,
        options: [],
        selectedValues: [],
        onFilterChange: (values: string[]) => {},
        searchPlaceholder: "Search by category...",
        actionElements: (
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-white hover:bg-blue-50 text-blue-600 border border-blue-600 font-bold h-10 px-4 rounded-xl flex items-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
            <SortActionButton
              sortFields={[
                { key: 'updated_at', label: 'Last Updated' },
                { key: 'content', label: 'Category Name' }
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
        (item.content || "").toLowerCase().includes(query)
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
    
    const headers = ["S.NO", "Restricted Category", "Last Updated"];
    const csvContent = [
      headers.join(","),
      ...tableData.map(item => [
        item.serialNo,
        `"${String(item.content || "").replace(/"/g, '""')}"`,
        `"${formatDate(item.updated_at)}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `restricted_categories_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [tableData, data]);

  const handleEditClick = (category: RestrictedCategoryDto) => {
    setSelectedCategory(category);
    setEditContent(category.content);
    setEditType((category.type as any) === "BANNED" ? "BANNED" : "RESTRICTED");
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (category: RestrictedCategoryDto) => {
    setSelectedCategory(category);
    setIsDeleteModalOpen(true);
  };

  const handleCreate = async () => {
    if (!addContent.trim()) return;
    
    try {
      setActionLoading(true);
      await createBannedCategory(addContent, addType);
      alert("Category added successfully");
      setIsAddModalOpen(false);
      setAddContent("");
      setAddType("RESTRICTED"); // Reset to default tab type
      clearBannedCategoriesCache("BANNED");
      clearBannedCategoriesCache("RESTRICTED");
      loadRestrictedCategories();
    } catch (error) {
      alert("Failed to add category");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedCategory || !editContent.trim()) return;
    
    try {
      setActionLoading(true);
      await updateBannedCategory(selectedCategory.id, editContent, editType);
      alert("Category updated successfully");
      setIsEditModalOpen(false);
      clearBannedCategoriesCache("BANNED");
      clearBannedCategoriesCache("RESTRICTED");
      loadRestrictedCategories();
    } catch (error) {
      alert("Failed to update category");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;
    
    try {
      setActionLoading(true);
      await deleteBannedCategory(selectedCategory.id);
      alert("Category deleted successfully");
      setIsDeleteModalOpen(false);
      clearBannedCategoriesCache("BANNED");
      clearBannedCategoriesCache("RESTRICTED");
      loadRestrictedCategories();
    } catch (error) {
      alert("Failed to delete category");
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
        key: "content",
        header: "Restricted Category",
        minWidth: "420px",
        width: "420px",
        render: (val: string) => (
          <span className="font-semibold text-gray-800">{val || "N/A"}</span>
        ),
      },
      {
        key: "updated_at",
        header: "Last Updated",
        width: "200px",
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
        render: (_: any, row: RestrictedCategoryDto) => (
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
          title="Restricted Categories"
          icon={Flag}
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
            <DialogTitle className="text-xl font-bold text-blue-700">Add New Category</DialogTitle>
          </div>
          
          <div className="px-6 py-8 space-y-6 bg-white">
            <div className="space-y-2">
              <Label htmlFor="add-content" className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Category
              </Label>
              <Input
                id="add-content"
                value={addContent}
                onChange={(e) => setAddContent(e.target.value)}
                placeholder="Enter new category content..."
                className="w-full h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl shadow-sm transition-all"
              />
              <p className="text-xs text-gray-400">Specify the name of the category to add.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Type
              </Label>
              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
                <button
                  type="button"
                  onClick={() => setAddType("BANNED")}
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                    addType === "BANNED"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Banned
                </button>
                <button
                  type="button"
                  onClick={() => setAddType("RESTRICTED")}
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                    addType === "RESTRICTED"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Restricted
                </button>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
            <Button
              variant="ghost"
              onClick={() => setIsAddModalOpen(false)}
              disabled={actionLoading}
              className="px-6 h-11 text-gray-500 font-semibold hover:bg-gray-100 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!addContent.trim() || actionLoading}
              className="px-8 h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-200 transition-all active:scale-95 flex items-center gap-2"
            >
              Add Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-white px-6 py-5 flex items-center gap-3 border-b border-gray-100">
            <Pencil className="h-5 w-5 text-blue-600" />
            <DialogTitle className="text-xl font-bold text-blue-700">Edit Category</DialogTitle>
          </div>
          
          <div className="px-6 py-8 space-y-6 bg-white">
            <div className="space-y-2">
              <Label htmlFor="edit-content" className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Category
              </Label>
              <Input
                id="edit-content"
                value={editContent}
                disabled={actionLoading}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Enter category content..."
                className="w-full h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl shadow-sm transition-all"
              />
              <p className="text-xs text-gray-400">Update the description for this category.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Type
              </Label>
              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
                <button
                  type="button"
                  onClick={() => setEditType("BANNED")}
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                    editType === "BANNED"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Banned
                </button>
                <button
                  type="button"
                  onClick={() => setEditType("RESTRICTED")}
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                    editType === "RESTRICTED"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Restricted
                </button>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
            <Button
              variant="ghost"
              onClick={() => setIsEditModalOpen(false)}
              disabled={actionLoading}
              className="px-6 h-11 text-gray-500 font-semibold hover:bg-gray-100 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!editContent.trim() || actionLoading}
              className="px-8 h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-200 transition-all active:scale-95 flex items-center gap-2"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-white px-6 py-5 flex items-center gap-3 border-b border-gray-100">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <DialogTitle className="text-xl font-bold text-red-600">Delete Category</DialogTitle>
          </div>

          <div className="px-6 py-8 bg-white">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center">
                <Trash2 className="h-8 w-8 text-red-500" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-bold text-gray-800">Confirm Deletion</p>
                <p className="text-gray-500 max-w-xs">
                  Are you sure you want to remove this category? This action is permanent and cannot be reversed.
                </p>
              </div>
            </div>

            {selectedCategory && (
              <div className="mt-8 p-4 bg-red-50/50 rounded-2xl border border-red-100 flex flex-col items-center">
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Target Category</span>
                <p className="text-base font-bold text-red-700 text-center">{selectedCategory.content}</p>
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
            <Button
              variant="ghost"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={actionLoading}
              className="px-6 h-11 text-gray-500 font-semibold hover:bg-gray-100 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={actionLoading}
              className="px-8 h-11 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md shadow-red-200 transition-all active:scale-95 flex items-center gap-2"
            >
              Delete Permanently
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default RestrictedCategoryTab;
