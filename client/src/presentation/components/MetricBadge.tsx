/**
 * Componente reutilizable: badge de metrica ML.
 * Responsabilidad unica: mostrar una metrica clave-valor.
 */

interface Props {
  label: string;
  value: string | number;
}

export function MetricBadge({ label, value }: Props) {
  const display = typeof value === 'number' ? value.toFixed(4) : value;
  return (
    <div className="metric-item">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{display}</div>
    </div>
  );
}
