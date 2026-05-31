/**
 * core/ports/IOlapRepository.ts
 * ------------------------------
 * Contrato (interfaz) que define como se obtienen los datos OLAP.
 * La capa de datos implementa este contrato; la capa de presentacion
 * depende de la abstraccion, no de la implementacion concreta (DIP).
 */

import type {
  OLAPResponse,
  CategorySales,
  RegionSales,
  MonthlyTrend,
  DiscountImpact,
  SegmentProfit,
  SubcategoryAnalysis,
} from '../models/olap.types';

export interface IOlapRepository {
  getSalesByCategory(): Promise<OLAPResponse<CategorySales>>;
  getSalesByRegion(): Promise<OLAPResponse<RegionSales>>;
  getMonthlyTrend(): Promise<OLAPResponse<MonthlyTrend>>;
  getDiscountImpact(): Promise<OLAPResponse<DiscountImpact>>;
  getProfitBySegment(): Promise<OLAPResponse<SegmentProfit>>;
  getSubcategoryAnalysis(): Promise<OLAPResponse<SubcategoryAnalysis>>;
}
