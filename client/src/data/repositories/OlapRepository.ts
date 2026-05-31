/**
 * data/repositories/OlapRepository.ts
 * -------------------------------------
 * Implementacion concreta del puerto IOlapRepository.
 * Consume la REST API del backend via apiClient.
 */

import { apiClient } from '../api/apiClient';
import type { IOlapRepository } from '../../core/ports/IOlapRepository';
import type {
  OLAPResponse,
  CategorySales,
  RegionSales,
  MonthlyTrend,
  DiscountImpact,
  SegmentProfit,
  SubcategoryAnalysis,
} from '../../core/models/olap.types';

export class OlapRepository implements IOlapRepository {
  getSalesByCategory() {
    return apiClient.get<OLAPResponse<CategorySales>>('/olap/sales-by-category');
  }
  getSalesByRegion() {
    return apiClient.get<OLAPResponse<RegionSales>>('/olap/sales-by-region');
  }
  getMonthlyTrend() {
    return apiClient.get<OLAPResponse<MonthlyTrend>>('/olap/monthly-trend');
  }
  getDiscountImpact() {
    return apiClient.get<OLAPResponse<DiscountImpact>>('/olap/discount-impact');
  }
  getProfitBySegment() {
    return apiClient.get<OLAPResponse<SegmentProfit>>('/olap/profit-by-segment');
  }
  getSubcategoryAnalysis() {
    return apiClient.get<OLAPResponse<SubcategoryAnalysis>>('/olap/subcategory-analysis');
  }
}
