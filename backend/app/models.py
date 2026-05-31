"""
models.py — Esquemas Pydantic para la API
==========================================
Define los modelos de request/response para validación y documentación automática.
"""

from pydantic import BaseModel, Field
from typing import Optional


# ── Input para predicciones ────────────────────────────────────────────────────

class PredictionInput(BaseModel):
    """Datos de una orden para predecir profit o rentabilidad."""
    sales: float = Field(..., gt=0, description="Monto de ventas en USD")
    quantity: int = Field(..., ge=1, le=20, description="Cantidad de productos")
    discount: float = Field(..., ge=0.0, le=1.0, description="Descuento aplicado (0.0 a 1.0)")
    ship_mode: str = Field(..., description="Modo de envío: 'Standard Class', 'Second Class', 'First Class', 'Same Day'")
    segment: str = Field(..., description="Segmento del cliente: 'Consumer', 'Corporate', 'Home Office'")
    category: str = Field(..., description="Categoría del producto: 'Furniture', 'Office Supplies', 'Technology'")
    sub_category: str = Field(..., description="Sub-categoría del producto")
    region: str = Field(..., description="Región: 'East', 'West', 'Central', 'South'")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "sales": 261.96,
                    "quantity": 2,
                    "discount": 0.0,
                    "ship_mode": "Second Class",
                    "segment": "Consumer",
                    "category": "Furniture",
                    "sub_category": "Bookcases",
                    "region": "South"
                }
            ]
        }
    }


# ── Responses ──────────────────────────────────────────────────────────────────

class RegressionResponse(BaseModel):
    """Respuesta de la predicción de regresión (profit)."""
    predicted_profit: float
    model_name: str
    metrics: dict


class ClassificationResponse(BaseModel):
    """Respuesta de la predicción de clasificación (rentabilidad)."""
    is_profitable: bool
    probability: float
    predicted_class: str
    model_name: str
    metrics: dict


class OLAPResponse(BaseModel):
    """Respuesta genérica para consultas OLAP."""
    query_type: str
    description: str
    data: list[dict]
    record_count: int


class ModelMetadataResponse(BaseModel):
    """Metadatos de los modelos entrenados."""
    regression: dict
    classification: dict
    training_date: str
    feature_names: list[str]


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    warehouse_ready: bool
    models_loaded: bool
    version: str
