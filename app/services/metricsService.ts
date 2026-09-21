

import { API } from './axios';

export interface APIMetric {
  [key: string]: any; // Dynamic year keys (2020, 2021, etc.)
  metric: string;
  metric_code: string;
  description: string;
  normal_range: string;
  industry_median: number;
  formula: string;
  category: string;
  threshold_1: number;
  threshold_2: number;
  threshold_redflag_sign: string;
  Bucket: string;
  bucket?: string;
}

export interface MetricsResponse {
  metrics: APIMetric[];
}

export const metricsService = {
  // internal cache and in-flight promise maps to prevent duplicate network calls
  _metricsCache: new Map<string, MetricsResponse>(),
  _metricsPromises: new Map<string, Promise<MetricsResponse>>(),

  async getMetricsByYear(merchantId: string): Promise<MetricsResponse> {
    const cacheKey = `metricsByYear_${merchantId}`;

    // return cached value if present
    if (metricsService._metricsCache.has(cacheKey)) {
      return Promise.resolve(metricsService._metricsCache.get(cacheKey)!);
    }

    // return in-flight promise if already requested
    if (metricsService._metricsPromises.has(cacheKey)) {
      return metricsService._metricsPromises.get(cacheKey)!;
    }

    const promise = (async () => {
      try {
        console.log('Fetching metrics for merchant:', merchantId);
        const response = await API.get(`/api/v1/metrics/display-metrics-by-year`, {
          params: { merchant_id: merchantId }
        });
        console.log('Metrics API response:', response.data);
        metricsService._metricsCache.set(cacheKey, response.data);
        return response.data;
      } catch (error) {
        console.error('Error fetching metrics:', error);
        throw error;
      } finally {
        metricsService._metricsPromises.delete(cacheKey);
      }
    })();

    metricsService._metricsPromises.set(cacheKey, promise);
    return promise;
  },

  // helper to clear cached metrics (single or all)
  clearMetricsCache(merchantId?: string) {
    if (merchantId) {
      const cacheKey = `metricsByYear_${merchantId}`;
      metricsService._metricsCache.delete(cacheKey);
      metricsService._metricsPromises.delete(cacheKey);
    } else {
      metricsService._metricsCache.clear();
      metricsService._metricsPromises.clear();
    }
  }
};
