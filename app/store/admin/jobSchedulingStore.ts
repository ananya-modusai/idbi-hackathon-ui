import { create } from "zustand";
import { jobScheduling } from "@/app/services/job-scheduling";

interface JobSchedulingStore {
    isLoading: {
        digitalFootprint: boolean;
        keyMetrics: boolean;
        riskAssessment: boolean;
        linkages: boolean;
        summary: boolean;
        redFlags: boolean;
    };
    responses: {
        digitalFootprint: any;
        keyMetrics: any;
        riskAssessment: any;
        linkages: any;
        summary: any;
        redFlags: any;
    };
    updateDigitalFootprint: () => Promise<void>;
    updateKeyMetrics: () => Promise<void>;
    updateRiskAssessment: () => Promise<void>;
    updateLinkages: () => Promise<void>;
    updateSummary: () => Promise<void>;
    updateRedFlags: () => Promise<void>;
    runAllJobs: () => Promise<void>;
}

export const useJobSchedulingStore = create<JobSchedulingStore>((set) => ({
    isLoading: {
        digitalFootprint: false,
        keyMetrics: false,
        riskAssessment: false,
        linkages: false,
        summary: false,
        redFlags: false,
        },
    responses: {
        digitalFootprint: null,
        keyMetrics: null,
        riskAssessment: null,
        linkages: null,
        summary: null,
        redFlags: null,
    },
    updateDigitalFootprint: async () => {
        set((state) => ({
            isLoading: { ...state.isLoading, digitalFootprint: true }
        }));
        try {
            const response = await jobScheduling.updateDigitalFootprint();
            set((state) => ({
                responses: { ...state.responses, digitalFootprint: response }
            }));
        } finally {
            set((state) => ({
                isLoading: { ...state.isLoading, digitalFootprint: false }
            }));
        }
    },
    updateKeyMetrics: async () => {
        set((state) => ({
            isLoading: { ...state.isLoading, keyMetrics: true }
        }));
        try {
            const response = await jobScheduling.updateKeyMetrics();
            set((state) => ({
                responses: { ...state.responses, keyMetrics: response }
            }));
        } finally {
            set((state) => ({
                isLoading: { ...state.isLoading, keyMetrics: false }
            }));
        }
    },
    updateRiskAssessment: async () => {
        set((state) => ({
            isLoading: { ...state.isLoading, riskAssessment: true }
        }));
        try {
            const response = await jobScheduling.updateRiskAssessment();
            set((state) => ({
                responses: { ...state.responses, riskAssessment: response }
            }));
        } finally {
            set((state) => ({
                isLoading: { ...state.isLoading, riskAssessment: false }
            }));
        }
    },
    updateLinkages: async () => {
        set((state) => ({
            isLoading: { ...state.isLoading, linkages: true }
        }));
        try {
            const response = await jobScheduling.updateLinkages();
            set((state) => ({
                responses: { ...state.responses, linkages: response }
            }));
        } finally {
            set((state) => ({
                isLoading: { ...state.isLoading, linkages: false }
            }));
        }
    },
    updateSummary: async () => {
        set((state) => ({
            isLoading: { ...state.isLoading, summary: true }
        }));
        try {
            const response = await jobScheduling.updateSummary();
            set((state) => ({
                responses: { ...state.responses, summary: response }
            }));
        } finally {
            set((state) => ({
                isLoading: { ...state.isLoading, summary: false }
            }));
        }
    },
    updateRedFlags: async () => {
        set((state) => ({
            isLoading: { ...state.isLoading, redFlags: true }
        }));
        try {
            const response = await jobScheduling.updateRedFlags();
            set((state) => ({
                responses: { ...state.responses, redFlags: response }
            }));
        } finally {
            set((state) => ({
                isLoading: { ...state.isLoading, redFlags: false }
            }));
        }
    },
    runAllJobs: async () => {
        const jobs = [
            { key: 'digitalFootprint', fn: jobScheduling.updateDigitalFootprint },
            { key: 'keyMetrics', fn: jobScheduling.updateKeyMetrics },
            { key: 'riskAssessment', fn: jobScheduling.updateRiskAssessment },
            { key: 'linkages', fn: jobScheduling.updateLinkages },
            { key: 'summary', fn: jobScheduling.updateSummary },
            { key: 'redFlags', fn: jobScheduling.updateRedFlags }
        ];

        set((state) => ({
            isLoading: Object.keys(state.isLoading).reduce((acc, key) => ({
                ...acc,
                [key]: true
            }), state.isLoading)
        }));

        try {
            const promises = jobs.map(async (job) => {
                try {
                    const result = await job.fn();
                    set((state) => ({
                        isLoading: {
                            ...state.isLoading,
                            [job.key]: false
                        },
                        responses: {
                            ...state.responses,
                            [job.key]: result
                        }
                    }));
                    return result;
                } catch (error) {
                    set((state) => ({
                        isLoading: {
                            ...state.isLoading,
                            [job.key]: false
                        }
                    }));
                    throw error;
                }
            });

            await Promise.all(promises);
        } catch (error) {
            console.error('Error in runAllJobs:', error);
        }
    }
}));    