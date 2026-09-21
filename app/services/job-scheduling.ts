import { API } from './axios';

export const jobScheduling = {
    updateDigitalFootprint: async () => {
        const response = await API.get("/api/v1/job-sch/update_digital_footprint");
        return response.data;
    },

    updateKeyMetrics: async () => {
        const response = await API.get("/api/v1/job-sch/update_key_metrics");
        return response.data;
    },

    updateRiskAssessment: async () => {
        const response = await API.get("/api/v1/job-sch/update_risk_percentiles_and_risk_scores");
        return response.data;
    },

    updateLinkages: async () => {
        const response = await API.get("/api/v1/job-sch/update_linkages");
        return response.data;
    },

    updateSummary: async () => {
        const response = await API.get("/api/v1/job-sch/update_summery");
        return response.data;
    },

    updateRedFlags: async () => {
        const response = await API.get("/api/v1/job-sch/generate_red_flag");
        return response.data;
    }
}