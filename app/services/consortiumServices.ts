import { API } from './axios';
import axios from 'axios';

// Fixed base URL for consortium APIs
const CONSORTIUM_API_BASE_URL = 'https://94gnwh0cr9.execute-api.ap-south-1.amazonaws.com/dev/';
const INSTITUTION_API_BASE_URL = 'https://94gnwh0cr9.execute-api.ap-south-1.amazonaws.com/dev';

// Types
export interface InstitutionResponse {
  success: boolean;
  message: string;
  institutions: InstitutionData[];
}

export interface InstitutionData {
  id: number;
  institution_name: string;
  access_role: string;
  created_by: string;
  updated_by: string | null;
  status: string;
  institution_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface InsertSubmitRequest {
  identifiers: Array<{
    id: string;
    type: string;
  }>;
  metadata: {
    description: string;
  };
  institution_id: number;
  status: string;
  fraud_type: string;
  created_by: string;
  company_id: string;
}

export interface InsertSubmitResponse {
  success: boolean;
  message: string;
  insert_id?: string;
  identifiers?: Array<{
    id: string;
    type: string;
  }>;
  blinded_identifiers?: Array<{
    id: string;
    type: string;
  }>;
  institution?: {
    id: number;
    name: string;
    type: string;
  };
  status?: string;
  fraud_type?: string;
  fraud_status?: string;
  created_datetime?: string;
  last_updated_datetime?: string;
  response_time_ms?: number;
  error?: string;
}

export interface QueryRequest {
  identifiers: Array<{
    identifier: string;
    type: string;
  }>;
}

export interface QueryResponse {
  success: boolean;
  message: string;
  fraud_data: Array<{
    id: number;
    identifier: string;
    identifier_type: string;
    metadata: {
      description: string;
    };
    institution_id: number;
    institution_name?: string;
    institution_type?: string;
    created_by: string;
    status: string;
    fraud_type: string;
    created_at: string;
  }>;
  task_id: string;
  query_id: string;
  query_date: string;
  summary: {
    date: string;
    identifiers: number;
    institution: {
      name: string;
      type: string;
    };
    report_id: string;
    status: string;
  };
  processes: Array<{
    description: string;
    id: number;
    name: string;
    status: string;
    timestamp: string;
    progress?: number;
    total?: number;
  }>;
  timeline: Array<{
    date: string;
    event_id: string;
    event_type: string;
    identifier: string;
    identifier_type: string;
    institution: string;
    institution_type?: string;
    status: string;
    time: string;
  }>;
  institution: {
    name: string;
    type: string;
  };
  identifiers: Array<{
    past_1m: number;
    past_1y: number;
    total: number;
    type: string;
    values: Array<{
      id: string;
      status: string;
      type: string;
    }>;
  }>;
  blinded_identifiers?: Array<{
    id: string;
    type: string;
  }>;
  stats: {
    confirmed: number;
    first_match: string;
    latest_match: string;
    revoked: number;
    suspected: number;
    total_matches: number;
  };
  status?: string;
  response_time_ms?: number;
}

export interface InsertData {
  id: number;
  insertId: string;
  createdDatetime: string;
  lastUpdatedDatetime: string;
  institutionName: string;
  institutionId: number;
  institutionType: string;
  status: string;
  identifiers: Array<{
    encoded: string;
    type: string;
  }>;
  fraudType: string;
  fraudStatus: string;
  rowStatus: string;
}

export interface InsertsResponse {
  success: boolean;
  message: string;
  inserts: InsertData[];
  total?: number;
  limit?: number;
  offset?: number;
}

export interface InsertsFilters {
  status?: string[];
  identifier_type?: string[];
  fraud_type?: string[];
  fraud_status?: string[];
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Task Logs types for past queries
export interface TaskLog {
  taskId: string;
  taskType: string;
  blindedIdentifier: string;
  identifierType: string | null;
  status: string;
  response: QueryResponse | null;
  steps: Array<{
    description: string;
    status: string;
    step: string;
    timestamp: string;
  }>;
  notes: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  queryCompletedAt: string | null;
  startTime: string;
  endTime: string | null;
}

export interface TaskLogsResponse {
  success: boolean;
  message: string;
  taskLogs: TaskLog[];
  total: number;
}

export interface TaskLogsFilters {
  status?: string[];
  identifier_type?: string[];
  task_type?: string[];
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface UpdateFraudStatusRequest {
  fraud_id: number;
  status: string;
  fraud_type: string;
  updated_by: string;
}

export interface UpdateFraudStatusResponse {
  success: boolean;
  message: string;
  fraud_data?: {
    id: number;
    identifier: string;
    identifier_type: string;
    metadata: {
      description: string;
    };
    institution_id: number;
    created_by: string;
    created_at: string;
    updated_at: string;
    status: string;
    fraud_type: string;
    updated_by: string;
    association_id: string | null;
    row_status: string;
  };
  updated_at?: string;
  status?: string;
}

export interface RevokeFraudStatusRequest {
  fraud_id: number;
  revoked_by: string;
  reason: string;
}

export interface RevokeFraudStatusResponse {
  success: boolean;
  message: string;
  fraud_data?: {
    id: number;
    identifier: string;
    identifier_type: string;
    metadata: {
      description: string;
    };
    institution_id: number;
    created_by: string;
    created_at: string;
    updated_at: string;
    status: string;
    fraud_type: string;
    updated_by: string;
    association_id: string | null;
    row_status: string;
  };
  revoked_at?: string;
  status?: string;
}

export interface UserInstitutionResponse {
  id: number;
  institution_name: string;
  access_role: string;
  status: string;
  institution_type: string | null;
  created_at: string;
  updated_at: string;
}

// API endpoints
const ENDPOINTS = {
  INSTITUTIONS: `${CONSORTIUM_API_BASE_URL}/central/institutions`,
  USER_INSTITUTION: `/api/v1/consortium/institution`,
  SUBMIT_INSERT: (institutionId: number) => `${INSTITUTION_API_BASE_URL}/institution/${institutionId}/submit`,
  SUBMIT_QUERY: (institutionId: number) => `${INSTITUTION_API_BASE_URL}/institution/${institutionId}/query`,
  FETCH_INSERTS: (institutionId: number) => `${INSTITUTION_API_BASE_URL}/institution/${institutionId}/inserts`,
  FETCH_TASK_LOGS: (institutionId: number) => `${INSTITUTION_API_BASE_URL}/institution/${institutionId}/task-logs`,
  UPDATE_FRAUD_STATUS: (institutionId: number) => `${INSTITUTION_API_BASE_URL}/institution/${institutionId}/edit-fraud-status`,
  REVOKE_FRAUD_STATUS: (institutionId: number) => `${INSTITUTION_API_BASE_URL}/institution/${institutionId}/revoke-fraud-status`,
};

// Services
export const fetchInstitutions = async (): Promise<InstitutionResponse> => {
  try {
    // Using axios directly instead of the API instance to use the fixed base URL
    const response = await axios.get<InstitutionResponse>(ENDPOINTS.INSTITUTIONS);
    return response.data;
  } catch (error) {
    console.error('Error fetching institutions:', error);
    throw error;
  }
};

export const submitInsert = async (
  institutionId: number,
  data: InsertSubmitRequest
): Promise<InsertSubmitResponse> => {
  try {
    const response = await axios.post<InsertSubmitResponse>(
      ENDPOINTS.SUBMIT_INSERT(institutionId),
      data,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error submitting insert:', error);
    if (axios.isAxiosError(error) && error.response) {
      return {
        success: false,
        message: 'Failed to submit insert',
        error: error.response.data?.message || error.message
      };
    }
    throw error;
  }
};

export const submitQuery = async (
  institutionId: number,
  data: QueryRequest
): Promise<QueryResponse> => {
  try {
    console.log(`Calling query API with institutionId: ${institutionId}, data:`, data);
    
    // Use the actual API call instead of the mock response
    const response = await axios.post<QueryResponse>(
      ENDPOINTS.SUBMIT_QUERY(institutionId),
      data,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log("API response received:", response.data);
    return response.data;
  } catch (error) {
    console.error('Error submitting query:', error);
    throw error;
  }
};

export const fetchInserts = async (
  institutionId: number,
  filters: InsertsFilters = {}
): Promise<InsertsResponse> => {
  try {
    const params = new URLSearchParams();
    
    // Add filters to query parameters
    if (filters.status && filters.status.length > 0) {
      params.append('status', filters.status.join(','));
    }
    if (filters.identifier_type && filters.identifier_type.length > 0) {
      params.append('identifier_type', filters.identifier_type.join(','));
    }
    if (filters.fraud_type && filters.fraud_type.length > 0) {
      params.append('fraud_type', filters.fraud_type.join(','));
    }
    if (filters.fraud_status && filters.fraud_status.length > 0) {
      params.append('fraud_status', filters.fraud_status.join(','));
    }
    if (filters.sort_by) {
      params.append('sort_by', filters.sort_by);
    }
    if (filters.sort_order) {
      params.append('sort_order', filters.sort_order);
    }
    if (filters.limit) {
      params.append('limit', filters.limit.toString());
    }
    if (filters.offset) {
      params.append('offset', filters.offset.toString());
    }

    const queryString = params.toString();
    const url = queryString ? `${ENDPOINTS.FETCH_INSERTS(institutionId)}?${queryString}` : ENDPOINTS.FETCH_INSERTS(institutionId);
    console.log('Fetching inserts with URL:', url);
    
    const response = await axios.get<InsertsResponse>(url, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching inserts:', error);
    if (axios.isAxiosError(error) && error.response) {
      return {
        success: false,
        message: error.response.data?.message || 'Failed to fetch inserts',
        inserts: []
      };
    }
    throw error;
  }
};

export const fetchTaskLogs = async (
  institutionId: number,
  filters: TaskLogsFilters = {}
): Promise<TaskLogsResponse> => {
  try {
    const params = new URLSearchParams();
    
    // Add filters to query parameters
    if (filters.status && filters.status.length > 0) {
      params.append('status', filters.status.join(','));
    }
    if (filters.identifier_type && filters.identifier_type.length > 0) {
      params.append('identifier_type', filters.identifier_type.join(','));
    }
    if (filters.task_type && filters.task_type.length > 0) {
      params.append('task_type', filters.task_type.join(','));
    }
    if (filters.sort_by) {
      params.append('sort_by', filters.sort_by);
    }
    if (filters.sort_order) {
      params.append('sort_order', filters.sort_order);
    }
    if (filters.limit) {
      params.append('limit', filters.limit.toString());
    }
    if (filters.offset) {
      params.append('offset', filters.offset.toString());
    }

    const queryString = params.toString();
    const url = queryString ? `${ENDPOINTS.FETCH_TASK_LOGS(institutionId)}?${queryString}` : ENDPOINTS.FETCH_TASK_LOGS(institutionId);
    console.log('Fetching task logs with URL:', url);
    
    const response = await axios.get<TaskLogsResponse>(url, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching task logs:', error);
    if (axios.isAxiosError(error) && error.response) {
      return {
        success: false,
        message: error.response.data?.message || 'Failed to fetch task logs',
        taskLogs: [],
        total: 0
      };
    }
    throw error;
  }
}; 

export const updateFraudStatus = async (
  institutionId: number,
  data: UpdateFraudStatusRequest
): Promise<UpdateFraudStatusResponse> => {
  try {
    const response = await axios.put<UpdateFraudStatusResponse>(
      ENDPOINTS.UPDATE_FRAUD_STATUS(institutionId),
      data,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating fraud status:', error);
    if (axios.isAxiosError(error) && error.response) {
      return {
        success: false,
        message: error.response.data?.message || 'Failed to update fraud status'
      };
    }
    throw error;
  }
};

export const revokeFraudStatus = async (
  institutionId: number,
  data: RevokeFraudStatusRequest
): Promise<RevokeFraudStatusResponse> => {
  try {
    const response = await axios.delete<RevokeFraudStatusResponse>(
      ENDPOINTS.REVOKE_FRAUD_STATUS(institutionId),
      {
        headers: {
          'Content-Type': 'application/json'
        },
        data: data
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error revoking fraud status:', error);
    if (axios.isAxiosError(error) && error.response) {
      return {
        success: false,
        message: error.response.data?.message || 'Failed to revoke fraud status'
      };
    }
    throw error;
  }
}; 

export const fetchUserInstitution = async (): Promise<UserInstitutionResponse | null> => {
  try {
    const response = await API.get<UserInstitutionResponse>(ENDPOINTS.USER_INSTITUTION);
    return response.data;
  } catch (error) {
    console.error('Error fetching user institution:', error);
    return null;
  }
}; 