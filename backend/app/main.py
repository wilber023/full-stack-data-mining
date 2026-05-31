"""
main.py — FastAPI Application
==============================
API REST que expone:
- Consultas OLAP sobre el warehouse DuckDB
- Inferencia en vivo de modelos de regresión y clasificación
- Metadatos de los modelos entrenados
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .database import (
    init_warehouse,
    olap_sales_by_category,
    olap_sales_by_region,
    olap_monthly_trend,
    olap_profit_by_segment,
    olap_top_products,
    olap_discount_impact,
    olap_subcategory_analysis,
    DB_PATH,
)
from .pipeline import load_models, predict_profit, predict_profitable, get_model_metadata, models_loaded
from .models import (
    PredictionInput,
    RegressionResponse,
    ClassificationResponse,
    OLAPResponse,
    ModelMetadataResponse,
    HealthResponse,
)


# ── Startup / Shutdown ─────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Inicializar warehouse y modelos al arrancar."""
    # Startup
    if not DB_PATH.exists():
        print("[INIT] Warehouse no encontrado, creandolo...")
        try:
            init_warehouse()
        except Exception as e:
            print(f"[WARN] Error al crear warehouse: {e}")

    loaded = load_models()
    if not loaded:
        print("[WARN] Los modelos no se pudieron cargar. Ejecuta el notebook primero.")

    yield
    # Shutdown (limpieza si es necesario)


# ── App ────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Superstore Data Mining API",
    description="API full-stack para warehouse OLAP y predicciones ML sobre el dataset Superstore",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — permitir frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health ─────────────────────────────────────────────────────────────────────

@app.get("/api/health", response_model=HealthResponse, tags=["Sistema"])
async def health_check():
    """Verificar estado del sistema."""
    return HealthResponse(
        status="ok",
        warehouse_ready=DB_PATH.exists(),
        models_loaded=models_loaded(),
        version="1.0.0",
    )


# ── Endpoints OLAP ─────────────────────────────────────────────────────────────

@app.get("/api/olap/sales-by-category", response_model=OLAPResponse, tags=["OLAP"])
async def get_sales_by_category():
    """Ventas y profit agregados por categoría de producto."""
    try:
        data = olap_sales_by_category()
        return OLAPResponse(
            query_type="sales_by_category",
            description="Ventas totales, profit y cantidad por categoría de producto",
            data=data,
            record_count=len(data),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/olap/sales-by-region", response_model=OLAPResponse, tags=["OLAP"])
async def get_sales_by_region():
    """Ventas y profit por región geográfica."""
    try:
        data = olap_sales_by_region()
        return OLAPResponse(
            query_type="sales_by_region",
            description="Ventas totales y profit por región geográfica",
            data=data,
            record_count=len(data),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/olap/monthly-trend", response_model=OLAPResponse, tags=["OLAP"])
async def get_monthly_trend():
    """Tendencia mensual de ventas y profit."""
    try:
        data = olap_monthly_trend()
        return OLAPResponse(
            query_type="monthly_trend",
            description="Tendencia mensual de ventas y profit a lo largo del tiempo",
            data=data,
            record_count=len(data),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/olap/profit-by-segment", response_model=OLAPResponse, tags=["OLAP"])
async def get_profit_by_segment():
    """Profit y ventas por segmento de cliente."""
    try:
        data = olap_profit_by_segment()
        return OLAPResponse(
            query_type="profit_by_segment",
            description="Profit total y ventas por segmento de cliente",
            data=data,
            record_count=len(data),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/olap/top-products", response_model=OLAPResponse, tags=["OLAP"])
async def get_top_products(limit: int = Query(default=15, ge=5, le=50)):
    """Top N productos por ventas totales."""
    try:
        data = olap_top_products(limit=limit)
        return OLAPResponse(
            query_type="top_products",
            description=f"Top {limit} productos por ventas totales",
            data=data,
            record_count=len(data),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/olap/discount-impact", response_model=OLAPResponse, tags=["OLAP"])
async def get_discount_impact():
    """Impacto del descuento en el profit."""
    try:
        data = olap_discount_impact()
        return OLAPResponse(
            query_type="discount_impact",
            description="Impacto del nivel de descuento en el profit promedio y porcentaje de órdenes rentables",
            data=data,
            record_count=len(data),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/olap/subcategory-analysis", response_model=OLAPResponse, tags=["OLAP"])
async def get_subcategory_analysis():
    """Análisis por sub-categoría."""
    try:
        data = olap_subcategory_analysis()
        return OLAPResponse(
            query_type="subcategory_analysis",
            description="Análisis detallado de ventas, profit y margen por sub-categoría",
            data=data,
            record_count=len(data),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Endpoints de Predicción ────────────────────────────────────────────────────

@app.post("/api/predict/profit", response_model=RegressionResponse, tags=["Predicción"])
async def predict_order_profit(input_data: PredictionInput):
    """Predice el profit de una orden (regresión)."""
    if not models_loaded():
        raise HTTPException(status_code=503, detail="Modelos no cargados. Ejecuta el notebook primero.")

    try:
        result = predict_profit(input_data.model_dump())
        return RegressionResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/predict/profitable", response_model=ClassificationResponse, tags=["Predicción"])
async def predict_order_profitable(input_data: PredictionInput):
    """Predice si una orden será rentable (clasificación)."""
    if not models_loaded():
        raise HTTPException(status_code=503, detail="Modelos no cargados. Ejecuta el notebook primero.")

    try:
        result = predict_profitable(input_data.model_dump())
        return ClassificationResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Metadatos de modelos ───────────────────────────────────────────────────────

@app.get("/api/models/metadata", tags=["Modelos"])
async def get_metadata():
    """Retorna metadatos de entrenamiento de los modelos."""
    metadata = get_model_metadata()
    if metadata is None:
        raise HTTPException(status_code=503, detail="Modelos no cargados.")
    return metadata
