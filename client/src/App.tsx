/**
 * App.tsx — Composition Root
 * ---------------------------
 * Aqui se instancian las dependencias concretas (repositorios)
 * y se inyectan a los ViewModels. Es el unico lugar que conoce
 * las implementaciones concretas.
 */

import { useState, useMemo } from 'react';
import { TbChartDots3, TbLayoutDashboard, TbCpu } from 'react-icons/tb';

import { OlapRepository } from './data/repositories/OlapRepository';
import { PredictionRepository } from './data/repositories/PredictionRepository';
import { useDashboardViewModel } from './presentation/viewmodels/useDashboardViewModel';
import { usePredictorViewModel } from './presentation/viewmodels/usePredictorViewModel';
import { DashboardView } from './presentation/views/DashboardView';
import { PredictorView } from './presentation/views/PredictorView';
import './App.css';

type Tab = 'dashboard' | 'predictor';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  // Repositorios estables (instanciados una sola vez)
  const olapRepo = useMemo(() => new OlapRepository(), []);
  const predRepo = useMemo(() => new PredictionRepository(), []);

  // ViewModels con inyeccion de dependencias
  const dashboardVm = useDashboardViewModel(olapRepo);
  const predictorVm = usePredictorViewModel(predRepo);

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-title">
            <div className="header-icon"><TbChartDots3 /></div>
            <div>
              <h1>Superstore Analytics</h1>
              <span className="header-subtitle">Warehouse OLAP &middot; Machine Learning</span>
            </div>
          </div>
          <nav className="nav-tabs">
            <button id="tab-dashboard"
              className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}>
              <TbLayoutDashboard /> Dashboard
            </button>
            <button id="tab-predictor"
              className={`nav-tab ${activeTab === 'predictor' ? 'active' : ''}`}
              onClick={() => setActiveTab('predictor')}>
              <TbCpu /> Predictor
            </button>
          </nav>
        </div>
      </header>

      <main>
        {activeTab === 'dashboard' && <DashboardView vm={dashboardVm} />}
        {activeTab === 'predictor' && <PredictorView vm={predictorVm} />}
      </main>

      <footer className="footer">
        Superstore Analytics &mdash; DuckDB + scikit-learn + FastAPI + React
      </footer>
    </div>
  );
}

export default App;
