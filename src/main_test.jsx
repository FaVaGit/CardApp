import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// Test component semplice
function TestApp() {
  return (
    <div style={{ padding: '20px', fontSize: '24px', color: 'red' }}>
      <h1>TEST - Se vedi questo, React funziona!</h1>
      <p>Timestamp: {new Date().toLocaleString()}</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TestApp />
  </React.StrictMode>,
)
