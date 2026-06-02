# Superstore Analytics -- Full-Stack Data Mining Pipeline

Pipeline completo de mineria de datos sobre el dataset Superstore: desde la descarga
del dataset crudo hasta predicciones ML servidas via API REST y visualizadas en un
dashboard React.

---

## Tabla de contenidos

1. [Requisitos previos](#1-requisitos-previos)
2. [Clonar el repositorio](#2-clonar-el-repositorio)
3. [Descargar el dataset](#3-descargar-el-dataset)
4. [Instalar dependencias Python](#4-instalar-dependencias-python)
5. [Ejecutar el notebook (entrenamiento)](#5-ejecutar-el-notebook-entrenamiento)
6. [Iniciar el backend](#6-iniciar-el-backend)
7. [Instalar e iniciar el frontend](#7-instalar-e-iniciar-el-frontend)
8. [Verificar que todo funciona](#8-verificar-que-todo-funciona)
9. [Estructura del proyecto](#9-estructura-del-proyecto)
10. [Dataset](#10-dataset)
11. [Warehouse (DuckDB)](#11-warehouse-duckdb)
12. [Modelos ML](#12-modelos-ml)
13. [API REST](#13-api-rest)
14. [Limitaciones conocidas](#14-limitaciones-conocidas)

---

## 1. Requisitos previos

Antes de comenzar, asegurate de tener instalado:

| Herramienta | Version minima | Verificar con |
|-------------|----------------|---------------|
| Python | 3.12+ | `python --version` |
| pip | 23+ | `pip --version` |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| Kaggle CLI | (cualquiera) | `kaggle --version` |

### Configuración Automática de Kaggle

El script descarga el dataset de forma automática. Solo sigue estos pasos la primera vez:

* **Inicia sesión:** Entra a tu cuenta en [Kaggle](https://kaggle.com).
* **Ejecuta el script:** Corre el programa en tu terminal.
* **Autoriza el acceso:** Haz clic en **Permitir (Allow)** en la ventana emergente.
* **Descarga lista:** El dataset se guardará automáticamente en tu equipo.


---

## 2. Clonar el repositorio

```bash
git clone https://github.com/wilber023/full-stack-data-mining.git
cd PROYECTO_FULLSTACK_DATA
```

---

## 3. Descargar el dataset

El script `data/data.py` descarga el dataset Superstore desde Kaggle y lo coloca
en `data/raw/superstore_crudo.csv`.

```bash
cd data
python data.py
```

Salida esperada:

```
Descargando dataset desde Kaggle...
Dataset listo para React + TS en: ./raw/superstore_crudo.csv!
```

Verificar que el archivo existe:

```bash
# Windows
dir raw\superstore_crudo.csv

# Linux/Mac
ls -la raw/superstore_crudo.csv
```

El archivo debe tener ~1.4 MB y 9994 filas de datos.

---

## 4. Instalar dependencias Python

Desde la raiz del proyecto:

```bash
cd backend
pip install -r requirements.txt
```

Adicionalmente, para ejecutar el notebook:

```bash
pip install jupyter nbconvert ipykernel
```

---

## 5. Ejecutar el notebook (entrenamiento)

Este paso es obligatorio. El notebook ejecuta el pipeline completo:
EDA, preprocesamiento, entrenamiento de modelos y creacion del warehouse DuckDB.

```bash
cd ..
python -m jupyter nbconvert --to notebook --execute --ExecutePreprocessor.timeout=300 notebook/eda_reproducible.ipynb --output eda_reproducible.ipynb
```

Salida esperada (en stderr, es normal):

```
[NbConvertApp] Converting notebook notebook/eda_reproducible.ipynb to notebook
[NbConvertApp] Writing 46848 bytes to notebook/eda_reproducible.ipynb
```

### Que genera este paso

| Archivo generado | Ubicacion | Descripcion |
|------------------|-----------|-------------|
| `regression_model.joblib` | `saved_models/` | Gradient Boosting (regresion) |
| `classification_model.joblib` | `saved_models/` | Decision Tree (clasificacion) |
| `preprocessor.joblib` | `saved_models/` | ColumnTransformer entrenado |
| `model_metadata.json` | `saved_models/` | Metricas y configuracion |
| `superstore_warehouse.duckdb` | `data/` | Warehouse dimensional |

Verificar que los modelos existen:

```bash
# Windows
dir saved_models\

# Linux/Mac
ls -la saved_models/
```

Deben existir 4 archivos. Si no aparecen, el notebook tuvo un error en ejecucion.

---

## 6. Iniciar el backend

Desde la raiz del proyecto:

```bash
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```

Salida esperada:

```
[OK] Modelos cargados correctamente:
   Regresion:      Gradient Boosting
   Clasificacion:  Decision Tree
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

Dejar esta terminal abierta y abrir una nueva para el siguiente paso.

---

## 7. Instalar e iniciar el frontend

En una terminal nueva:

```bash
cd client
npm install
npm run dev
```

Salida esperada:

```
VITE v8.x.x  ready in XXX ms

  -> Local:   http://localhost:5173/
```

---

## 8. Verificar que todo funciona

### 8.1 Verificar el backend

En una tercera terminal (o en el navegador):

```bash
curl http://localhost:8000/api/health
```

Respuesta esperada:

```json
{
  "status": "ok",
  "warehouse_ready": true,
  "models_loaded": true,
  "version": "1.0.0"
}
```

Si `warehouse_ready` o `models_loaded` son `false`, revisar los pasos 5 y 6.

### 8.2 Verificar el frontend

Abrir en el navegador: http://localhost:5173

- Tab "Dashboard": debe mostrar 4 tarjetas de KPI y 5 graficas con datos reales
- Tab "Predictor": debe mostrar formulario, al presionar "Ambos" debe retornar predicciones

### 8.3 Verificar una prediccion manual

```bash
curl -X POST http://localhost:8000/api/predict/profit \
  -H "Content-Type: application/json" \
  -d "{\"sales\":261.96,\"quantity\":2,\"discount\":0.0,\"ship_mode\":\"Second Class\",\"segment\":\"Consumer\",\"category\":\"Furniture\",\"sub_category\":\"Bookcases\",\"region\":\"South\"}"
```

Debe retornar un JSON con `predicted_profit`, `model_name` y `metrics`.

---

## 9. Estructura del proyecto

```
PROYECTO_FULLSTACK_DATA/
|
|-- backend/                       # Servidor API
|   |-- app/
|   |   |-- __init__.py
|   |   |-- main.py                # FastAPI: endpoints y lifespan
|   |   |-- database.py            # DuckDB: warehouse star-schema + consultas OLAP
|   |   |-- pipeline.py            # ML: carga de modelos e inferencia
|   |   |-- models.py              # Pydantic: esquemas de request/response
|   |-- requirements.txt           # Dependencias Python
|   |-- README.md                  # Documentacion tecnica del backend
|
|-- client/                        # Frontend React + Vite
|   |-- src/
|   |   |-- core/                  # Capa de dominio (tipos + contratos)
|   |   |-- data/                  # Capa de datos (repositorios + API client)
|   |   |-- presentation/          # Capa de presentacion (views + viewmodels)
|   |   |-- App.tsx                # Composition root
|   |-- README.md                  # Documentacion de arquitectura frontend
|
|-- data/
|   |-- data.py                    # Script de descarga del dataset
|   |-- raw/
|   |   |-- superstore_crudo.csv   # Dataset crudo (9994 filas)
|   |-- superstore_warehouse.duckdb # Warehouse DuckDB (generado)
|
|-- notebook/
|   |-- eda_reproducible.ipynb     # EDA + entrenamiento (ejecutable)
|
|-- saved_models/                  # Modelos entrenados (generado)
|   |-- regression_model.joblib
|   |-- classification_model.joblib
|   |-- preprocessor.joblib
|   |-- model_metadata.json
|
|-- AI_USAGE.md                    # Documentacion de uso de IA
|-- README.md                      # Este archivo
```

---

## 10. Dataset

**Superstore Sales** -- Dataset de ventas retail de USA.

- Fuente: Kaggle (`vivek468/superstore-dataset-final`)
- Filas: 9,994 transacciones
- Columnas: 21 variables originales
- Periodo: 2014-2017

---

## 11. Warehouse (DuckDB)

Esquema estrella con 4 dimensiones y 1 tabla de hechos:

```
                  dim_customer
                       |
dim_date --- fact_sales --- dim_product
                       |
                  dim_geography
```

| Tabla | Campos clave | Filas aprox. |
|-------|-------------|-------------|
| `dim_customer` | customer_key, customer_id, segment | 793 |
| `dim_product` | product_key, category, sub_category | 1,862 |
| `dim_geography` | geo_key, city, state, region | 531 |
| `dim_date` | date_key, year, month, quarter | 1,237 |
| `fact_sales` | order_id, sales, profit, is_profitable | 9,994 |

---

## 12. Modelos ML

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

---

## 13. API REST

Documentacion interactiva disponible en http://localhost:8000/docs (Swagger UI).

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/health` | Health check del sistema |
| GET | `/api/olap/sales-by-category` | Ventas agregadas por categoria |
| GET | `/api/olap/sales-by-region` | Ventas por region geografica |
| GET | `/api/olap/monthly-trend` | Tendencia mensual de ventas |
| GET | `/api/olap/profit-by-segment` | Profit por segmento de cliente |
| GET | `/api/olap/top-products` | Top N productos por ventas |
| GET | `/api/olap/discount-impact` | Impacto del descuento en profit |
| GET | `/api/olap/subcategory-analysis` | Analisis por sub-categoria |
| POST | `/api/predict/profit` | Prediccion de profit (regresion) |
| POST | `/api/predict/profitable` | Prediccion de rentabilidad (clasificacion) |
| GET | `/api/models/metadata` | Metadatos de modelos entrenados |

---

## 14. Limitaciones conocidas

- Dataset modesto (~10K filas): mas datos mejorarian la generalizacion
- R2 de regresion = 0.63: el profit depende de variables no observadas (costo del producto)
- Solo datos de USA: no generalizable a otros mercados
- Valores atipicos de profit (-$6,600 a +$8,400) afectan la regresion
