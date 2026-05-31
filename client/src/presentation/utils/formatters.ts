/**
 * presentation/utils/formatters.ts
 * ----------------------------------
 * Utilidades de formateo para la capa de presentacion.
 * Sin dependencias externas — funciones puras.
 */

/** Formatea un valor monetario: $1,234 o $1.2K */
export function fmtCurrency(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

/** Formatea un porcentaje: 12.5% */
export function fmtPercent(v: number): string {
  return `${(v * 100).toFixed(0)}%`;
}
