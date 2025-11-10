import React, { useState, useEffect } from 'react';
import './App.css';

// Import nieuwe gerefactorde componenten  
import HistorischDashboard from './pages/HistorischDashboard';
import ScenarioSimulator from './pages/ScenarioSimulator';

// Legacy componenten
import Dashboard from './Dashboard';
import ScenarioModelAPI from './ScenarioModelAPI';
import EnhancedDashboard from './engine/EnhancedDashboard';

function App() {
  const [activeTab, setActiveTab] = useState('historisch');
  const [apiHealthStatus, setApiHealthStatus] = useState('checking');

  // Check API health on mount
  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
        const response = await fetch(`${API_URL}/health`);
        const data = await response.json();
        if (data.status === 'healthy') {
          setApiHealthStatus('connected');
        } else {
          setApiHealthStatus('unhealthy');
        }
      } catch (error) {
        setApiHealthStatus('disconnected');
      }
    };

    checkApiHealth();
    // Check every 30 seconds
    const interval = setInterval(checkApiHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (apiHealthStatus) {
      case 'connected': return '#10b981';
      case 'unhealthy': return '#f59e0b';
      case 'disconnected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = () => {
    switch (apiHealthStatus) {
      case 'connected': return 'API Connected';
      case 'unhealthy': return 'API Unhealthy';
      case 'disconnected': return 'API Disconnected';
      default: return 'Checking...';
    }
  };

  return (
    <div className="App">
      <div style={{ backgroundColor: '#006583', padding: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {/* Logo/Brand */}
            <div style={{ 
              color: 'white', 
              fontWeight: 'bold', 
              fontSize: '1rem',
              marginRight: '1rem'
            }}>
              Capaciteitsorgaan
            </div>
            
            {/* NIEUWE TABS - REFACTORED */}
            <button 
              onClick={() => setActiveTab('historisch')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: activeTab === 'historisch' ? '#ffffff' : 'transparent',
                color: activeTab === 'historisch' ? '#006583' : '#ffffff',
                border: activeTab === 'historisch' ? 'none' : '1px solid rgba(255,255,255,0.2)',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.875rem',
                transition: 'all 0.2s'
              }}
            >
              📊 Historisch Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('simulator')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: activeTab === 'simulator' ? '#ffffff' : 'transparent',
                color: activeTab === 'simulator' ? '#006583' : '#ffffff',
                border: activeTab === 'simulator' ? 'none' : '1px solid rgba(255,255,255,0.2)',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.875rem',
                transition: 'all 0.2s'
              }}
            >
              🔮 Scenario Simulator
            </button>
            
            {/* Separator */}
            <div style={{ 
              width: '1px', 
              backgroundColor: 'rgba(255,255,255,0.3)', 
              margin: '0 0.5rem',
              height: '2rem'
            }} />
            
            {/* LEGACY TABS */}
            <button 
              onClick={() => setActiveTab('legacy-api')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: activeTab === 'legacy-api' ? '#ffffff' : 'transparent',
                color: activeTab === 'legacy-api' ? '#006583' : 'rgba(255,255,255,0.6)',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontSize: '0.75rem',
                transition: 'all 0.2s'
              }}
            >
              Legacy API Model
            </button>
            <button 
              onClick={() => setActiveTab('legacy-dashboard')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: activeTab === 'legacy-dashboard' ? '#ffffff' : 'transparent',
                color: activeTab === 'legacy-dashboard' ? '#006583' : 'rgba(255,255,255,0.6)',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontSize: '0.75rem',
                transition: 'all 0.2s'
              }}
            >
              Legacy Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('legacy-fast')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: activeTab === 'legacy-fast' ? '#ffffff' : 'transparent',
                color: activeTab === 'legacy-fast' ? '#006583' : 'rgba(255,255,255,0.6)',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontSize: '0.75rem',
                transition: 'all 0.2s'
              }}
            >
              Legacy Fast
            </button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: getStatusColor(),
              animation: apiHealthStatus === 'checking' ? 'pulse 2s infinite' : 'none'
            }} />
            <span style={{ color: '#ffffff', fontSize: '0.875rem', fontWeight: '500' }}>
              {getStatusText()}
            </span>
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
      </style>

      <div>
        {/* NIEUWE GEREFACTORDE COMPONENTEN */}
        {activeTab === 'historisch' && <HistorischDashboard />}
        {activeTab === 'simulator' && <ScenarioSimulator />}
        
        {/* LEGACY COMPONENTEN */}
        {activeTab === 'legacy-api' && <ScenarioModelAPI />}
        {activeTab === 'legacy-dashboard' && <Dashboard />}
        {activeTab === 'legacy-fast' && <EnhancedDashboard />}
      </div>
    </div>
  );
}

export default App;
