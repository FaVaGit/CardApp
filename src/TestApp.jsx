import React, { useState, useEffect } from 'react';

export default function TestApp() {
  const [status, setStatus] = useState('Initializing...');
  const [results, setResults] = useState([]);

  const addResult = (message) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    async function testConnection() {
      try {
        setStatus('Testing REST API...');
        addResult('Starting REST API test');
        
        const response = await fetch('http://localhost:5000/api/health');
        const data = await response.json();
        addResult(`✅ Health Check: ${JSON.stringify(data)}`);
        
        const cardsResponse = await fetch('http://localhost:5000/api/game/cards/couple');
        const cardsData = await cardsResponse.json();
        addResult(`✅ Found ${cardsData.length} cards`);
        
        setStatus('Testing SignalR...');
        addResult('Starting SignalR test');
        
        const signalR = await import('@microsoft/signalr');
        const connection = new signalR.HubConnectionBuilder()
          .withUrl('http://localhost:5000/gamehub')
          .withAutomaticReconnect()
          .build();
        
        await connection.start();
        addResult('✅ SignalR connected');
        
        setStatus('✅ All tests passed!');
        
      } catch (error) {
        addResult(`❌ Error: ${error.message}`);
        setStatus('❌ Tests failed');
      }
    }
    
    testConnection();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Backend Connection Test</h1>
      <h2>Status: {status}</h2>
      <div>
        <h3>Results:</h3>
        {results.map((result, index) => (
          <div key={index} style={{ 
            margin: '5px 0', 
            padding: '5px', 
            backgroundColor: result.includes('❌') ? '#ffebee' : '#e8f5e8',
            borderRadius: '3px'
          }}>
            {result}
          </div>
        ))}
      </div>
    </div>
  );
}
