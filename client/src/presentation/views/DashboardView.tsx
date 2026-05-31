 

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, ScatterChart, Scatter, Cell, Legend
} from 'recharts';
import {
  TbChartBar, TbTrendingUp, TbMapPin, TbPercentage, TbUsers,
  TbShoppingCart, TbCoin, TbFileAnalytics, TbCategory
} from 'react-icons/tb';

import { StatCard } from '../components/StatCard';
import { ChartCard } from '../components/ChartCard';
import { ChartTooltip } from '../components/ChartTooltip';
import { fmtCurrency, fmtPercent } from '../utils/formatters';
import type { DashboardViewModel } from '../viewmodels/useDashboardViewModel';

const PALETTE = ['#1a1a1a', '#4a4a4a', '#7a7a7a', '#a0a0a0', '#c0c0c0'];

interface Props {
  vm: DashboardViewModel;
}

export function DashboardView({ vm }: Props) {
  const { state, kpis, trendData } = vm;

  if (state.loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>Cargando datos del warehouse...</p>
      </div>
    );
  }

  if (state.error) {
    return <div className="loading"><p>Error: {state.error}</p></div>;
  }

  return (
    <div>
      {/* KPI cards */}
      <div className="stats-grid">
        <StatCard icon={<TbShoppingCart />} label="Ventas totales"
          value={fmtCurrency(kpis.totalSales)} sub={`${kpis.categoryCount} categorias`} />
        <StatCard icon={<TbCoin />} label="Profit total"
          value={fmtCurrency(kpis.totalProfit)} sub={`Margen: ${kpis.avgMargin.toFixed(1)}%`} />
        <StatCard icon={<TbFileAnalytics />} label="Ordenes"
          value={kpis.totalOrders.toLocaleString()} sub={`${kpis.segmentCount} segmentos`} />
        <StatCard icon={<TbCategory />} label="Sub-categorias"
          value={String(kpis.subcategoryCount)} sub="Analisis dimensional" />
      </div>

      {/* Chart grid */}
      <div className="charts-grid">
        <ChartCard icon={<TbChartBar />} title="Ventas por categoria" tag="OLAP" delay={0.05}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={state.salesByCategory?.data ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="category" tick={{ fill: '#666', fontSize: 11 }} />
              <YAxis tick={{ fill: '#666', fontSize: 11 }} tickFormatter={fmtCurrency} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="square" iconSize={10} />
              <Bar dataKey="total_sales" name="Ventas" radius={[3, 3, 0, 0]}>
                {(state.salesByCategory?.data ?? []).map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Bar>
              <Bar dataKey="total_profit" name="Profit" fill="#a0a0a0" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard icon={<TbTrendingUp />} title="Tendencia mensual" tag="SERIE" delay={0.1}>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#333" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#333" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#999" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#999" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="period" tick={{ fill: '#666', fontSize: 10 }} interval={3} />
              <YAxis tick={{ fill: '#666', fontSize: 11 }} tickFormatter={fmtCurrency} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="line" iconSize={12} />
              <Area type="monotone" dataKey="total_sales" name="Ventas" stroke="#333" fill="url(#gS)" strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="total_profit" name="Profit" stroke="#999" fill="url(#gP)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard icon={<TbMapPin />} title="Profit por region" tag="OLAP" delay={0.15}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={state.salesByRegion?.data ?? []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis type="number" tick={{ fill: '#666', fontSize: 11 }} tickFormatter={fmtCurrency} />
              <YAxis type="category" dataKey="region" tick={{ fill: '#666', fontSize: 11 }} width={55} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="square" iconSize={10} />
              <Bar dataKey="total_sales" name="Ventas" fill="#3a3a3a" radius={[0, 3, 3, 0]} />
              <Bar dataKey="total_profit" name="Profit" fill="#b0b0b0" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard icon={<TbPercentage />} title="Impacto del descuento" tag="SCATTER" delay={0.2}>
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="discount" name="Descuento" tick={{ fill: '#666', fontSize: 11 }}
                tickFormatter={fmtPercent} type="number" />
              <YAxis dataKey="avg_profit" name="Profit Prom." tick={{ fill: '#666', fontSize: 11 }}
                tickFormatter={fmtCurrency} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<ChartTooltip />} />
              <Scatter data={state.discountImpact?.data ?? []} fill="#4a4a4a">
                {(state.discountImpact?.data ?? []).map((d, i) => (
                  <Cell key={i} fill={d.avg_profit >= 0 ? '#2a2a2a' : '#bbb'} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Segment chart */}
      <ChartCard icon={<TbUsers />} title="Profit por segmento" tag="OLAP" delay={0.25}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={state.profitBySegment?.data ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="segment" tick={{ fill: '#666', fontSize: 11 }} />
            <YAxis tick={{ fill: '#666', fontSize: 11 }} tickFormatter={fmtCurrency} />
            <Tooltip content={<ChartTooltip />} />
            <Legend iconType="square" iconSize={10} />
            <Bar dataKey="total_sales" name="Ventas" fill="#2a2a2a" radius={[3, 3, 0, 0]} />
            <Bar dataKey="total_profit" name="Profit" fill="#b0b0b0" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
