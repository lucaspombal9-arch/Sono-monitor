# ⚡ Elite Sleep — Atleta Pro Monitor

PWA de monitorização de sono para atletas de futebol profissional.  
Readiness Score · Protocolo Noturno · Sestas · Análise SNC

---

## 🗂 Estrutura do Projeto

```
elite-sleep-pwa/
├── public/
│   ├── manifest.json          ← Manifesto PWA (45/45 PWABuilder)
│   ├── sw.js                  ← Service Worker (Cache-First + SWR)
│   ├── icons/                 ← Todos os ícones PNG (72→512 + maskable)
│   └── screenshots/           ← Screenshots para PWABuilder
├── src/
│   ├── main.jsx               ← Entry point + SW registration
│   ├── App.jsx                ← App completo com todas as tabs
│   └── storage.js             ← localStorage wrapper
├── index.html                 ← HTML com todas as meta tags
├── vite.config.js             ← Config Vite para GitHub Pages
└── package.json
```

---

## 🚀 Instalação Local

```bash
# 1. Instalar dependências
npm install

# 2. Servidor de desenvolvimento
npm run dev
# → http://localhost:5173

# 3. Build de produção (para deploy manual)
npm run build
# → pasta /dist pronta para deploy
```

---

## 🌍 Deploy no GitHub Pages

### Método 1 — GitHub Actions (automático, recomendado)

1. Cria o repositório no GitHub: `github.com/SEU_USERNAME/elite-sleep-pwa`
2. Faz push de todos os ficheiros para a branch `main`
3. Vai a **Settings → Pages → Source: GitHub Actions**
4. O deploy acontece automaticamente a cada push

**URL final:** `https://SEU_USERNAME.github.io/elite-sleep-pwa/`

### Método 2 — Deploy manual

```bash
# Build com o base path correto do teu repositório
VITE_BASE=/elite-sleep-pwa/ npm run build

# Faz push da pasta /dist para a branch gh-pages
npm run deploy
```

---

## 📱 Instalar como PWA

**Android (Chrome):**  
Abre o site → Menu (⋮) → "Adicionar ao ecrã inicial"

**iOS (Safari):**  
Abre o site → ⎙ Partilhar → "Adicionar ao Ecrã de Início"

**Desktop (Chrome/Edge):**  
Ícone de instalação (➕) na barra de endereço

---

## ⚙️ Testar o Score PWABuilder

1. Abre [pwabuilder.com](https://www.pwabuilder.com)
2. Cola a URL do teu GitHub Pages
3. Deverá mostrar **45/45** ✅

### Checklist para 45/45:
- [x] Manifesto com `id`, `name`, `short_name`, `description`
- [x] `display: standalone`
- [x] `theme_color` e `background_color`
- [x] Ícones maskable 192px + 512px
- [x] `screenshots` com `form_factor: narrow` e `wide`
- [x] `shortcuts` (Sestas + Treino)
- [x] `categories: ["sports", "health"]`
- [x] Service Worker registado
- [x] Funciona 100% offline
- [x] HTTPS (GitHub Pages fornece automaticamente)
- [x] `lang` e `dir` definidos

---

## 🔧 Personalizar o Base Path

Se o teu repositório tiver um nome diferente, edita a linha no `vite.config.js`:

```js
const base = process.env.VITE_BASE || './'
```

E no workflow `.github/workflows/deploy.yml`, o `VITE_BASE` é definido automaticamente pelo nome do repositório.

---

## 📐 Design System

| Token   | Valor       | Uso                          |
|---------|-------------|------------------------------|
| `bg`    | `#06060b`   | Fundo principal              |
| `sur`   | `#0b0b15`   | Cards / superfícies          |
| `acc`   | `#00ff88`   | Accent principal (neon lime) |
| `cyan`  | `#00cfff`   | Accent secundário            |
| `txt`   | `#dde0f0`   | Texto principal              |
| `mut`   | `#525268`   | Texto secundário / labels    |

**Fontes:** Bebas Neue (headings) · Space Mono (dados/labels) · DM Sans (corpo)
