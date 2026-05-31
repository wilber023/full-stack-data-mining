/**
 * presentation/viewmodels/useDashboardViewModel.ts
 * --------------------------------------------------
 * ViewModel del Dashboard OLAP (patron MVVM).
 *
 * Responsabilidades:
 *  - Orquestar la carga de datos via el repositorio (inyectado)
 *  - Calcular KPIs derivados
 *  - Exponer estado reactivo a la vista (que es pasiva)
 *
 * La vista NO contiene logica: solo lee este hook y renderiza.
 */

import { useState, useEffect, useMemo } from 'react';
import type { IOlapRepository } from '../../core/ports/IOlapRepository';
import type {
  CategorySales,
  RegionSales,
  MonthlyTrend,
  DiscountImpact,
  SegmentProfit,
  SubcategoryAnalysis,
  DashboardKPIs,
  TrendDataPoint,
  OLAPResponse,
} from '../../core/models/olap.types';

interface DashboardState {
  salesByCategory: OLAPResponse<CategorySales> | null;
  salesByRegion: OLAPResponse<RegionSales> | null;
  monthlyTrend: OLAPResponse<MonthlyTrend> | null;
  discountImpact: OLAPResponse<DiscountImpact> | null;
  profitBySegment: OLAPResponse<SegmentProfit> | null;
  subcategoryData: OLAPResponse<SubcategoryAnalysis> | null;
  loading: boolean;
  error: string | null;
}

export interface DashboardViewModel {
  state: DashboardState;
  kpis: DashboardKPIs;
  trendData: TrendDataPoint[];
}

export function useDashboardViewModel(repo: IOlapRepository): DashboardViewModel {
  const [state, setState] = useState<DashboardState>({
    salesByCategory: null,
    salesByRegion: null,
    monthlyTrend: null,
    discountImpact: null,
    profitBySegment: null,
    subcategoryData: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [cat, reg, trend, disc, seg, sub] = await Promise.all([
          repo.getSalesByCategory(),
          repo.getSalesByRegion(),
          repo.getMonthlyTrend(),
          repo.getDiscountImpact(),
          repo.getProfitBySegment(),
          repo.getSubcategoryAnalysis(),
        ]);

        if (!cancelled) {
          setState({
            salesByCategory: cat,
            salesByRegion: reg,
            monthlyTrend: trend,
            discountImpact: disc,
            profitBySegment: seg,
            subcategoryData: sub,
            loading: false,
            error: null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState(prev => ({ ...prev, loading: false, error: String(err) }));
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [repo]);

  /** KPIs derivados — se recalculan solo cuando cambian los datos */
  const kpis = useMemo<DashboardKPIs>(() => {
    const catData = state.salesByCategory?.data ?? [];
    const totalSales = catData.reduce((s, d) => s + d.total_sales, 0);
    const totalProfit = catData.reduce((s, d) => s + d.total_profit, 0);
    const totalOrders = catData.reduce((s, d) => s + d.order_count, 0);

    return {
      totalSales,
      totalProfit,
      totalOrders,
      avgMargin: totalSales > 0 ? (totalProfit / totalSales) * 100 : 0,
      categoryCount: catData.length,
      segmentCount: state.profitBySegment?.data.length ?? 0,
      subcategoryCount: state.subcategoryData?.record_count ?? 0,
    };
  }, [state.salesByCategory, state.profitBySegment, state.subcategoryData]);

  /** Tendencia con periodo formateado */
  const trendData = useMemo<TrendDataPoint[]>(() => {
    return (state.monthlyTrend?.data ?? []).map(d => ({
      ...d,
      period: `${d.year}-${String(d.month).padStart(2, '0')}`,
    }));
  }, [state.monthlyTrend]);

  return { state, kpis, trendData };
}
