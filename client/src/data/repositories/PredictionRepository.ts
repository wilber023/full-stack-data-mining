/**
 * data/repositories/PredictionRepository.ts
 * -------------------------------------------
 * Implementacion concreta del puerto IPredictionRepository.
 */

import { apiClient } from '../api/apiClient';
import type { IPredictionRepository } from '../../core/ports/IPredictionRepository';
import type {
  PredictionInput,
  RegressionResult,
  ClassificationResult,
  ModelMetadata,
} from '../../core/models/prediction.types';

export class PredictionRepository implements IPredictionRepository {
  predictProfit(input: PredictionInput) {
    return apiClient.post<RegressionResult>('/predict/profit', input);
  }
  predictProfitable(input: PredictionInput) {
    return apiClient.post<ClassificationResult>('/predict/profitable', input);
  }
  getModelMetadata() {
    return apiClient.get<ModelMetadata>('/models/metadata');
  }
}
