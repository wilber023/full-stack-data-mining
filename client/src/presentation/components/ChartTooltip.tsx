/**
 * Componente reutilizable: Tooltip cientifico para graficas Recharts.
 */

import { fmtCurrency } from '../utils/formatters';

export function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      {payload.map((e: any, i: number) => (
        <p key={i} className="chart-tooltip-row">
          <span className="chart-tooltip-dot" style={{ background: e.color }} />
          {e.name}: {typeof e.value === 'number' ? fmtCurrency(e.value) : e.value}
        </p>
      ))}
    </div>
  );
}
