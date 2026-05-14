import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// ── Service Worker Registration ─────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/Sono-monitor/sw.js', { scope: '/Sono-monitor/' })
      .then(reg => {
        console.log('[SW] Registado:', reg.scope)

        // Verifica actualizações a cada 60 seg quando o app está aberto
        setInterval(() => reg.update(), 60_000)

        reg.addEventListener('updatefound', () => {
          const newSW = reg.installing
          newSW?.addEventListener('statechange', () => {
            if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] Nova versão disponível — recarrega para actualizar')
            }
          })
        })
      })
      .catch(err => console.error('[SW] Registo falhou:', err))
  })
}

// ── Render ──────────────────────────────────────────────────────
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
