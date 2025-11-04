import React, { useState } from 'react';
import Dashboard from './Dashboard.tsx';
import ScenarioModelAPI from './ScenarioModelAPI.tsx';
import ScenarioModelAPIOptimized from './optimized/ScenarioModelAPIOptimized.tsx';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  return (
    <div>
      {/* Navigation Bar */}
      <div style={{
        backgroundColor: '#0F2B5B',
        padding: '1rem 2rem',
        display: 'flex',
        gap: '1rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <button
          onClick={() => setCurrentView('dashboard')}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
            backgroundColor: currentView === 'dashboard' ? '#006470' : 'transparent',
            color: 'white',
            transition: 'all 0.2s'
          }}
        >
          📊 Dashboard
        </button>
        <button
          onClick={() => setCurrentView('scenario')}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
            backgroundColor: currentView === 'scenario' ? '#006470' : 'transparent',
            color: 'white',
            transition: 'all 0.2s'
          }}
        >
          🔮 Scenario Model (Origineel)
        </button>
        <button
          onClick={() => setCurrentView('scenario-optimized')}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
            backgroundColor: currentView === 'scenario-optimized' ? '#006470' : 'transparent',
            color: 'white',
            transition: 'all 0.2s'
          }}
        >
          ⚡ Scenario Model GEOPTIMALISEERD
        </button>
      </div>

      {/* Content */}
      {currentView === 'dashboard' && <Dashboard />}
      {currentView === 'scenario' && <ScenarioModelAPI />}
      {currentView === 'scenario-optimized' && <ScenarioModelAPIOptimized />}
    </div>
  );
}

export default App;
