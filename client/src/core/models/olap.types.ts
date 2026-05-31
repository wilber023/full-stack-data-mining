/**
 * core/models/olap.types.ts
 * --------------------------
 * Entidades de dominio para las consultas OLAP.
 * Esta capa no depende de ninguna otra — es el nucleo del sistema.
 */

export interface OLAPResponse<T = Record<string, unknown>> {
  query_type: string;
  description: string;
  data: T[];
  record_count: number;
}

export interface CategorySales {
  category: string;
  total_sales: number;
  total_profit: number;
  total_quantity: number;
  order_count: number;
  avg_discount: number;
}

export interface RegionSales {
  region: string;
  total_sales: number;
  total_profit: number;
  order_count: number;
  avg_profit_per_order: number;
}

export interface MonthlyTrend {
  year: number;
  month: number;
  month_name: string;
  total_sales: number;
  total_profit: number;
  order_count: number;
}

export interface DiscountImpact {
  discount: number;
  avg_profit: number;
  avg_sales: number;
  order_count: number;
  pct_profitable: number;
}

export interface SegmentProfit {
  segment: string;
  total_sales: number;
  total_profit: number;
  unique_customers: number;
  order_count: number;
}

export interface SubcategoryAnalysis {
  sub_category: string;
  category: string;
  total_sales: number;
  total_profit: number;
  profit_margin_pct: number;
  order_count: number;
}

/** Agregado de KPIs calculados a partir de los datos OLAP */
export interface DashboardKPIs {
  totalSales: number;
  totalProfit: number;
  totalOrders: number;
  avgMargin: number;
  categoryCount: number;
  segmentCount: number;
  subcategoryCount: number;
}

/** Dato de tendencia con periodo formateado para el eje X */
export interface TrendDataPoint extends MonthlyTrend {
  period: string;
}
