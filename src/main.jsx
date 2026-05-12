import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// ── Service Worker Registration ────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js', { scope: './' })
      .then(reg => {
        console.log('[SW] Registered. Scope:', reg.scope);

        // Check for updates every 60s when app is focused
        setInterval(() => {
          if (document.visibilityState === 'visible') reg.update();
        }, 60_000);
      })
      .catch(err => console.warn('[SW] Registration failed:', err));
  });
}

// ── Handle shortcut URL params (tab navigation from manifest) ──
// ?tab=sestas | ?tab=treino
// App.jsx reads window.__initialTab which we set here synchronously
const params = new URLSearchParams(window.location.search);
const tabParam = params.get('tab');
if (tabParam === 'sestas') window.__initialTab = 3;
if (tabParam === 'treino') window.__initialTab = 2;

// ── Render ─────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
