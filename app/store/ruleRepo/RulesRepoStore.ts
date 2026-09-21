import { rulesRepoServices } from "@/app/services/rulesRepoServices";
import { LlmMetric, LlmMetricsType, Metric, MetricsType, Rule, RulesType } from "@/app/types";
import { create } from "zustand";

// Import the types from rulesRepoServices
interface ConditionItem {
  table: string;
  condition: string;
  operator: string;
  value: string | number;
}

// Make RuleStructure recursive to support nested conditions
interface RuleStructure {
  and?: (ConditionItem | RuleStructure)[];
  or?: (ConditionItem | RuleStructure)[];
}

interface CreateRuleRequest {
  code: string;
  name: string;
  description: string;
  type: string;
  severity: string;
  fraud_type: string;
  rule: RuleStructure;
}

interface CreateRuleResponse {
  id: string;
  code: string;
  name: string;
  description: string;
  status: boolean;
  type: string;
  severity: string;
  fraud_type: string;
  rule: Record<string, unknown>;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

interface RulesRepoStore {
    rules: RulesType;
    metrics: MetricsType;
    llmMetrics: LlmMetricsType;

    // Rules
    getRules: (skip: number, limit: number, includeDeleted: boolean) => Promise<void>;
    updateRule: (email: string, rule_code: string, rule_status: boolean, rule_severity: "High" | "Medium" | "Low" | "Critical") => Promise<void>;
    createRule: (ruleData: CreateRuleRequest) => Promise<CreateRuleResponse>;

    // Metrics
    getMetrics: () => Promise<void>;
    updateNumericMetric: (email: string, metric_name: string, rule_code: string, metric_value: number, metric_operation: string) => Promise<any>;
    updateStringMetric: (email: string, metric_name: string, rule_code: string, metric_value: string, metric_operation: string) => Promise<any>;
    updateBooleanMetric: (email: string, metric_name: string, rule_code: string, metric_value: boolean, metric_operation: string) => Promise<any>;

    // LLM Metrics
    getLlmMetrics: () => Promise<void>;
    updateLlmMetric: (email: string, llmMetric_name: string, llmMetric_severity: "High" | "Medium" | "Low" | "Critical", llmMetric_active_status: boolean) => Promise<any>;
}

export const useRulesRepoStore = create<RulesRepoStore>((set) => ({
    rules: { data: [] },
    metrics: { data: [] },
    llmMetrics: { data: [] },

    // Rules
    getRules: async (skip: number = 0, limit: number = 100, includeDeleted: boolean = true) => {
        const rules = await rulesRepoServices.getRules(skip, limit, includeDeleted);
        set({ rules });
    },

    // Create Rule
    createRule: async (ruleData: CreateRuleRequest) => {
        const response = await rulesRepoServices.createRule(ruleData);
        // Refresh rules after creating a new one
        const rules = await rulesRepoServices.getRules(0, 100, true);
        set({ rules });
        return response;
    },
    
    // Metrics
    getMetrics: async () => {
        const metrics = await rulesRepoServices.getMetrics();
        set({ metrics });
    },

    // LLM Metrics
    getLlmMetrics: async () => {
        const llmMetrics = await rulesRepoServices.getLlmMetrics();
        set({ llmMetrics });
    },

    // Update Rules
    updateRule: async (email: string, rule_code: string, rule_status: boolean, rule_severity: "High" | "Medium" | "Low" | "Critical") => {
        const response = await rulesRepoServices.updateRule(email, rule_code, rule_status, rule_severity);
        return response;
    },

    // Update Metrics
    updateNumericMetric: async (email: string, metric_name: string, rule_code: string, metric_value: number, metric_operation: string) => {
        const response = await rulesRepoServices.updateNumericMetric(email, metric_name, rule_code, metric_value, metric_operation);
        return response;
    },

    // Update String Metric
    updateStringMetric: async (email: string, metric_name: string, rule_code: string, metric_value: string, metric_operation: string) => {
        const response = await rulesRepoServices.updateStringMetric(email, metric_name, rule_code, metric_value, metric_operation);
        return response;
    },

    // Update Boolean Metric
    updateBooleanMetric: async (email: string, metric_name: string, rule_code: string, metric_value: boolean, metric_operation: string) => {
        const response = await rulesRepoServices.updateBooleanMetric(email, metric_name, rule_code, metric_value, metric_operation);
        return response;
    },

    // Update LLM Metrics
    updateLlmMetric: async (email: string, llmMetric_name: string, llmMetric_severity: "High" | "Medium" | "Low" | "Critical", llmMetric_active_status: boolean) => {
        const response = await rulesRepoServices.updateLlmMetric(email, llmMetric_name, llmMetric_severity, llmMetric_active_status);
        return response;
    }
}));        