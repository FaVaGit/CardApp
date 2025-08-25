import React from 'react'
import ReactDOM from 'react-dom/client'
import AppUnified from './AppUnified.jsx'
import './index.css'

// Use unified app with single backend
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppUnified />
  </React.StrictMode>,
)
