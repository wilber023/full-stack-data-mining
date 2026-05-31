# Client Architecture — Clean Architecture + MVVM

## Tabla de contenidos

1. [Justificacion arquitectonica](#justificacion-arquitectonica)
2. [Estructura del proyecto](#estructura-del-proyecto)
3. [Capas y responsabilidades](#capas-y-responsabilidades)
4. [Flujo de datos](#flujo-de-datos)
5. [Principios SOLID aplicados](#principios-solid-aplicados)
6. [Mapa de archivos](#mapa-de-archivos)

---

## Justificacion arquitectonica

La refactorizacion aplica **Clean Architecture** combinada con el patron **MVVM** (Model-View-ViewModel) por las siguientes razones tecnicas:

| Problema anterior | Solucion aplicada |
|---|---|
| Los componentes mezclaban `fetch`, estado y rendering en un solo archivo | Separacion en 3 capas: Core, Data, Presentation |
| Cambiar la fuente de datos requeria tocar la UI | Contratos (ports/interfaces) desacoplan datos de presentacion |
| No era posible testear la logica sin renderizar | Los ViewModels son hooks puros, testeables sin DOM |
| Tipos dispersos e inferidos | Entidades de dominio centralizadas con tipado fuerte |
| Logica de negocio duplicada en cada componente | Formatters y constantes extraidos como utilidades |

### Por que MVVM y no MVC u otro patron

- **MVVM** se alinea naturalmente con React Hooks: cada ViewModel es un custom hook que expone estado reactivo.
- La **vista es pasiva**: solo recibe props del ViewModel y renderiza. Cero logica condicional de negocio.
- El ViewModel es **testeable unitariamente** con `renderHook()` de testing-library sin montar componentes.

---

## Estructura del proyecto

```
src/
|
|-- core/                           # CAPA DE DOMINIO
|   |-- models/                     # Entidades / tipos de dominio
|   |   |-- olap.types.ts           # Tipos para consultas OLAP
|   |   |-- prediction.types.ts     # Tipos para prediccion ML
|   |-- ports/                      # Interfaces / contratos (DIP)
|       |-- IOlapRepository.ts      # Contrato de acceso a datos OLAP
|       |-- IPredictionRepository.ts# Contrato de acceso a datos ML
|
|-- data/                           # CAPA DE DATOS
|   |-- api/
|   |   |-- apiClient.ts            # Abstraccion HTTP (fetch wrapper)
|   |-- repositories/
|       |-- OlapRepository.ts       # Implementacion concreta IOlapRepository
|       |-- PredictionRepository.ts # Implementacion concreta IPredictionRepository
|
|-- presentation/                   # CAPA DE PRESENTACION
|   |-- viewmodels/                 # ViewModels (logica de estado)
|   |   |-- useDashboardViewModel.ts# VM del dashboard OLAP
|   |   |-- usePredictorViewModel.ts# VM del predictor ML
|   |-- views/                      # Vistas pasivas (solo rendering)
|   |   |-- DashboardView.tsx       # Vista del dashboard
|   |   |-- PredictorView.tsx       # Vista del predictor
|   |-- components/                 # Componentes reutilizables
|   |   |-- StatCard.tsx            # Tarjeta de KPI
|   |   |-- ChartCard.tsx           # Contenedor de grafica
|   |   |-- ChartTooltip.tsx        # Tooltip para graficas
|   |   |-- MetricBadge.tsx         # Badge de metrica ML
|   |-- utils/
|       |-- formatters.ts           # Funciones puras de formateo
|
|-- App.tsx                         # COMPOSITION ROOT (inyeccion de dependencias)
|-- App.css                         # Estilos de componentes
|-- index.css                       # Design system base
|-- main.tsx                        # Entry point
```

---

## Capas y responsabilidades

### Core (Dominio)

Capa mas interna. No depende de ninguna otra capa.

| Elemento | Archivo | Responsabilidad |
|---|---|---|
| Entidades OLAP | `core/models/olap.types.ts` | Define tipos como `CategorySales`, `DashboardKPIs`, `TrendDataPoint` |
| Entidades ML | `core/models/prediction.types.ts` | Define `PredictionInput`, `RegressionResult`, constantes (`SHIP_MODES`, `SUB_CATEGORIES`) |
| Puerto OLAP | `core/ports/IOlapRepository.ts` | Interfaz con 6 metodos para obtener datos OLAP |
| Puerto ML | `core/ports/IPredictionRepository.ts` | Interfaz con 3 metodos para prediccion y metadatos |

Los **ports** son interfaces TypeScript puras. Ninguna implementacion concreta aparece aqui.

### Data

Implementa los contratos definidos en Core. Es la unica capa que conoce los detalles de la API REST.

| Elemento | Archivo | Responsabilidad |
|---|---|---|
| HTTP Client | `data/api/apiClient.ts` | Wrapper de `fetch()` con base URL y manejo de errores centralizado |
| Repo OLAP | `data/repositories/OlapRepository.ts` | Implementa `IOlapRepository` consumiendo `/api/olap/*` |
| Repo ML | `data/repositories/PredictionRepository.ts` | Implementa `IPredictionRepository` consumiendo `/api/predict/*` y `/api/models/*` |

Si manana se cambia la fuente de datos (e.g., GraphQL, WebSocket, mock), solo se reemplaza esta capa.

### Presentation

Capa mas externa. Contiene la UI y la logica de presentacion.

| Elemento | Archivo | Responsabilidad |
|---|---|---|
| VM Dashboard | `viewmodels/useDashboardViewModel.ts` | Carga datos via repositorio, calcula KPIs, formatea tendencia |
| VM Predictor | `viewmodels/usePredictorViewModel.ts` | Gestiona formulario, sub-categorias dependientes, orquesta predicciones |
| Vista Dashboard | `views/DashboardView.tsx` | Renderiza graficas y KPIs (vista pasiva) |
| Vista Predictor | `views/PredictorView.tsx` | Renderiza formulario y resultados (vista pasiva) |
| StatCard | `components/StatCard.tsx` | Tarjeta de metrica reutilizable |
| ChartCard | `components/ChartCard.tsx` | Contenedor de grafica reutilizable |
| ChartTooltip | `components/ChartTooltip.tsx` | Tooltip monocromatico para Recharts |
| MetricBadge | `components/MetricBadge.tsx` | Badge de metrica ML reutilizable |
| Formatters | `utils/formatters.ts` | `fmtCurrency()`, `fmtPercent()` — funciones puras |

### Composition Root

`App.tsx` es el unico archivo que conoce las implementaciones concretas:

```tsx
const olapRepo = useMemo(() => new OlapRepository(), []);
const predRepo = useMemo(() => new PredictionRepository(), []);

const dashboardVm = useDashboardViewModel(olapRepo);
const predictorVm = usePredictorViewModel(predRepo);
```

Las dependencias fluyen hacia adentro: `App -> ViewModel -> Port <- Repository`.

---

## Flujo de datos

```
  [API REST]
      |
      v
  [Repository]  <-- implementa --> [Port/Interface]
      |                                  ^
      v                                  |
  [ViewModel]  ---- depende de -------->
      |
      v
  [View]  (pasiva, solo renderiza)
```

1. La **View** invoca acciones del ViewModel (`predictBoth()`, `updateField()`)
2. El **ViewModel** llama al repositorio a traves de la interfaz
3. El **Repository** ejecuta la llamada HTTP via `apiClient`
4. El resultado fluye de vuelta: Repository -> ViewModel -> View (re-render)

---

## Principios SOLID aplicados

### SRP (Single Responsibility Principle)

Cada archivo tiene exactamente una responsabilidad:
- `apiClient.ts`: solo HTTP
- `OlapRepository.ts`: solo acceso a datos OLAP
- `useDashboardViewModel.ts`: solo logica del dashboard
- `DashboardView.tsx`: solo rendering
- `StatCard.tsx`: solo renderizar una tarjeta de metrica

### OCP (Open/Closed Principle)

Agregar un nuevo endpoint OLAP requiere:
1. Agregar el tipo en `olap.types.ts`
2. Agregar el metodo en `IOlapRepository.ts`
3. Implementar en `OlapRepository.ts`
4. Consumir en el ViewModel

La vista no cambia si el dato ya tiene un componente reutilizable.

### LSP (Liskov Substitution Principle)

Cualquier clase que implemente `IOlapRepository` puede sustituir a `OlapRepository` sin romper el sistema. Ejemplo: un `MockOlapRepository` para testing.

### ISP (Interface Segregation Principle)

Se separan `IOlapRepository` e `IPredictionRepository` en lugar de una interfaz monolitica `IApiRepository`. Cada consumidor depende solo de los metodos que necesita.

### DIP (Dependency Inversion Principle)

Los ViewModels dependen de **abstracciones** (interfaces), no de implementaciones:

```typescript
// El ViewModel recibe la interfaz, no la clase concreta
export function useDashboardViewModel(repo: IOlapRepository)
```

La inyeccion concreta ocurre solo en el Composition Root (`App.tsx`).

---

## Mapa de archivos

| Archivo | Capa | Patron | Principio |
|---|---|---|---|
| `core/models/*.ts` | Dominio | Entities | SRP |
| `core/ports/*.ts` | Dominio | Port/Interface | DIP, ISP |
| `data/api/apiClient.ts` | Datos | Adapter | SRP |
| `data/repositories/*.ts` | Datos | Repository | SRP, LSP |
| `presentation/viewmodels/*.ts` | Presentacion | ViewModel (MVVM) | SRP, DIP |
| `presentation/views/*.tsx` | Presentacion | View (MVVM) | SRP |
| `presentation/components/*.tsx` | Presentacion | UI Component | SRP, OCP |
| `presentation/utils/*.ts` | Presentacion | Utility | SRP |
| `App.tsx` | Root | Composition Root | DIP |

---

## Testeabilidad

La arquitectura permite tres niveles de testing sin dependencias cruzadas:

1. **Unitario (ViewModels)**: Inyectar un mock del repositorio al hook
2. **Integracion (Repositories)**: Mockear `apiClient` y verificar mapeo de endpoints
3. **E2E (Views)**: Renderizar la vista con un ViewModel real o mockeado

Ejemplo de mock para testing:

```typescript
const mockRepo: IOlapRepository = {
  getSalesByCategory: async () => ({ query_type: '', description: '', data: [], record_count: 0 }),
  getSalesByRegion: async () => ({ query_type: '', description: '', data: [], record_count: 0 }),
  // ...
};

const vm = useDashboardViewModel(mockRepo);
```
