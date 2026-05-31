/**
 * Componente reutilizable: contenedor de grafica con cabecera.
 * Responsabilidad unica: proveer un frame consistente para cualquier chart.
 */

import type { ReactNode } from 'react';

interface Props {
  icon: ReactNode;
  title: string;
  tag: string;
  children: ReactNode;
  delay?: number;
}

export function ChartCard({ icon, title, tag, children, delay = 0 }: Props) {
  return (
    <div
      className="card chart-card"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="card-header">
        <h3>{icon} {title}</h3>
        <span className="tag">{tag}</span>
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
}
