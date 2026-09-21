"use client";

import React, { FC, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Info, HeartPulse, ShieldCheck, Scale } from 'lucide-react';
import { useInvestigationCaseStore } from '@/app/store/investigation/investigationCaseStore';
import InvPageHeader from '../Components/InvPageHeader';
import { ArtifactSectionCollapsible } from '@/components/custom/ArtifactSectionCollapsible';
import FinancialHealthStatement from './components/FinancialHealthStatement';
import { CustomTableView } from '@/components/custom/CustomTableView';
import CustomListFilter, { useFilterState, FilterGroupsState } from '@/components/custom/CustomList/customListFilter';

const creditWorthinessData: any[] = [];
const legalHistoryData: any[] = [];

interface InvCreditLimitProfileTabProps {
    merchantId?: string;
    caseId?: string;
}

const InvCreditLimitProfileTab: FC<InvCreditLimitProfileTabProps> = ({ merchantId, caseId }) => {
    const { selectedCase } = useInvestigationCaseStore();

    const caseStatusOptions = useMemo(() => {
        const statuses = Array.from(new Set(legalHistoryData.map(item => item.caseStatus).filter(Boolean)));
        return statuses.map(status => ({ value: status, label: status }));
    }, []);

    const caseCategoryOptions = useMemo(() => {
        const categories = Array.from(new Set(legalHistoryData.map(item => item.caseCategory).filter(Boolean)));
        return categories.map(category => ({ value: category, label: category }));
    }, []);

    const courtOptions = useMemo(() => {
        const courts = Array.from(new Set(legalHistoryData.map(item => item.court).filter(Boolean)));
        return courts.map(court => ({ value: court, label: court }));
    }, []);

    const filterGroups = useMemo<FilterGroupsState>(() => ({
        primary: [
            {
                id: "caseStatus",
                label: "Case Status",
                type: "multiselect" as const,
                options: caseStatusOptions,
                selectedValues: [],
                onFilterChange: () => { }
            },
            {
                id: "caseCategory",
                label: "Case Category",
                type: "multiselect" as const,
                options: caseCategoryOptions,
                selectedValues: [],
                onFilterChange: () => { }
            },
            {
                id: "court",
                label: "Court",
                type: "multiselect" as const,
                options: courtOptions,
                selectedValues: [],
                onFilterChange: () => { }
            }
        ]
    }), [caseStatusOptions, caseCategoryOptions, courtOptions]);

    const { filterState, setFilterState } = useFilterState(filterGroups);

    const filteredLegalHistoryData = useMemo(() => {
        return legalHistoryData.filter(item => {
            const selectedCaseStatuses = filterState.primarySelected["caseStatus"] || [];
            const selectedCaseCategories = filterState.primarySelected["caseCategory"] || [];
            const selectedCourts = filterState.primarySelected["court"] || [];

            if (selectedCaseStatuses.length > 0 && !selectedCaseStatuses.includes(item.caseStatus)) {
                return false;
            }
            if (selectedCaseCategories.length > 0 && !selectedCaseCategories.includes(item.caseCategory)) {
                return false;
            }
            if (selectedCourts.length > 0 && !selectedCourts.includes(item.court)) {
                return false;
            }
            return true;
        });
    }, [filterState]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const creditWorthinessColumns = [
        {
            key: "sNo",
            header: "S.NO",
            align: "left" as const,
            width: "80px"
        },
        {
            key: "date",
            header: "DATE",
            align: "left" as const,
            width: "150px"
        },
        {
            key: "ratingAgency",
            header: "RATING AGENCY",
            align: "left" as const,
            width: "200px"
        },
        {
            key: "type",
            header: "TYPE",
            align: "left" as const,
            width: "250px"
        },
        {
            key: "rating",
            header: "RATING",
            align: "left" as const,
            width: "250px"
        }
    ];

    const legalHistoryColumns = [
        {
            key: "caseNo",
            header: "Case No.",
            align: "left" as const,
            width: "200px"
        },
        {
            key: "caseType",
            header: "Case Type",
            align: "left" as const,
            width: "220px"
        },
        {
            key: "caseStatus",
            header: "Case Status",
            align: "left" as const,
            width: "130px"
        },
        {
            key: "caseCategory",
            header: "Case Category",
            align: "left" as const,
            width: "180px"
        },
        {
            key: "court",
            header: "Court",
            align: "left" as const,
            width: "250px"
        },
        {
            key: "litigants",
            header: "Litigant(s)",
            align: "left" as const,
            width: "350px"
        },
        {
            key: "lastHearingDate",
            header: "Date of Last Hearing / Judgement",
            align: "left" as const,
            width: "220px"
        }
    ];

    return (
        <motion.div
            className="space-y-6 px-2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {selectedCase && (
                <motion.div variants={itemVariants}>
                    <InvPageHeader activeCase={selectedCase} />
                </motion.div>
            )}

            <motion.div variants={itemVariants} className="">
                <ArtifactSectionCollapsible
                    defaultOpen={false}
                    title={
                        <div className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-blue-600" />
                            <span className="text-lg font-semibold text-gray-900">
                                Exposure & Limit Recommendation
                            </span>
                        </div>
                    }
                >
                    <div className="mt-4 flex flex-col items-center justify-center py-16 px-4 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-50 text-blue-600 mb-4 shadow-sm">
                            <Info className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-medium text-gray-500 text-center max-w-lg leading-relaxed">
                            Exposure & Limit Recommendation is under discussion. This section will be built once the sanctioning logic is finalised.
                        </p>
                    </div>
                </ArtifactSectionCollapsible>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-4">
                <ArtifactSectionCollapsible
                    defaultOpen={false}
                    title={
                        <div className="flex items-center gap-2">
                            <HeartPulse className="h-5 w-5 text-blue-600" />
                            <span className="text-lg font-semibold text-gray-900">
                                Financial Health
                            </span>
                        </div>
                    }
                >
                    <div className="mt-2">
                        <FinancialHealthStatement merchantId={merchantId} />
                    </div>
                </ArtifactSectionCollapsible>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-4 pt-4">
                <ArtifactSectionCollapsible
                    defaultOpen={false}
                    title={
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-blue-600" />
                            <span className="text-lg font-semibold text-gray-900">
                                Credit Worthiness
                            </span>
                        </div>
                    }
                >
                    <div className="mt-2 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                        <CustomTableView
                            columns={creditWorthinessColumns}
                            data={creditWorthinessData}
                            initialRowLimit={5}
                            isExpanded={true}
                            showCSVExport={false}
                            enableAlternatingRows={true}
                            alternatingRowColor="gray"
                        />
                    </div>
                </ArtifactSectionCollapsible>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-4 pt-4">
                <ArtifactSectionCollapsible
                    defaultOpen={false}
                    title={
                        <div className="flex items-center gap-2">
                            <Scale className="h-5 w-5 text-blue-600" />
                            <span className="text-lg font-semibold text-gray-900">
                                Legal History
                            </span>
                        </div>
                    }
                >
                    <div className="mb-2 max-w-5xl">
                        <CustomListFilter
                            filterGroups={filterGroups}
                            filterState={filterState}
                            setFilterState={setFilterState}
                            showFilterToggle={false}
                            showToggleOptionCounts={false}
                        />
                    </div>
                    <div className="mt-2 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                        <CustomTableView
                            columns={legalHistoryColumns}
                            data={filteredLegalHistoryData}
                            initialRowLimit={5}
                            isExpanded={true}
                            showCSVExport={false}
                            enableAlternatingRows={true}
                            alternatingRowColor="gray"
                        />
                    </div>
                </ArtifactSectionCollapsible>
            </motion.div>
        </motion.div>
    );
};

export default InvCreditLimitProfileTab;
