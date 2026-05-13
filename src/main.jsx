import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// ── PWA: captura beforeinstallprompt ANTES do React montar ─────
// CRÍTICO: tem de ser a primeira coisa a correr
window.__deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); // bloqueia o mini-infobar automático do Chrome
  window.__deferredInstallPrompt = e;
  window.dispatchEvent(new Event('pwa-installable'));
  console.log('[PWA] ✓ beforeinstallprompt capturado');
});

window.addEventListener('appinstalled', () => {
  window.__deferredInstallPrompt = null;
  console.log('[PWA] ✓ App instalada');
});

// ── Handle shortcut URL params ─────────────────────────────────
const params = new URLSearchParams(window.location.search);
const tabParam = params.get('tab');
if (tabParam === 'sestas') window.__initialTab = 3;
if (tabParam === 'treino') window.__initialTab = 2;

// ── Service Worker — caminho e scope ABSOLUTOS ─────────────────
// CORRIGIDO: './sw.js' com scope './' falha no GitHub Pages
// porque a base é /Sono-monitor/ — tem de ser absoluto
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/Sono-monitor/sw.js', { scope: '/Sono-monitor/' })
      .then(reg => {
        console.log('[SW] ✓ Registado. Scope:', reg.scope);
        setInterval(() => {
          if (document.visibilityState === 'visible') reg.update();
        }, 60_000);
      })
      .catch(err => console.error('[SW] ✗ Falha no registo:', err));
  });
}

// ── Render ─────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
