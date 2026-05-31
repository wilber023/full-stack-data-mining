/**
 * presentation/viewmodels/usePredictorViewModel.ts
 * ---------------------------------------------------
 * ViewModel del Predictor ML (patron MVVM).
 *
 * Responsabilidades:
 *  - Gestionar el formulario de entrada
 *  - Orquestar las llamadas de prediccion via el repositorio
 *  - Manejar estados de carga/error
 *  - Logica de sub-categorias dependiente de categoria
 *
 * La vista solo renderiza lo que este hook expone.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { IPredictionRepository } from '../../core/ports/IPredictionRepository';
import type {
  PredictionInput,
  RegressionResult,
  ClassificationResult,
  ModelMetadata,
} from '../../core/models/prediction.types';
import { DEFAULT_INPUT, SUB_CATEGORIES } from '../../core/models/prediction.types';

export interface PredictorViewModel {
  /** Estado del formulario */
  input: PredictionInput;
  updateField: (field: keyof PredictionInput, value: string | number) => void;
  availableSubCategories: readonly string[];

  /** Resultados */
  regressionResult: RegressionResult | null;
  classificationResult: ClassificationResult | null;
  metadata: ModelMetadata | null;

  /** Acciones */
  predictRegression: () => Promise<void>;
  predictClassification: () => Promise<void>;
  predictBoth: () => Promise<void>;

  /** Estado de la UI */
  loading: string | null;
  error: string | null;
}

export function usePredictorViewModel(repo: IPredictionRepository): PredictorViewModel {
  const [input, setInput] = useState<PredictionInput>(DEFAULT_INPUT);
  const [regressionResult, setRegressionResult] = useState<RegressionResult | null>(null);
  const [classificationResult, setClassificationResult] = useState<ClassificationResult | null>(null);
  const [metadata, setMetadata] = useState<ModelMetadata | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cargar metadatos al montar
  useEffect(() => {
    repo.getModelMetadata().then(setMetadata).catch(() => {});
  }, [repo]);

  // Sub-categorias derivadas de la categoria seleccionada
  const availableSubCategories = useMemo(
    () => SUB_CATEGORIES[input.category] ?? [],
    [input.category],
  );

  // Actualizar un campo del formulario, con logica de cascada para sub-categoria
  const updateField = useCallback((field: keyof PredictionInput, value: string | number) => {
    setInput(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'category') {
        const subs = SUB_CATEGORIES[value as string];
        if (subs && !subs.includes(prev.sub_category)) {
          next.sub_category = subs[0];
        }
      }
      return next;
    });
  }, []);

  const predictRegression = useCallback(async () => {
    setLoading('regression');
    setError(null);
    try {
      setRegressionResult(await repo.predictProfit(input));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(null);
    }
  }, [repo, input]);

  const predictClassification = useCallback(async () => {
    setLoading('classification');
    setError(null);
    try {
      setClassificationResult(await repo.predictProfitable(input));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(null);
    }
  }, [repo, input]);

  const predictBoth = useCallback(async () => {
    setLoading('both');
    setError(null);
    try {
      const [reg, clf] = await Promise.all([
        repo.predictProfit(input),
        repo.predictProfitable(input),
      ]);
      setRegressionResult(reg);
      setClassificationResult(clf);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(null);
    }
  }, [repo, input]);

  return {
    input,
    updateField,
    availableSubCategories,
    regressionResult,
    classificationResult,
    metadata,
    predictRegression,
    predictClassification,
    predictBoth,
    loading,
    error,
  };
}
