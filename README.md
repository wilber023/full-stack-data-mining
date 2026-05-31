# Superstore Analytics — Full-Stack Data Mining Pipeline

Sistema full-stack de minería de datos sobre el dataset Superstore: desde datos crudos hasta predicciones servidas a través de una API y visualizadas en una aplicación React.

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Frontend (React + Vite)                       │
│  ┌──────────────────────┐     ┌──────────────────────┐              │
│  │   OLAP Dashboard     │     │    ML Predictor       │              │
│  │   (Recharts)         │     │    (Forms + Results)  │              │
│  └──────────┬───────────┘     └──────────┬───────────┘              │
└─────────────┼────────────────────────────┼──────────────────────────┘
              │          /api              │
┌─────────────┼────────────────────────────┼──────────────────────────┐
│             ▼          FastAPI           ▼                           │
│  ┌──────────────────┐     ┌──────────────────────────┐              │
│  │  OLAP Endpoints  │     │  Prediction Endpoints    │              │
│  └────────┬─────────┘     └────────┬─────────────────┘              │
│           │                        │                                 │
│  ┌────────▼─────────┐     ┌────────▼─────────────────┐              │
│  │  DuckDB          │     │  scikit-learn Models      │              │
│  │  (Star Schema)   │     │  (joblib serialized)      │              │
│  └──────────────────┘     └──────────────────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

## Estructura del Proyecto

```
PROYECTO_FULLSTACK_DATA/
├── backend/
│   ├── app/
│   │   ├── database.py    # DuckDB warehouse (star schema)
│   │   ├── models.py      # Pydantic schemas
│   │   ├── pipeline.py    # ML model loading + inference
│   │   └── main.py        # FastAPI endpoints
│   └── requirements.txt
├── client/                # React + Vite + TypeScript
│   └── src/
│       ├── components/
│       │   ├── OLAPDashboard.tsx  # Dashboard OLAP con graficas
│       │   └── Predictor.tsx      # Predictor ML interactivo
│       ├── App.tsx
│       └── ...
├── data/
│   ├── raw/superstore_crudo.csv          # Dataset crudo
│   └── superstore_warehouse.duckdb       # DuckDB warehouse
├── notebook/
│   └── eda_reproducible.ipynb            # EDA + training (ejecutable)
├── saved_models/
│   ├── regression_model.joblib           # Gradient Boosting
│   ├── classification_model.joblib       # Decision Tree
│   ├── preprocessor.joblib               # ColumnTransformer
│   └── model_metadata.json              # Metricas y config
└── README.md
```

## Dataset

**Superstore Sales** — Dataset de ventas retail de USA con 9,994 transacciones y 21 variables.

- **Fuente**: Kaggle (vivek468/superstore-dataset-final)
- **Preguntas**:
  - **Regresion**: ¿Cuanto profit generara una orden? (target: Profit)
  - **Clasificacion**: ¿Una orden sera rentable? (target: is_profitable)

## Reproducibilidad

### Prerequisitos
- Python 3.12+
- Node.js 18+

### 1. Instalar dependencias Python
```bash
cd backend
pip install -r requirements.txt
pip install nbconvert ipykernel
```

### 2. Ejecutar el notebook (entrena modelos y crea warehouse)
```bash
cd notebook
jupyter nbconvert --to notebook --execute eda_reproducible.ipynb --output eda_reproducible.ipynb
```

Esto genera:
- `saved_models/*.joblib` (modelos entrenados)
- `data/superstore_warehouse.duckdb` (warehouse dimensional)

### 3. Iniciar el backend
```bash
python -m uvicorn backend.app.main:app --port 8000
```

### 4. Iniciar el frontend
```bash
cd client
npm install
npm run dev
```

Abrir http://localhost:5173

## Warehouse (DuckDB)

Esquema estrella con:
- **dim_customer**: customer_key, customer_id, customer_name, segment
- **dim_product**: product_key, product_id, category, sub_category, product_name
- **dim_geography**: geo_key, city, state, postal_code, region, country
- **dim_date**: date_key, full_date, year, month, quarter, day_of_week
- **fact_sales**: todas las metricas con foreign keys a dimensiones

## Modelos

### Regresion (Predecir Profit)
| Modelo | MAE | RMSE | R2 |
|--------|-----|------|-----|
| Linear Regression | 60.49 | 243.30 | 0.0932 |
| Random Forest | 22.10 | 168.14 | 0.5669 |
| **Gradient Boosting** | **22.06** | **154.52** | **0.6343** |

### Clasificacion (Es Rentable?)
| Modelo | F1-macro | ROC-AUC | Precision | Recall |
|--------|----------|---------|-----------|--------|
| Logistic Regression | 0.8989 | 0.9812 | 0.9267 | 0.8767 |
| K-NN (k=7) | 0.8889 | 0.9553 | 0.9234 | 0.8628 |
| **Decision Tree** | **0.8992** | **0.9542** | **0.909** | **0.8902** |
| Naive Bayes | 0.4716 | 0.9014 | 0.6348 | 0.6749 |

## API Endpoints

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /api/health | Health check |
| GET | /api/olap/sales-by-category | Ventas por categoria |
| GET | /api/olap/sales-by-region | Ventas por region |
| GET | /api/olap/monthly-trend | Tendencia mensual |
| GET | /api/olap/profit-by-segment | Profit por segmento |
| GET | /api/olap/top-products | Top productos |
| GET | /api/olap/discount-impact | Impacto del descuento |
| POST | /api/predict/profit | Prediccion de profit |
| POST | /api/predict/profitable | Prediccion de rentabilidad |
| GET | /api/models/metadata | Metadatos de modelos |

## Limitaciones

- **Dataset modesto** (~10K filas): mas datos mejorarian la generalizacion
- **R2 de regresion = 0.63**: el profit depende de variables no observadas (costo del producto)
- **Solo USA**: no generalizable a otros paises
- **Outliers**: valores extremos de profit (-6600 a +8400) afectan la regresion
