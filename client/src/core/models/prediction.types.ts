/**
 * core/models/prediction.types.ts
 * --------------------------------
 * Entidades de dominio para inferencia ML.
 */

export interface PredictionInput {
  sales: number;
  quantity: number;
  discount: number;
  ship_mode: string;
  segment: string;
  category: string;
  sub_category: string;
  region: string;
}

export interface RegressionResult {
  predicted_profit: number;
  model_name: string;
  metrics: Record<string, number>;
}

export interface ClassificationResult {
  is_profitable: boolean;
  probability: number;
  predicted_class: string;
  model_name: string;
  metrics: Record<string, number>;
}

export interface ModelMetadata {
  regression: { model_name: string; metrics: Record<string, number> };
  classification: { model_name: string; metrics: Record<string, number> };
  training_date: string;
  feature_names: string[];
  train_size: number;
  test_size: number;
}

/** Constantes de dominio: opciones validas por campo */
export const SHIP_MODES = ['Standard Class', 'Second Class', 'First Class', 'Same Day'] as const;
export const SEGMENTS = ['Consumer', 'Corporate', 'Home Office'] as const;
export const REGIONS = ['East', 'West', 'Central', 'South'] as const;
export const CATEGORIES = ['Furniture', 'Office Supplies', 'Technology'] as const;

export const SUB_CATEGORIES: Record<string, readonly string[]> = {
  Furniture: ['Bookcases', 'Chairs', 'Furnishings', 'Tables'],
  'Office Supplies': ['Appliances', 'Art', 'Binders', 'Envelopes', 'Fasteners', 'Labels', 'Paper', 'Storage', 'Supplies'],
  Technology: ['Accessories', 'Copiers', 'Machines', 'Phones'],
};

export const DEFAULT_INPUT: PredictionInput = {
  sales: 250,
  quantity: 3,
  discount: 0.0,
  ship_mode: 'Standard Class',
  segment: 'Consumer',
  category: 'Technology',
  sub_category: 'Phones',
  region: 'West',
};
