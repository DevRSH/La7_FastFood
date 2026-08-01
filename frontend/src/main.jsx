import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Register PWA Service Worker for offline execution
registerSW({
  onNeedRefresh() {
    console.log('PWA: Nueva versión disponible.')
  },
  onOfflineReady() {
    console.log('PWA: Aplicación lista para trabajar offline.')
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
