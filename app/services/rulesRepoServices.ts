import { API } from './axios';
import { RulesType, MetricsType, LlmMetricsType, Rule, Metric, LlmMetric } from "@/app/types";

// Define rule creation interfaces
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

export const rulesRepoServices = {
    // Rules
    getRules: async (skip: number = 0, limit: number = 100, includeDeleted: boolean = true): Promise<RulesType> => {
        try {
            console.log('Fetching rules with params:', { skip, limit, includeDeleted });
            
            const response = await API.get(`/api/v1/rules/rules/`, {
                params: { 
                    skip, 
                    limit, 
                    include_deleted: includeDeleted 
                },
                // Add timeout to prevent hanging requests
                timeout: 10000
            });
            
            console.log('API Response Status:', response.status);
            
            // Handle different response structures
            let responseData = response.data;
            
            // Check if the response is wrapped in a data property
            if (responseData && responseData.data && Array.isArray(responseData.data)) {
                console.log('Standard API response structure detected');
            } 
            // If the response is an array directly
            else if (Array.isArray(responseData)) {
                console.log('Direct array response structure detected');
                responseData = { data: responseData };
            } 
            // If the response has a different structure
            else if (responseData && typeof responseData === 'object') {
                console.log('Custom response structure detected');
                // Try to find an array property in the response
                const arrayProps = Object.keys(responseData).filter(key => 
                    Array.isArray(responseData[key])
                );
                
                if (arrayProps.length > 0) {
                    console.log('Found array property:', arrayProps[0]);
                    responseData = { data: responseData[arrayProps[0]] };
                } else {
                    console.error('No array found in response:', responseData);
                    // Fallback to empty array
                    responseData = { data: [] };
                }
            } else {
                console.error('Unexpected response structure:', responseData);
                responseData = { data: [] };
            }
            
            // Transform the API response to match the expected RulesType structure
            const transformedData = {
                data: (responseData.data || []).map((item: any) => {
                    // Handle case where item might be a string or primitive
                    if (typeof item !== 'object' || item === null) {
                        console.warn('Invalid item in response:', item);
                        return {
                            rule_code: 'unknown',
                            rule_name: 'Unknown Rule',
                            rule_description: '',
                            rule_status: true,
                            rule_type: '',
                            rule_severity: 'Low',
                            fraud_type: '',
                            metric_equation: { operator: "AND", conditions: [] }
                        };
                    }
                    
                    // Convert the new rule format to the old metric_equation format
                    let metric_equation = { operator: "AND", conditions: [] };
                    
                    if (item.rule) {
                        try {
                            metric_equation = convertRuleToMetricEquation(item.rule);
                        } catch (err) {
                            console.error('Error converting rule format:', err);
                        }
                    }
                    
                    return {
                        rule_code: item.code || item.id || item.rule_code || '',
                        rule_name: item.name || item.rule_name || '',
                        rule_description: item.description || item.rule_description || '',
                        rule_status: item.status ?? item.is_active ?? item.rule_status ?? true,
                        rule_type: item.type || item.rule_type || '',
                        rule_severity: item.severity || item.rule_severity || 'Low',
                        fraud_type: item.fraud_type || '',
                        metric_equation: metric_equation,
                        // Additional fields from new API
                        id: item.id || '',
                        version: item.version || 1,
                        created_at: item.created_at || '',
                        updated_at: item.updated_at || '',
                        created_by: item.created_by || '',
                        updated_by: item.updated_by || '',
                        raw_rule: item.rule || {} // Store the original rule format
                    };
                })
            };
            
            console.log('Transformed data:', transformedData);
            return transformedData;
        } catch (error: any) {
            console.error('Error fetching rules:', error);
            
            // More detailed error logging
            if (error.response) {
                // The request was made and the server responded with a status code
                console.error('Error response data:', error.response.data);
                console.error('Error response status:', error.response.status);
                
                // Handle specific error cases
                if (error.response.status === 401) {
                    console.error('Authentication error: User is not authenticated');
                } else if (error.response.status === 500) {
                    console.error('Server error: The API encountered an internal error');
                }
                
                // Specific handling for validation errors
                if (error.response.data && error.response.data.detail) {
                    console.error('Validation Error Detail:', error.response.data.detail);
                }
            } else if (error.request) {
                // The request was made but no response was received
                console.error('No response received:', error.request);
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error('Error message:', error.message);
            }
            
           
            
            // Return an empty data set to prevent breaking the UI
            return { data: [] };
        }
    },

    // Create a new rule
    createRule: async (ruleData: CreateRuleRequest): Promise<CreateRuleResponse> => {
        try {
            console.log('Creating rule with data:', JSON.stringify(ruleData, null, 2));
            
            // Check the rule structure and see if any adjustments need to be made
            let payload = ruleData;
            
            // Only make changes if we have a problem with both "and" and "or" at the top level
            if (ruleData.rule.and?.length && ruleData.rule.or?.length) {
                console.log('Detected both AND and OR conditions at top level - restructuring');
                
                // Create a properly structured rule payload that nests OR inside AND
                payload = {
                    ...ruleData,
                    rule: {
                        and: [
                            ...ruleData.rule.and,
                            {
                                or: ruleData.rule.or
                            } as any // Type assertion to satisfy TypeScript
                        ]
                    }
                };
            }
            
            console.log('Sending payload to API:', JSON.stringify(payload, null, 2));
            
            // Create the rule
            const response = await API.post<CreateRuleResponse>('/api/v1/rules/rules/', payload);
            
            console.log('Rule created successfully:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Error creating rule:', error);
            
            // Detailed error logging
            if (error.response) {
                console.error('Error response data:', error.response.data);
                console.error('Error response status:', error.response.status);
            }
            
            throw error;
        }
    },

    // Metrics
    getMetrics: async (): Promise<MetricsType> => {
        try {
            const response = await API.get(`/api/v1/rule-repo/metrics`);
            return response.data;
        } catch (error) {
            console.error('Error fetching metrics:', error);
            return { data: [] };
        }
    },

    // LLM Metrics
    getLlmMetrics: async (): Promise<LlmMetricsType> => {
        try {
            const response = await API.get(`/api/v1/rule-repo/LLM_metrics`);
            return response.data;
        } catch (error) {
            console.error('Error fetching LLM metrics:', error);
            return { data: [] };
        }
    },

    // Update Rules
    updateRule: async (email: string, rule_code: string, rule_status: boolean, rule_severity: "High" | "Medium" | "Low" | "Critical") => {
        try {
            const response = await API.post(`/api/v1/rule-repo/${email}/${rule_code}/update_rule`, {
                severity: rule_severity,
                active_status: rule_status
            });
            return response.data;
        } catch (error) {
            console.error('Error updating rule:', error);
            throw error;
        }
    },

    // Update a Numeric Metric
    updateNumericMetric: async (email: string, metric_name: string, rule_code: string, metric_value: number, metric_operation: string) => {
        const response = await API.post(`/api/v1/rule-repo/${email}/${metric_name}/${rule_code}/update_a_rule_metric_numeric`, {
            value: metric_value,    
            operation: metric_operation
        });
        return response.data;
    },

    // Update a String Metric
    updateStringMetric: async (email: string, metric_name: string, rule_code: string, metric_value: string, metric_operation: string) => {
        const response = await API.post(`/api/v1/rule-repo/${email}/${metric_name}/${rule_code}/update_a_rule_metric_string`, {
            value: metric_value,
            operation: metric_operation
        });
        return response.data;
    },

    // Update a Boolean Metric
    updateBooleanMetric: async (email: string, metric_name: string, rule_code: string, metric_value: boolean, metric_operation: string) => {
        const response = await API.post(`/api/v1/rule-repo/${email}/${metric_name}/${rule_code}/update_a_rule_metric_boolean`, {
            value: metric_value,
            operation: metric_operation
        });
        return response.data;
    },

    // Update LLM Metrics
    updateLlmMetric: async (email: string, llmMetric_name: string, llmMetric_severity: "High" | "Medium" | "Low" | "Critical", llmMetric_active_status: boolean) => {
        const response = await API.post(`/api/v1/rule-repo/${email}/${llmMetric_name}/update_LLM_metric`, {
            severity: llmMetric_severity,
            active_status: llmMetric_active_status
        });
        return response.data;
    }

}

// Helper function to convert the new rule format to the old metric_equation format
function convertRuleToMetricEquation(rule: any): any {
    // If it's already in the expected format, return as is
    if (rule.operator && Array.isArray(rule.conditions)) {
        return rule;
    }
    
    // Handle the case where the top level is "and" or "or"
    if (rule.and) {
        return {
            operator: "AND",
            conditions: rule.and.map((condition: any) => convertRuleToMetricEquation(condition))
        };
    } else if (rule.or) {
        return {
            operator: "OR",
            conditions: rule.or.map((condition: any) => convertRuleToMetricEquation(condition))
        };
    }
    
    // Handle leaf conditions (simple condition with table, value, operator, condition)
    if (rule.table && rule.condition) {
        // Convert to BaseMetricCondition
        return {
            metric_name: rule.condition,
            operation: convertOperator(rule.operator),
            value: rule.value,
            type: getValueType(rule.value)
        };
    }
    
    // Default return
    return {
        operator: "AND",
        conditions: []
    };
}

// Helper function to convert operator formats
function convertOperator(operator: string): string {
    const operatorMap: Record<string, string> = {
        '>': '>',
        '<': '<',
        '>=': '>=',
        '<=': '<=',
        '==': '=',
        'in': 'is in',
        '!=': '!='
    };
    
    return operatorMap[operator] || operator;
}

// Helper function to determine value type
function getValueType(value: any): string {
    if (typeof value === 'number') return 'numeric';
    if (typeof value === 'boolean') return 'boolean';
    return 'string';
}