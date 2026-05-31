/**
 * core/ports/IPredictionRepository.ts
 * -------------------------------------
 * Contrato para la capa de datos de prediccion ML.
 */

import type {
  PredictionInput,
  RegressionResult,
  ClassificationResult,
  ModelMetadata,
} from '../models/prediction.types';

export interface IPredictionRepository {
  predictProfit(input: PredictionInput): Promise<RegressionResult>;
  predictProfitable(input: PredictionInput): Promise<ClassificationResult>;
  getModelMetadata(): Promise<ModelMetadata>;
}
