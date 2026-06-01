# AI_USAGE.md

# Documentación de Uso de Inteligencia Artificial

Este documento registra el uso de herramientas de Inteligencia Artificial durante el desarrollo del proyecto **Superstore Analytics**. La IA fue utilizada como asistente de desarrollo (pair programming) para acelerar la implementación de componentes complejos, mientras que las decisiones arquitectónicas, la integración de componentes, la validación de resultados y los ajustes finales fueron realizados por el autor del proyecto.

---

# Herramientas utilizadas

| Herramienta | Uso |
|------------|-----|
| Antigravity | Generación y refinamiento de código |
| Claude | Refactorización, arquitectura y mejoras de diseño |
| Gemini | Apoyo en generación de código y documentación |

**Periodo de uso:** Mayo 2026

---

# Rol de la IA en el proyecto

La Inteligencia Artificial fue utilizada principalmente para:

- Generar estructuras base de código.
- Proponer soluciones técnicas para problemas específicos.
- Generar consultas SQL y componentes de interfaz.
- Refactorizar código existente.
- Sugerir mejoras de arquitectura y organización del proyecto.

Las decisiones sobre:

- Arquitectura general.
- Organización del repositorio.
- Integración de componentes.
- Selección de tecnologías.
- Validación de resultados.
- Ajustes finales de diseño.

fueron realizadas por el autor del proyecto.

---

# Prompts utilizados

## Prompt 1 — Construcción general del proyecto

> Quiero que trabajes sobre el siguiente proyecto de minería de datos utilizando las carpetas data, notebook, backend y client. Los modelos entrenados deben guardarse en saved_models. El sistema debe incluir análisis exploratorio, warehouse dimensional, modelos de machine learning, API REST y visualización web.

**Resultado:**

- Estructura general del proyecto.
- Organización del pipeline completo.
- Integración entre notebook, backend y frontend.

---

## Prompt 2 — Data Warehouse y Backend

> Implementa un Data Warehouse dimensional utilizando DuckDB con esquema estrella y expón consultas OLAP mediante FastAPI.

**Archivos generados o refinados:**

- `backend/app/database.py`
- `backend/app/main.py`
- `backend/app/models.py`
- `backend/app/pipeline.py`

**Mi decisión:**

Mantener una arquitectura modular para facilitar futuras modificaciones y separación de responsabilidades.

---

## Prompt 3 — EDA y Machine Learning

> Realiza el análisis exploratorio, limpieza de datos, feature engineering y entrenamiento de modelos de regresión y clasificación siguiendo una metodología reproducible.

**Resultado:**

- Notebook de análisis.
- Comparación de modelos.
- Exportación de modelos entrenados.
- Generación de métricas de evaluación.

---

## Prompt 4 — Frontend inicial

> Crea una interfaz web para visualizar métricas OLAP y realizar predicciones sobre nuevas órdenes.

**Resultado:**

- Dashboard analítico.
- Formulario de predicción.
- Integración con la API.

---

## Prompt 5 — Mejora visual

> Simplifica el diseño utilizando una interfaz profesional, minimalista y enfocada en la visualización de datos.

**Resultado:**

- Eliminación de elementos distractores.
- Paleta monocromática.
- Componentes reutilizables.
- Mejor presentación de métricas y gráficas.

---

## Prompt 6 — Refactorización arquitectónica

> Refactoriza el frontend aplicando Clean Architecture, MVVM y principios SOLID para que el proyecto sea escalable y mantenible.

**Resultado:**

- Separación entre dominio, datos y presentación.
- Implementación de ViewModels.
- Repositorios desacoplados.
- Componentes reutilizables.

**Mi decisión:**

Solicité explícitamente una arquitectura limpia para mejorar mantenibilidad, escalabilidad y facilidad de extensión del proyecto.

---

# Fragmentos complejos asistidos por IA

## Construcción del esquema estrella

La IA generó gran parte de la lógica para:

- Crear dimensiones.
- Generar surrogate keys.
- Construir la tabla de hechos.
- Relacionar entidades mediante JOINs.

Posteriormente se realizaron ajustes manuales para garantizar consistencia de datos.

---

## Pipeline de inferencia

La IA generó la estructura base de carga de modelos y predicción.

Se adaptó manualmente para:

- Mantener compatibilidad con las features del entrenamiento.
- Estimar `Shipping_Days` durante inferencia.
- Integrar los modelos exportados desde el notebook.

---

## Consultas OLAP

La IA generó consultas SQL utilizadas para:

- Ventas por categoría.
- Ventas por región.
- Tendencia mensual.
- Profit por segmento.
- Impacto del descuento.
- Análisis por subcategoría.

Estas consultas fueron integradas al esquema dimensional implementado en DuckDB.

---

## Frontend con arquitectura limpia

La IA generó la estructura inicial basada en:

- Clean Architecture.
- MVVM.
- Principios SOLID.

Posteriormente se realizaron ajustes para:

- Mejorar navegación.
- Optimizar visualización.
- Integrar correctamente la API desarrollada.

---

# Decisiones de diseño influenciadas por IA

| Decisión | Justificación |
|-----------|---------------|
| DuckDB como motor OLAP | Excelente rendimiento analítico sin requerir servidor externo |
| Esquema estrella | Simplifica consultas multidimensionales |
| FastAPI | Desarrollo rápido de API REST tipada |
| ColumnTransformer | Encapsula el preprocesamiento y evita data leakage |
| OneHotEncoder | Adecuado para variables categóricas sin orden natural |
| Clean Architecture | Facilita mantenimiento y escalabilidad |
| MVVM | Separa la lógica de negocio de la interfaz |
| SOLID | Reduce acoplamiento y mejora extensibilidad |

---

# Declaración final

La Inteligencia Artificial fue utilizada como herramienta de asistencia para generar y refactorizar código, así como para proponer soluciones técnicas. Sin embargo, la definición del alcance, las decisiones arquitectónicas, la integración de componentes, la validación de resultados y la adaptación final del sistema fueron realizadas por el autor del proyecto.

El uso de IA permitió acelerar el desarrollo sin sustituir el proceso de análisis, evaluación y toma de decisiones requerido durante la construcción del proyecto.