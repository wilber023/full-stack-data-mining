# Backend -- Arquitectura y comportamiento

Servidor FastAPI que expone dos servicios: consultas OLAP sobre un warehouse
DuckDB y predicciones ML en tiempo real usando modelos pre-entrenados.

---

## Tabla de contenidos

1. [Estructura de archivos](#estructura-de-archivos)
2. [Flujo de arranque](#flujo-de-arranque)
3. [Modulo database.py -- Warehouse DuckDB](#modulo-databasepy----warehouse-duckdb)
4. [Modulo pipeline.py -- Carga de modelos e inferencia](#modulo-pipelinepy----carga-de-modelos-e-inferencia)
5. [Modulo models.py -- Esquemas Pydantic](#modulo-modelspy----esquemas-pydantic)
6. [Modulo main.py -- Endpoints FastAPI](#modulo-mainpy----endpoints-fastapi)
7. [Flujo de datos completo](#flujo-de-datos-completo)

---

## Estructura de archivos

```
backend/
|-- app/
|   |-- __init__.py            # Marca el directorio como paquete Python
|   |-- main.py                # Punto de entrada: FastAPI app + endpoints
|   |-- database.py            # Warehouse DuckDB: construccion + consultas OLAP
|   |-- pipeline.py            # ML: carga de modelos + funciones de prediccion
|   |-- models.py              # Esquemas Pydantic: request/response validation
|-- requirements.txt           # Dependencias Python con versiones fijadas
|-- README.md                  # Este archivo
```

---

## Flujo de arranque

Cuando se ejecuta `uvicorn backend.app.main:app`, ocurre esta secuencia:

```
1. FastAPI inicializa el lifespan handler
   |
2. Se verifica si existe data/superstore_warehouse.duckdb
   |-- NO existe --> init_warehouse() construye el esquema estrella
   |-- SI existe --> se salta la construccion
   |
3. load_models() busca los 4 archivos en saved_models/
   |-- regression_model.joblib
   |-- classification_model.joblib
   |-- preprocessor.joblib
   |-- model_metadata.json
   |
   |-- Archivos encontrados --> se cargan en memoria (variables globales)
   |-- Archivos no encontrados --> imprime advertencia, endpoints ML retornan 503
   |
4. Servidor listo en http://0.0.0.0:8000
```

---

## Modulo database.py -- Warehouse DuckDB

### Responsabilidad

Construir y consultar un Data Warehouse con esquema estrella (star schema) sobre
DuckDB. DuckDB fue elegido por ser columnar (optimizado para OLAP) y embebido
(no requiere servidor externo).

### Esquema estrella

```
                   dim_customer
                   - customer_key (PK)
                   - Customer_ID
                   - Customer_Name
                   - Segment
                        |
dim_date            fact_sales               dim_product
- date_key (PK)    - order_id               - product_key (PK)
- full_date         - customer_key (FK)      - product_id
- year              - product_key (FK)       - category
- month             - geo_key (FK)           - sub_category
- quarter           - date_key (FK)          - product_name
- day_of_week       - ship_date_key (FK)
- month_name        - ship_mode                  |
      |             - sales               dim_geography
      |             - quantity             - geo_key (PK)
      |             - discount             - city
      |             - profit               - state
      |             - is_profitable        - postal_code
      |                                    - region
      |                                    - country
```

### Funcion init_warehouse()

1. Lee el CSV crudo con `pandas`
2. Limpia nombres de columnas y parsea fechas
3. Construye 4 tablas dimensionales con `drop_duplicates` + surrogate keys
4. Construye la tabla de hechos con `merge` (no `map`) para las foreign keys
5. Persiste todo en DuckDB con `CREATE TABLE AS SELECT`

### Consultas OLAP disponibles

Cada funcion ejecuta una consulta SQL con JOINs al esquema estrella y retorna
una lista de diccionarios:

| Funcion | Tabla(s) | Agrupacion | Metricas |
|---------|----------|------------|----------|
| `olap_sales_by_category()` | fact + dim_product | category | sales, profit, quantity, orders, avg_discount |
| `olap_sales_by_region()` | fact + dim_geography | region | sales, profit, orders, avg_profit |
| `olap_monthly_trend()` | fact + dim_date | year, month | sales, profit, orders |
| `olap_profit_by_segment()` | fact + dim_customer | segment | sales, profit, customers, orders |
| `olap_top_products(n)` | fact + dim_product | product | sales, profit, quantity |
| `olap_discount_impact()` | fact | discount | avg_profit, avg_sales, orders, pct_profitable |
| `olap_subcategory_analysis()` | fact + dim_product | sub_category | sales, profit, margin%, orders |

### Patron de conexion

Todas las funciones de consulta abren y cierran su propia conexion:

```python
def olap_sales_by_category() -> list[dict]:
    con = get_connection(read_only=True)
    try:
        result = con.execute("SELECT ...").fetchdf()
        return result.to_dict(orient="records")
    finally:
        con.close()
```

Se usa `read_only=True` para consultas OLAP (permite concurrencia de lectura).

---

## Modulo pipeline.py -- Carga de modelos e inferencia

### Responsabilidad

Cargar los modelos scikit-learn serializados con joblib y exponer funciones
de prediccion para regresion y clasificacion.

### Estado global

Los modelos se mantienen en variables globales del modulo para evitar recargar
desde disco en cada request:

```python
_regression_model = None       # GradientBoostingRegressor
_classification_model = None   # DecisionTreeClassifier
_preprocessor = None           # ColumnTransformer
_metadata = None               # dict con metricas y config
```

### Funcion load_models()

Busca los 4 archivos en `saved_models/`, los carga con `joblib.load()` y
almacena en las variables globales. Retorna `True` si tuvo exito.

### Funcion _prepare_input(features)

Convierte el diccionario de la request en un DataFrame con las columnas exactas
que el ColumnTransformer espera. Incluye una estimacion de `Shipping_Days`
basada en el modo de envio (ya que el usuario no provee fechas).

### Funcion predict_profit(features)

```
features (dict) --> _prepare_input() --> DataFrame
                                          |
                    _preprocessor.transform() --> matriz numerica
                                                    |
                    _regression_model.predict() --> float
                                                    |
                    retorna: { predicted_profit, model_name, metrics }
```

### Funcion predict_profitable(features)

```
features (dict) --> _prepare_input() --> DataFrame
                                          |
                    _preprocessor.transform() --> matriz numerica
                                                    |
                    _classification_model.predict() --> 0 o 1
                    _classification_model.predict_proba() --> [p0, p1]
                                                    |
                    retorna: { is_profitable, probability, predicted_class, model_name, metrics }
```

### Preprocesador (ColumnTransformer)

El preprocesador fue entrenado en el notebook y encapsula:

```
ColumnTransformer
|-- numeric: StandardScaler
|   aplica a: Sales, Quantity, Discount, Shipping_Days
|
|-- categorical: OneHotEncoder
    aplica a: Ship_Mode, Segment, Category, Sub_Category, Region
```

Esto previene data leakage: los parametros de escalado se aprendieron solo
con datos de entrenamiento.

---

## Modulo models.py -- Esquemas Pydantic

Define los contratos de la API con validacion automatica:

| Esquema | Tipo | Campos principales |
|---------|------|--------------------|
| `PredictionInput` | Request body | sales, quantity, discount, ship_mode, segment, category, sub_category, region |
| `RegressionResponse` | Response | predicted_profit, model_name, metrics |
| `ClassificationResponse` | Response | is_profitable, probability, predicted_class, model_name, metrics |
| `OLAPResponse` | Response | query_type, description, data[], record_count |
| `HealthResponse` | Response | status, warehouse_ready, models_loaded, version |

### Validaciones en PredictionInput

```python
sales: float     # gt=0 (mayor que cero)
quantity: int     # ge=1, le=20
discount: float   # ge=0.0, le=1.0
ship_mode: str    # libre, validado por el modelo
```

---

## Modulo main.py -- Endpoints FastAPI

### Organizacion de endpoints

```
/api/
|-- health                     GET   --> HealthResponse
|
|-- olap/
|   |-- sales-by-category     GET   --> OLAPResponse
|   |-- sales-by-region       GET   --> OLAPResponse
|   |-- monthly-trend         GET   --> OLAPResponse
|   |-- profit-by-segment     GET   --> OLAPResponse
|   |-- top-products?limit=N  GET   --> OLAPResponse
|   |-- discount-impact       GET   --> OLAPResponse
|   |-- subcategory-analysis  GET   --> OLAPResponse
|
|-- predict/
|   |-- profit                POST  --> RegressionResponse
|   |-- profitable            POST  --> ClassificationResponse
|
|-- models/
    |-- metadata              GET   --> dict
```

### Manejo de errores

- Los endpoints OLAP capturan excepciones y retornan HTTP 500 con detalle
- Los endpoints de prediccion validan que los modelos esten cargados (HTTP 503 si no)
- Pydantic valida automaticamente los inputs (HTTP 422 si hay errores)

### CORS

Configurado con `allow_origins=["*"]` para desarrollo. En produccion se debe
restringir al dominio del frontend.

---

## Flujo de datos completo

```
[Cliente React]
     |
     | HTTP Request (GET /api/olap/... o POST /api/predict/...)
     v
[FastAPI main.py]
     |
     |--> Endpoint OLAP --> database.py --> DuckDB query --> JSON response
     |
     |--> Endpoint ML --> pipeline.py --> preprocessor.transform()
     |                                    --> model.predict()
     |                                    --> JSON response
     v
[Cliente React]
     |
     | Renderiza datos en graficas (Recharts) o tarjetas de resultado
```
