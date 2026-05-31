 

import {
  TbTrendingUp, TbBinaryTree, TbSend, TbLoader,
  TbFlask, TbTargetArrow, TbCircleCheck, TbCircleX
} from 'react-icons/tb';

import { StatCard } from '../components/StatCard';
import { MetricBadge } from '../components/MetricBadge';
import type { PredictorViewModel } from '../viewmodels/usePredictorViewModel';
import { SHIP_MODES, SEGMENTS, REGIONS, CATEGORIES } from '../../core/models/prediction.types';

interface Props {
  vm: PredictorViewModel;
}

export function PredictorView({ vm }: Props) {
  const {
    input, updateField, availableSubCategories,
    regressionResult, classificationResult, metadata,
    predictRegression, predictClassification, predictBoth,
    loading,
  } = vm;

  return (
    <div>
      {/* Model summary */}
      {metadata && (
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <StatCard icon={<TbTrendingUp />} label="Modelo regresion"
            value={metadata.regression.model_name}
            sub={`R2 = ${metadata.regression.metrics['R\u00c2\u00b2'] ?? metadata.regression.metrics['R2'] ?? 'N/A'}`} />
          <StatCard icon={<TbBinaryTree />} label="Modelo clasificacion"
            value={metadata.classification.model_name}
            sub={`F1 = ${metadata.classification.metrics['F1-macro']}`} />
          <StatCard icon={<TbTargetArrow />} label="Datos entrenamiento"
            value={metadata.train_size?.toLocaleString() ?? '--'}
            sub={`Test: ${metadata.test_size?.toLocaleString()}`} />
        </div>
      )}

      <div className="predictor-layout">
        {/* Form */}
        <div className="card">
          <div className="card-header">
            <h3><TbFlask /> Parametros de la orden</h3>
          </div>
          <div className="card-body">
            <div className="form-grid">
              <FormInput label="Ventas (USD)" id="input-sales" type="number" min={0.01} step={0.01}
                value={input.sales} onChange={v => updateField('sales', parseFloat(v) || 0)} />
              <FormInput label="Cantidad" id="input-quantity" type="number" min={1} max={20}
                value={input.quantity} onChange={v => updateField('quantity', parseInt(v) || 1)} />
              <FormInput label="Descuento" id="input-discount" type="number" min={0} max={1} step={0.05}
                value={input.discount} onChange={v => updateField('discount', parseFloat(v) || 0)} />
              <FormSelect label="Modo de envio" id="input-ship-mode"
                value={input.ship_mode} options={[...SHIP_MODES]}
                onChange={v => updateField('ship_mode', v)} />
              <FormSelect label="Segmento" id="input-segment"
                value={input.segment} options={[...SEGMENTS]}
                onChange={v => updateField('segment', v)} />
              <FormSelect label="Region" id="input-region"
                value={input.region} options={[...REGIONS]}
                onChange={v => updateField('region', v)} />
              <FormSelect label="Categoria" id="input-category"
                value={input.category} options={[...CATEGORIES]}
                onChange={v => updateField('category', v)} />
              <FormSelect label="Sub-categoria" id="input-sub-category"
                value={input.sub_category} options={[...availableSubCategories]}
                onChange={v => updateField('sub_category', v)} />
            </div>

            <div className="btn-group">
              <button id="btn-predict-profit" className="btn primary"
                onClick={predictRegression} disabled={!!loading}>
                {loading === 'regression' ? <TbLoader className="spin-icon" /> : <TbTrendingUp />}
                Predecir Profit
              </button>
              <button id="btn-predict-class" className="btn secondary"
                onClick={predictClassification} disabled={!!loading}>
                {loading === 'classification' ? <TbLoader className="spin-icon" /> : <TbBinaryTree />}
                Rentable?
              </button>
              <button id="btn-predict-both" className="btn"
                onClick={predictBoth} disabled={!!loading}>
                {loading === 'both' ? <TbLoader className="spin-icon" /> : <TbSend />}
                Ambos
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="result-panel">
          {!regressionResult && !classificationResult && (
            <div className="card">
              <div className="empty-state">
                <TbTargetArrow />
                <h3>Resultados de prediccion</h3>
                <p style={{ fontSize: '0.82rem' }}>
                  Configura los parametros y ejecuta una prediccion.
                </p>
              </div>
            </div>
          )}

          {regressionResult && (
            <div className={`result-card ${regressionResult.predicted_profit >= 0 ? 'positive' : 'negative'}`}>
              <div className="result-title"><TbTrendingUp /> Prediccion de profit (regresion)</div>
              <div className="result-value">${regressionResult.predicted_profit.toFixed(2)}</div>
              <div className="result-model">Modelo: {regressionResult.model_name}</div>
              <div className="metrics-grid">
                {Object.entries(regressionResult.metrics).map(([k, v]) => (
                  <MetricBadge key={k} label={k} value={v} />
                ))}
              </div>
            </div>
          )}

          {classificationResult && (
            <div className={`result-card ${classificationResult.is_profitable ? 'positive' : 'negative'}`}>
              <div className="result-title"><TbBinaryTree /> Prediccion de rentabilidad (clasificacion)</div>
              <div className="result-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {classificationResult.is_profitable
                  ? <TbCircleCheck style={{ fontSize: '1.3rem' }} />
                  : <TbCircleX style={{ fontSize: '1.3rem' }} />}
                {classificationResult.predicted_class}
              </div>
              <div className="result-model">Modelo: {classificationResult.model_name}</div>

              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#737373' }}>
                  <span>Probabilidad de ser rentable</span>
                  <span style={{ fontWeight: 600, color: '#262626' }}>
                    {(classificationResult.probability * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill"
                    style={{ width: `${classificationResult.probability * 100}%` }} />
                </div>
              </div>

              <div className="metrics-grid">
                {Object.entries(classificationResult.metrics).map(([k, v]) => (
                  <MetricBadge key={k} label={k} value={v} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Sub-componentes privados de formulario ──────────────────────────── */

function FormInput({ label, id, value, onChange, ...rest }: {
  label: string; id: string; value: number;
  onChange: (v: string) => void;
  type?: string; min?: number; max?: number; step?: number;
}) {
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>{label}</label>
      <input id={id} className="form-input" value={value}
        onChange={e => onChange(e.target.value)} {...rest} />
    </div>
  );
}

function FormSelect({ label, id, value, options, onChange }: {
  label: string; id: string; value: string;
  options: string[]; onChange: (v: string) => void;
}) {
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>{label}</label>
      <select id={id} className="form-select" value={value}
        onChange={e => onChange(e.target.value)}>
        {options.map(v => <option key={v} value={v}>{v}</option>)}
      </select>
    </div>
  );
}
