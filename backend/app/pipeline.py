"""
pipeline.py — Capa de modelado: carga de modelos e inferencia
==============================================================
Carga los modelos pre-entrenados desde saved_models/ y expone funciones
de predicción para regresión (profit) y clasificación (rentabilidad).
"""

import json
import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Optional

# ── Rutas ──────────────────────────────────────────────────────────────────────
BASE_DIR   = Path(__file__).resolve().parent.parent.parent
MODELS_DIR = BASE_DIR / "saved_models"

# ── Estado global ──────────────────────────────────────────────────────────────
_regression_model = None
_classification_model = None
_preprocessor = None
_metadata = None


def load_models() -> bool:
    """
    Carga los modelos y el preprocesador desde saved_models/.
    Retorna True si se cargaron correctamente, False si no existen.
    """
    global _regression_model, _classification_model, _preprocessor, _metadata

    reg_path   = MODELS_DIR / "regression_model.joblib"
    clf_path   = MODELS_DIR / "classification_model.joblib"
    pre_path   = MODELS_DIR / "preprocessor.joblib"
    meta_path  = MODELS_DIR / "model_metadata.json"

    if not all(p.exists() for p in [reg_path, clf_path, pre_path, meta_path]):
        print("[WARN] Modelos no encontrados en saved_models/. Ejecuta el notebook primero.")
        return False

    _regression_model     = joblib.load(reg_path)
    _classification_model = joblib.load(clf_path)
    _preprocessor         = joblib.load(pre_path)

    with open(meta_path, "r", encoding="utf-8") as f:
        _metadata = json.load(f)

    print("[OK] Modelos cargados correctamente:")
    print(f"   Regresion:      {_metadata['regression']['model_name']}")
    print(f"   Clasificacion:  {_metadata['classification']['model_name']}")
    return True


def models_loaded() -> bool:
    """Verifica si los modelos están cargados en memoria."""
    return _regression_model is not None and _classification_model is not None


def _prepare_input(features: dict) -> pd.DataFrame:
    """
    Convierte el dict de features en un DataFrame con las columnas
    esperadas por el preprocesador.
    """
    # Estimar Shipping_Days basado en Ship Mode (promedios del dataset)
    shipping_days_map = {
        "Same Day": 0,
        "First Class": 2,
        "Second Class": 3,
        "Standard Class": 5,
    }
    shipping_days = shipping_days_map.get(features["ship_mode"], 4)

    data = {
        "Sales":         [features["sales"]],
        "Quantity":      [features["quantity"]],
        "Discount":      [features["discount"]],
        "Shipping_Days": [shipping_days],
        "Ship_Mode":     [features["ship_mode"]],
        "Segment":       [features["segment"]],
        "Category":      [features["category"]],
        "Sub_Category":  [features["sub_category"]],
        "Region":        [features["region"]],
    }
    return pd.DataFrame(data)


def predict_profit(features: dict) -> dict:
    """
    Predicción de regresión: ¿cuánto profit generará esta orden?
    Retorna el valor predicho junto con info del modelo.
    """
    if not models_loaded():
        raise RuntimeError("Modelos no cargados. Ejecuta load_models() primero.")

    df = _prepare_input(features)
    X = _preprocessor.transform(df)
    prediction = float(_regression_model.predict(X)[0])

    return {
        "predicted_profit": round(prediction, 2),
        "model_name": _metadata["regression"]["model_name"],
        "metrics": _metadata["regression"]["metrics"],
    }


def predict_profitable(features: dict) -> dict:
    """
    Predicción de clasificación: ¿esta orden será rentable?
    Retorna la clase predicha, probabilidad e info del modelo.
    """
    if not models_loaded():
        raise RuntimeError("Modelos no cargados. Ejecuta load_models() primero.")

    df = _prepare_input(features)
    X = _preprocessor.transform(df)

    prediction = int(_classification_model.predict(X)[0])
    probabilities = _classification_model.predict_proba(X)[0]

    return {
        "is_profitable": bool(prediction == 1),
        "probability": round(float(probabilities[1]), 4),
        "predicted_class": "Rentable" if prediction == 1 else "No Rentable",
        "model_name": _metadata["classification"]["model_name"],
        "metrics": _metadata["classification"]["metrics"],
    }


def get_model_metadata() -> Optional[dict]:
    """Retorna los metadatos de entrenamiento de los modelos."""
    return _metadata
