# AI_USAGE.md -- Documentacion de uso de IA en el proyecto

Este documento registra los prompts y fragmentos de codigo generados con asistencia
de inteligencia artificial durante el desarrollo del proyecto Superstore Analytics.

---

## Tabla de contenidos

1. [Herramienta utilizada](#herramienta-utilizada)
2. [Prompts utilizados por componente](#prompts-utilizados-por-componente)
3. [Fragmentos de codigo complejos asistidos por IA](#fragmentos-de-codigo-complejos-asistidos-por-ia)
4. [Decisiones de diseno influenciadas por IA](#decisiones-de-diseno-influenciadas-por-ia)

---

## Herramienta utilizada

| Campo | Valor |
|-------|-------|
| Asistente | Antigravity (Google DeepMind) |
| Modelo | Gemini / Claude |
| Tipo de uso | Pair programming interactivo |
| Periodo | Mayo 2026 |

---

## Prompts utilizados por componente

### Prompt 1 -- Definicion general del proyecto

> Quiero que trabajes sobre el siguiente proyecto [...] trabaja sobre los archivos
> que estan en las carpetas de data, backend, notebook. Quiero que los modelos
> preentrenados se guarden en la carpeta de saved_models, el dataset es el que esta
> en la carpeta dentro de data en raw, y que se visualice en la carpeta de cliente.
> Crea dos componentes para visualizar.

**Componentes generados**: Todo el pipeline de 4 capas (warehouse, notebook, backend, frontend).

---

### Prompt 2 -- Backend: DuckDB Star-Schema + FastAPI

> [Parte de las instrucciones del proyecto]
> Actividad 2 -- Data Warehouse: organizar los datos para que el analisis sea
> interactivo, dimensional y eficiente.

**Archivos generados**:

- `backend/app/database.py` -- Construccion del esquema estrella y 7 consultas OLAP
- `backend/app/main.py` -- Endpoints REST con FastAPI
- `backend/app/models.py` -- Esquemas Pydantic de request/response
- `backend/app/pipeline.py` -- Carga de modelos e inferencia

---

### Prompt 3 -- Notebook: EDA + ML

> Actividad 1 -- EDA y preprocesamiento: entender que hay en los datos y dejarlos
> listos antes de tocar un modelo.
> Actividad 3 -- Machine Learning: regresion y clasificacion con metodologia rigurosa.

**Archivo generado**: `notebook/eda_reproducible.ipynb`

Pipeline completo: carga, limpieza, feature engineering, split estratificado,
entrenamiento de 3 modelos de regresion + 4 de clasificacion, comparacion y exportacion.

---

### Prompt 4 -- Frontend: Componentes React

> Quiero que se visualice en la carpeta de cliente, crea dos componentes para
> visualizar.

**Archivos generados iniciales**:

- `client/src/components/OLAPDashboard.tsx` -- Dashboard con 5 graficas Recharts
- `client/src/components/Predictor.tsx` -- Formulario de prediccion + resultados
- `client/src/App.tsx` -- Navegacion por tabs

---

### Prompt 5 -- Rediseno monocromatico

> Aplica un esquema estrictamente monocromatico o acromatico, evitando los colores
> de fondo muy oscuros, evitando los colores fosforescente, quita los emojis y
> ponles iconos de react. Lo que buscamos es que sea un producto funcional que
> pueda verse los datos que se busca mostrar sin que otra cosa distraiga al usuario.

**Cambios aplicados**:

- Toda la paleta de colores se redujo a escala de grises (#1a1a1a a #fafafa)
- Todos los emojis reemplazados por iconos de `react-icons` (Tabler Icons, Heroicons)
- Fondo claro (#f8f8fa) en lugar de oscuro
- Graficas con tonos monocromaticos

---

### Prompt 6 -- Refactorizacion Clean Architecture + MVVM

> Actua como un Arquitecto de Software experto en Front-End. Tu objetivo es
> refactorizar el codigo de la carpeta cliente separando la interfaz de usuario
> (UI) de la logica de negocio.
>
> Aplica estrictamente las siguientes directrices de diseno:
> 1. Arquitectura Limpia (Clean Architecture)
> 2. Patron MVVM
> 3. Principios SOLID
> 4. Mantenibilidad y Escalabilidad
> 5. Mejora un poco el diseno, minimalista y graficas cientificas

**Archivos generados** (16 archivos nuevos, 2 eliminados):

Capa Core (Dominio):
- `core/models/olap.types.ts` -- Entidades OLAP
- `core/models/prediction.types.ts` -- Entidades ML + constantes
- `core/ports/IOlapRepository.ts` -- Interfaz OLAP
- `core/ports/IPredictionRepository.ts` -- Interfaz ML

Capa Data:
- `data/api/apiClient.ts` -- Wrapper HTTP
- `data/repositories/OlapRepository.ts` -- Implementacion OLAP
- `data/repositories/PredictionRepository.ts` -- Implementacion ML

Capa Presentation:
- `presentation/viewmodels/useDashboardViewModel.ts` -- ViewModel Dashboard
- `presentation/viewmodels/usePredictorViewModel.ts` -- ViewModel Predictor
- `presentation/views/DashboardView.tsx` -- Vista pasiva Dashboard
- `presentation/views/PredictorView.tsx` -- Vista pasiva Predictor
- `presentation/components/StatCard.tsx` -- Componente reutilizable
- `presentation/components/ChartCard.tsx` -- Componente reutilizable
- `presentation/components/ChartTooltip.tsx` -- Tooltip cientifico
- `presentation/components/MetricBadge.tsx` -- Badge de metrica
- `presentation/utils/formatters.ts` -- Funciones de formateo

---

## Fragmentos de codigo complejos asistidos por IA

### Fragmento 1 -- Construccion del esquema estrella (database.py)

El fragmento mas complejo del proyecto. Construye 4 tablas dimensionales y
una tabla de hechos con surrogate keys usando merge en lugar de map (para
evitar `InvalidIndexError` con claves duplicadas):

```python
# Mapear surrogate keys usando merge para manejar duplicados
cust_lookup = dim_customer.drop_duplicates(subset=["Customer_ID"])[["Customer_ID", "customer_key"]]
prod_lookup = dim_product.drop_duplicates(subset=["product_id"])[["product_id", "product_key"]]

fact = fact.merge(cust_lookup, on="Customer_ID", how="left")
fact = fact.merge(prod_lookup, on="product_id", how="left")
fact = fact.merge(dim_geography[["geo_key"] + geo_cols_lower], on=geo_cols_lower, how="left")
fact = fact.merge(date_lookup.rename(columns={"full_date": "order_date"}),
                  on="order_date", how="left").rename(columns={"date_key": "date_key"})
fact = fact.merge(date_lookup.rename(columns={"full_date": "ship_date", "date_key": "ship_date_key"}),
                  on="ship_date", how="left")
```

**Por que es complejo**: El dataset tiene claves naturales duplicadas (un mismo
Customer_ID aparece multiples veces). Usar `map` con un diccionario falla cuando
hay indices duplicados. La solucion fue usar `merge` con `drop_duplicates` previo.

---

### Fragmento 2 -- Estimacion de Shipping_Days en inferencia (pipeline.py)

El modelo fue entrenado con una feature `Shipping_Days` calculada como la
diferencia entre Ship_Date y Order_Date. En inferencia, el usuario no provee
fechas, asi que se estima basandose en el modo de envio:

```python
def _prepare_input(features: dict) -> pd.DataFrame:
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
```

**Por que es complejo**: Hay un desajuste entre las features de entrenamiento
(que incluyen `Shipping_Days`) y las features disponibles en inferencia (el
usuario no conoce la fecha de envio futura). Se resolvio con un mapeo basado
en los promedios observados del dataset.

---

### Fragmento 3 -- ViewModel con inyeccion de dependencias (useDashboardViewModel.ts)

Hook personalizado que implementa el patron MVVM con inyeccion del repositorio
a traves de la interfaz (Dependency Inversion):

```typescript
export function useDashboardViewModel(repo: IOlapRepository): DashboardViewModel {
  const [state, setState] = useState<DashboardState>({...});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [cat, reg, trend, disc, seg, sub] = await Promise.all([
          repo.getSalesByCategory(),
          repo.getSalesByRegion(),
          repo.getMonthlyTrend(),
          repo.getDiscountImpact(),
          repo.getProfitBySegment(),
          repo.getSubcategoryAnalysis(),
        ]);
        if (!cancelled) {
          setState({ ...data, loading: false, error: null });
        }
      } catch (err) {
        if (!cancelled) setState(prev => ({ ...prev, loading: false, error: String(err) }));
      }
    }
    load();
    return () => { cancelled = true; };
  }, [repo]);

  const kpis = useMemo<DashboardKPIs>(() => {
    // KPIs derivados calculados con useMemo
  }, [state.salesByCategory, state.profitBySegment, state.subcategoryData]);

  return { state, kpis, trendData };
}
```

**Por que es complejo**: Combina multiples patrones en un solo hook:
- Inyeccion de dependencias via parametro (DIP)
- Cancellation pattern para evitar actualizaciones tras desmontaje
- `useMemo` para KPIs derivados (evita recalculos innecesarios)
- Carga paralela con `Promise.all`

---

### Fragmento 4 -- Consultas OLAP con JOINs dimensionales (database.py)

Consultas SQL que explotan el esquema estrella para agregar datos multidimensionalmente:

```sql
SELECT
    f.discount,
    ROUND(AVG(f.profit), 2) AS avg_profit,
    ROUND(AVG(f.sales), 2) AS avg_sales,
    COUNT(*) AS order_count,
    ROUND(SUM(CASE WHEN f.is_profitable = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1)
        AS pct_profitable
FROM fact_sales f
GROUP BY f.discount
ORDER BY f.discount
```

**Por que es complejo**: La columna `pct_profitable` calcula un porcentaje
condicional inline usando `CASE WHEN` dentro de un `SUM`, dividido por `COUNT`.
Esto evita una subconsulta y mantiene el rendimiento.

---

### Fragmento 5 -- Composition Root con inyeccion de dependencias (App.tsx)

Punto unico donde las dependencias concretas se instancian e inyectan:

```tsx
function App() {
  const olapRepo = useMemo(() => new OlapRepository(), []);
  const predRepo = useMemo(() => new PredictionRepository(), []);

  const dashboardVm = useDashboardViewModel(olapRepo);
  const predictorVm = usePredictorViewModel(predRepo);

  return (
    <>
      <DashboardView vm={dashboardVm} />
      <PredictorView vm={predictorVm} />
    </>
  );
}
```

**Por que es complejo**: Es el unico archivo que conoce las implementaciones
concretas. Los ViewModels solo ven interfaces. `useMemo(() => new Repo(), [])`
garantiza que la instancia es estable y no causa re-renders infinitos.

---

## Decisiones de diseno influenciadas por IA

| Decision | Justificacion |
|----------|---------------|
| Usar `merge` en lugar de `map` para surrogate keys | Evitar `InvalidIndexError` con claves duplicadas en pandas |
| Estimar `Shipping_Days` por modo de envio | La feature existe en entrenamiento pero no en inferencia |
| ColumnTransformer con `StandardScaler` + `OneHotEncoder` | Prevenir data leakage encapsulando preprocesamiento en el pipeline |
| DuckDB en lugar de SQLite | Optimizado para consultas analiticas OLAP (columnar) |
| Custom hooks como ViewModels | Alineacion natural con el modelo reactivo de React |
| Inyeccion de dependencias via parametro | Permite testing sin DOM y sustitucion de implementaciones |
| JetBrains Mono para valores numericos | Tipografia monoespaciada mejora la legibilidad de metricas |
