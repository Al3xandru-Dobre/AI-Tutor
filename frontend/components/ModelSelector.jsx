import React, { useState, useEffect } from 'react';

const ModelSelector = ({ onProviderChange }) => {
  const [providers, setProviders] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchProviders();
    fetchStats();
  }, []);

  const fetchProviders = async () => {
    const response = await fetch('/api/models/providers');
    const data = await response.json();
    setProviders(data);
  };

  const fetchStats = async () => {
    const response = await fetch('/api/models/stats');
    const data = await response.json();
    setStats(data);
  };

  const switchProvider = async (provider) => {
    await fetch('/api/models/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider })
    });
    fetchProviders();
    onProviderChange(provider);
  };

  if (!providers) return <div>Loading...</div>;

  return (
    <div className="model-selector">
      <h3>🤖 Model Provider</h3>
      
      {Object.entries(providers.providers).map(([name, info]) => (
        <button
          key={name}
          disabled={!info.available}
          className={providers.current === name ? 'active' : ''}
          onClick={() => switchProvider(name)}
        >
          <div>
            <strong>{name.toUpperCase()}</strong>
            <span>{info.speed} | {info.cost}</span>
          </div>
          {stats && (
            <div className="stats">
              <small>
                Requests: {stats.requests[name]} | 
                Avg: {Math.round(stats.avgLatency[name])}ms
              </small>
            </div>
          )}
        </button>
      ))}
    </div>
  );
};

export default ModelSelector;