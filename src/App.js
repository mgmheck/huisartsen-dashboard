import React, { useState } from 'react';
import Dashboard from './Dashboard.tsx';
import ScenarioModelAPI from './ScenarioModelAPI.tsx';
import EnhancedDashboard from './engine/EnhancedDashboard.js';

function App() {
  const [currentView, setCurrentView] = useState('enhanced');

  return (
    <div>
      {/* Navigation Bar */}
      <div style={{
        backgroundColor: '#0F2B5B',
        padding: '1rem 2rem',
        display: 'flex',
        gap: '1rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        alignItems: 'center'
      }}>
        <button
          onClick={() => setCurrentView('enhanced')}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
            backgroundColor: currentView === 'enhanced' ? '#10b981' : 'transparent',
            color: 'white',
            transition: 'all 0.2s'
          }}
        >
          🚀 Fast Dashboard (JavaScript)
        </button>
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
          📊 Dashboard (R Backend)
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
          🔮 Scenario Model (Stata-accurate)
        </button>
        
        {/* Performance indicator */}
        {currentView === 'enhanced' && (
          <div style={{
            marginLeft: 'auto',
            padding: '0.5rem 1rem',
            backgroundColor: '#10b981',
            borderRadius: '0.5rem',
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: 'bold'
          }}>
            ⚡ &lt;50ms response tijd
          </div>
        )}
      </div>

      {/* Content */}
      {currentView === 'enhanced' && <EnhancedDashboard />}
      {currentView === 'dashboard' && <Dashboard />}
      {currentView === 'scenario' && <ScenarioModelAPI />}
    </div>
  );
}

export default App;