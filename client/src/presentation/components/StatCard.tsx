/**
 * Componente reutilizable: tarjeta de KPI.
 * Responsabilidad unica: renderizar un valor numerico con etiqueta e icono.
 */

import type { ReactNode } from 'react';

interface Props {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
}

export function StatCard({ icon, label, value, sub }: Props) {
  return (
    <div className="stat-card">
      <div className="stat-label">{icon} {label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}
