import { StrictMode as _StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import SimpleApp from './SimpleApp.jsx'
import './index.css'

console.log('[BOOT] main.jsx loaded');
const rootEl = document.getElementById('root');
if(!rootEl){
  document.write('<pre style="color:red">Elemento root non trovato</pre>');
} else {
  console.log('[BOOT] rendering SimpleApp');
}

// Use simplified, decoupled app architecture
ReactDOM.createRoot(rootEl).render(
  <_StrictMode>
    <SimpleApp />
  </_StrictMode>
)
