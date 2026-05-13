import { useState, useEffect, useRef } from 'react'
import { sGet, sSet, sDel, sDelAll } from './storage.js'

/* ── Design Tokens ────────────────────────────────────────────── */
const C = {
  bg:   '#06060b',
  sur:  '#0b0b15',
  card: '#0e0e1a',
  bdr:  '#181828',
  acc:  '#00ff88',
  cyan: '#00cfff',
  amb:  '#f59e0b',
  red:  '#ef4444',
  txt:  '#dde0f0',
  mut:  '#525268',
  dim:  '#1c1c2c',
}

/* ── Helpers ──────────────────────────────────────────────────── */
function sleepMins(bed, wake) {
  const [bh, bm] = bed.split(':').map(Number)
  const [wh, wm] = wake.split(':').map(Number)
  let d = wh * 60 + wm - (bh * 60 + bm)
  if (d <= 0) d += 1440
  return d
}
function calcR(bed, wake) {
  const h = sleepMins(bed, wake) / 60
  if (h >= 9)   return 97
  if (h >= 8.5) return 93
  if (h >= 8)   return 86
  if (h >= 7.5) return 78
  if (h >= 7)   return 70
  if (h >= 6)   return 54
  return Math.max(18, Math.round(h * 9))
}
function getInfo(s) {
  if (s >= 90) return { label: 'PICO DE FORMA', color: C.acc,  glow: 'rgba(0,255,136,.14)' }
  if (s >= 75) return { label: 'PRONTO',        color: C.cyan, glow: 'rgba(0,207,255,.14)' }
  if (s >= 55) return { label: 'MODERADO',      color: C.amb,  glow: 'rgba(245,158,11,.12)' }
  return              { label: 'BAIXO',          color: C.red,  glow: 'rgba(239,68,68,.12)'  }
}
function fmtD(m) {
  const h = Math.floor(m / 60), mn = m % 60
  return mn > 0 ? `${h}h ${mn}m` : `${h}h`
}
function cdBed(bed) {
  const now = new Date()
  const [bh, bm] = bed.split(':').map(Number)
  const t = new Date(); t.setHours(bh, bm, 0, 0)
  if (t <= now) t.setDate(t.getDate() + 1)
  const d = t - now
  return `${Math.floor(d / 3600000)}h ${Math.floor((d % 3600000) / 60000)}m`
}

/* ── Ring SVG ─────────────────────────────────────────────────── */
function Ring({ score, color, sz = 130 }) {
  const r = 48, c = 2 * Math.PI * r, d = (score / 100) * c
  return (
    <svg width={sz} height={sz} viewBox="0 0 108 108" style={{ flexShrink: 0 }}>
      <circle cx="54" cy="54" r={r} fill="none" stroke={C.dim} strokeWidth="7" />
      <circle cx="54" cy="54" r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={`${d} ${c}`} strokeLinecap="round" transform="rotate(-90 54 54)"
        style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: 'stroke-dasharray .8s ease' }} />
      <text x="54" y="50" textAnchor="middle" fill={color}
        fontSize="20" fontFamily="'Bebas Neue',sans-serif" letterSpacing="1">{score}</text>
      <text x="54" y="63" textAnchor="middle" fill={C.mut}
        fontSize="7.5" fontFamily="'Space Mono',monospace">READINESS</text>
    </svg>
  )
}

/* ── Toast ────────────────────────────────────────────────────── */
function Toast({ msg, onClose }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: 'linear-gradient(135deg,#080814,#0d0d20)',
      borderBottom: `2px solid ${C.acc}`, padding: '16px 18px',
      display: 'flex', alignItems: 'center', gap: '14px',
      boxShadow: `0 6px 50px rgba(0,255,136,.3)`,
      animation: 'slideDown .35s ease',
    }}>
      <span style={{ fontSize: '26px' }}>🌙</span>
      <div style={{ flex: 1 }}>
        <div style={{ color: C.acc, fontFamily: "'Bebas Neue',sans-serif", fontSize: '20px', letterSpacing: '2.5px' }}>{msg}</div>
        <div style={{ color: C.mut, fontFamily: "'Space Mono',monospace", fontSize: '10px', marginTop: '2px' }}>
          RECUPERAÇÃO COMEÇA AGORA • SNC A REGENERAR
        </div>
      </div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.mut, fontSize: '18px', cursor: 'pointer' }}>✕</button>
    </div>
  )
}

/* ── Onboarding ───────────────────────────────────────────────── */
const STEPS = [
  { key: 'name',      label: 'O teu nome',              hint: 'Como deves ser chamado',            type: 'text', ph: 'Ex: Luís Pedro' },
  { key: 'bedtime',   label: 'Hora de deitar',           hint: 'A que horas o craque vai dormir?',  type: 'time' },
  { key: 'wakeTime',  label: 'Hora de acordar',          hint: 'Quando o alarme toca',              type: 'time' },
  { key: 'trainTime', label: 'Hora do treino principal', hint: 'Sessão principal do dia',           type: 'time' },
]

function Onboarding({ onSave }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ name: '', bedtime: '22:30', wakeTime: '06:30', trainTime: '10:00' })
  const s  = STEPS[step]
  const ok = Boolean(form[s.key] && String(form[s.key]).trim())

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px 20px', fontFamily: "'DM Sans',sans-serif" }}>
      {/* Brand */}
      <div style={{ marginBottom: '44px', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '18px', margin: '0 auto 12px', background: `linear-gradient(135deg,${C.acc}22,${C.cyan}22)`, border: `1px solid ${C.acc}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>⚡</div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '28px', letterSpacing: '5px', color: C.acc }}>ELITE SLEEP</div>
        <div style={{ color: C.mut, fontSize: '10px', letterSpacing: '4px', fontFamily: "'Space Mono',monospace", marginTop: '4px' }}>ATLETA PRO MONITOR</div>
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '36px' }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{ width: i === step ? '30px' : '8px', height: '8px', borderRadius: '4px', background: i <= step ? C.acc : C.dim, transition: 'all .35s ease', boxShadow: i === step ? `0 0 8px ${C.acc}` : 'none' }} />
        ))}
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: '360px', background: C.sur, borderRadius: '22px', border: `1px solid ${C.bdr}`, padding: '32px 26px' }}>
        <div style={{ color: C.mut, fontSize: '10px', letterSpacing: '3px', fontFamily: "'Space Mono',monospace", marginBottom: '6px' }}>PASSO {step + 1} / {STEPS.length}</div>
        <div style={{ color: C.txt, fontSize: '20px', fontFamily: "'Bebas Neue',sans-serif", letterSpacing: '1px', marginBottom: '4px' }}>{s.label}</div>
        <div style={{ color: C.mut, fontSize: '12px', marginBottom: '22px' }}>{s.hint}</div>
        <input
          autoFocus type={s.type} value={form[s.key]} placeholder={s.ph || ''}
          onChange={e => setForm({ ...form, [s.key]: e.target.value })}
          style={{ width: '100%', background: C.card, border: `1px solid ${C.bdr}`, borderRadius: '12px', padding: '14px 18px', color: C.txt, fontSize: '17px', fontFamily: s.type === 'time' ? "'Space Mono',monospace" : "'DM Sans',sans-serif", outline: 'none', boxSizing: 'border-box', colorScheme: 'dark' }}
          onFocus={e => (e.target.style.borderColor = C.acc)}
          onBlur={e =>  (e.target.style.borderColor = C.bdr)}
        />
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '18px', width: '100%', maxWidth: '360px' }}>
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} style={{ flex: 1, padding: '14px', background: C.card, border: `1px solid ${C.bdr}`, borderRadius: '12px', color: C.mut, fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
            ← Voltar
          </button>
        )}
        <button
          onClick={() => { if (step < STEPS.length - 1) setStep(step + 1); else onSave(form) }}
          disabled={!ok}
          style={{ flex: 2, padding: '14px', background: ok ? C.acc : C.dim, border: 'none', borderRadius: '12px', color: ok ? C.bg : C.mut, fontSize: '14px', fontWeight: '700', cursor: ok ? 'pointer' : 'not-allowed', fontFamily: "'DM Sans',sans-serif", transition: 'all .2s', boxShadow: ok ? `0 0 22px rgba(0,255,136,.4)` : 'none' }}
        >
          {step < STEPS.length - 1 ? 'Continuar →' : 'Entrar no App ⚡'}
        </button>
      </div>
    </div>
  )
}

/* ── Dashboard ────────────────────────────────────────────────── */
function Dashboard({ p }) {
  const sc   = calcR(p.bedtime, p.wakeTime)
  const info = getInfo(sc)
  const dur  = sleepMins(p.bedtime, p.wakeTime)
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'BOM DIA' : hour < 18 ? 'BOA TARDE' : 'BOA NOITE'

  return (
    <div style={{ padding: '22px 18px 16px', overflowY: 'auto', flex: 1 }}>
      <div style={{ marginBottom: '22px' }}>
        <div style={{ color: C.mut, fontSize: '10px', letterSpacing: '3px', fontFamily: "'Space Mono',monospace" }}>
          {greet} • {new Date().toLocaleDateString('pt-PT', { weekday: 'long' }).toUpperCase()}
        </div>
        <div style={{ color: C.txt, fontSize: '28px', fontFamily: "'Bebas Neue',sans-serif", letterSpacing: '2px', marginTop: '2px' }}>
          {p.name.split(' ')[0].toUpperCase()}
        </div>
      </div>

      {/* Readiness */}
      <div style={{ background: C.sur, borderRadius: '20px', border: `1px solid ${C.bdr}`, padding: '22px 18px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '18px', boxShadow: `0 0 50px ${info.glow}` }}>
        <Ring score={sc} color={info.color} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: C.mut, fontSize: '9px', letterSpacing: '3px', fontFamily: "'Space Mono',monospace" }}>PRONTIDÃO HOJE</div>
          <div style={{ color: info.color, fontSize: '22px', fontFamily: "'Bebas Neue',sans-serif", letterSpacing: '2px', marginTop: '4px' }}>{info.label}</div>
          <div style={{ color: C.mut, fontSize: '11px', marginTop: '6px', lineHeight: 1.55 }}>
            {sc >= 90 ? 'Sistema nervoso totalmente recuperado. Vai ao máximo.'
              : sc >= 75 ? 'Boa recuperação. Treino intenso autorizado.'
              : sc >= 55 ? 'Recuperação parcial. Ajusta a intensidade.'
              : 'Sono insuficiente. Evita alta intensidade.'}
          </div>
        </div>
      </div>

      {/* Countdown */}
      <div style={{ background: C.sur, borderRadius: '16px', border: `1px solid ${C.bdr}`, padding: '16px 18px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: C.mut, fontSize: '9px', letterSpacing: '3px', fontFamily: "'Space Mono',monospace" }}>PRÓXIMO RECOLHER</div>
          <div style={{ color: C.txt, fontSize: '15px', marginTop: '4px' }}>
            {p.bedtime} <span style={{ color: C.mut, fontSize: '12px' }}>({cdBed(p.bedtime)})</span>
          </div>
        </div>
        <span style={{ fontSize: '26px' }}>🌙</span>
      </div>

      {/* Metrics grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {[
          { ico: '🌙', lbl: 'SONO',    val: fmtD(dur) },
          { ico: '⏰', lbl: 'DEITAR',  val: p.bedtime },
          { ico: '☀️', lbl: 'ACORDAR', val: p.wakeTime },
          { ico: '⚽', lbl: 'TREINO',  val: p.trainTime },
        ].map(m => (
          <div key={m.lbl} style={{ background: C.sur, borderRadius: '14px', border: `1px solid ${C.bdr}`, padding: '14px' }}>
            <div style={{ fontSize: '18px', marginBottom: '6px' }}>{m.ico}</div>
            <div style={{ color: C.mut, fontSize: '9px', letterSpacing: '2px', fontFamily: "'Space Mono',monospace" }}>{m.lbl}</div>
            <div style={{ color: C.txt, fontSize: '18px', fontFamily: "'Bebas Neue',sans-serif", letterSpacing: '1px', marginTop: '3px' }}>{m.val}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Sleep Checklist ──────────────────────────────────────────── */
const CL_ITEMS = [
  { id: 'screens', ico: '📵', lbl: 'Ecrãs azuis desligados',     sub: '≥ 60 min antes de dormir' },
  { id: 'lights',  ico: '🔆', lbl: 'Luz reduzida',               sub: 'Ambiente escuro 1h antes' },
  { id: 'temp',    ico: '❄️', lbl: 'Temperatura ≤ 18 °C',       sub: 'Quarto frio acelera recuperação' },
  { id: 'dark',    ico: '🌑', lbl: 'Blackout completo',          sub: 'Zero luz no quarto' },
  { id: 'meal',    ico: '🍽️', lbl: 'Última refeição 2h+ antes',  sub: 'Digestão não compromete sono' },
  { id: 'caff',    ico: '☕', lbl: 'Sem cafeína após 14h',       sub: 'Meia-vida da cafeína: ~6h' },
  { id: 'stretch', ico: '🧘', lbl: 'Estiramento pré-sono',       sub: '5–10 min de mobilidade' },
  { id: 'hydro',   ico: '💧', lbl: 'Hidratação adequada',        sub: 'Sem líquidos 1h antes' },
]

function SleepTab({ p, cl, setCl }) {
  const sc   = calcR(p.bedtime, p.wakeTime)
  const info = getInfo(sc)
  const done = CL_ITEMS.filter(i => cl[i.id]).length

  return (
    <div style={{ padding: '22px 18px 16px', overflowY: 'auto', flex: 1 }}>
      <div style={{ color: C.mut, fontSize: '9px', letterSpacing: '3px', fontFamily: "'Space Mono',monospace", marginBottom: '4px' }}>PROTOCOLO DE SONO</div>
      <div style={{ color: C.txt, fontSize: '22px', fontFamily: "'Bebas Neue',sans-serif", letterSpacing: '2px', marginBottom: '18px' }}>CHECKLIST DE ELITE</div>

      {/* Progress bar */}
      <div style={{ background: C.sur, borderRadius: '14px', border: `1px solid ${C.bdr}`, padding: '14px 16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ color: C.mut, fontSize: '9px', letterSpacing: '2px', fontFamily: "'Space Mono',monospace" }}>PROTOCOLO NOTURNO</span>
          <span style={{ color: info.color, fontSize: '9px', fontFamily: "'Space Mono',monospace" }}>{done}/{CL_ITEMS.length} COMPLETOS</span>
        </div>
        <div style={{ background: C.dim, borderRadius: '3px', height: '5px', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: '3px', width: `${(done / CL_ITEMS.length) * 100}%`, background: `linear-gradient(90deg,${C.acc},${C.cyan})`, transition: 'width .5s ease' }} />
        </div>
      </div>

      {CL_ITEMS.map(item => (
        <div key={item.id} onClick={() => setCl({ ...cl, [item.id]: !cl[item.id] })}
          style={{ background: cl[item.id] ? 'rgba(0,255,136,.05)' : C.sur, borderRadius: '14px', border: `1px solid ${cl[item.id] ? 'rgba(0,255,136,.24)' : C.bdr}`, padding: '13px 15px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '13px', cursor: 'pointer', transition: 'all .2s' }}>
          <span style={{ fontSize: '20px' }}>{item.ico}</span>
          <div style={{ flex: 1 }}>
            <div style={{ color: cl[item.id] ? C.acc : C.txt, fontSize: '13px', fontWeight: '600', textDecoration: cl[item.id] ? 'line-through' : 'none', transition: 'all .2s' }}>{item.lbl}</div>
            <div style={{ color: C.mut, fontSize: '11px', marginTop: '2px' }}>{item.sub}</div>
          </div>
          <div style={{ width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, border: `2px solid ${cl[item.id] ? C.acc : C.dim}`, background: cl[item.id] ? C.acc : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s', boxShadow: cl[item.id] ? `0 0 10px rgba(0,255,136,.5)` : 'none' }}>
            {cl[item.id] && <span style={{ color: C.bg, fontSize: '11px', fontWeight: '800' }}>✓</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Training Tab ─────────────────────────────────────────────── */
function TrainingTab({ p }) {
  const sc   = calcR(p.bedtime, p.wakeTime)
  const info = getInfo(sc)
  const dur  = sleepMins(p.bedtime, p.wakeTime)
  const [wh, wm] = p.wakeTime.split(':').map(Number)
  const [th, tm] = p.trainTime.split(':').map(Number)
  const gap  = th * 60 + tm - (wh * 60 + wm)

  const acts = [
    { lbl: 'Sprints / Velocidade Máxima', min: 85, ico: '⚡' },
    { lbl: 'Duelos / Alta Intensidade',   min: 78, ico: '⚔️' },
    { lbl: 'Táctica / Volume Médio',      min: 62, ico: '📋' },
    { lbl: 'Técnica / Baixa Intensidade', min: 0,  ico: '⚽' },
  ]

  return (
    <div style={{ padding: '22px 18px 16px', overflowY: 'auto', flex: 1 }}>
      <div style={{ color: C.mut, fontSize: '9px', letterSpacing: '3px', fontFamily: "'Space Mono',monospace", marginBottom: '4px' }}>ANÁLISE DO SISTEMA NERVOSO</div>
      <div style={{ color: C.txt, fontSize: '22px', fontFamily: "'Bebas Neue',sans-serif", letterSpacing: '2px', marginBottom: '18px' }}>TREINO {p.trainTime}</div>

      <div style={{ background: C.sur, borderRadius: '20px', border: `1px solid ${info.color}30`, padding: '22px 18px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '18px', boxShadow: `0 0 40px ${info.glow}` }}>
        <Ring score={sc} color={info.color} sz={118} />
        <div>
          <div style={{ color: C.mut, fontSize: '9px', letterSpacing: '3px', fontFamily: "'Space Mono',monospace" }}>SNC SCORE</div>
          <div style={{ color: info.color, fontSize: '26px', fontFamily: "'Bebas Neue',sans-serif", letterSpacing: '2px' }}>{info.label}</div>
          <div style={{ color: C.mut, fontSize: '11px', marginTop: '6px' }}>Sono: {fmtD(dur)}</div>
          {gap > 0 && <div style={{ color: C.mut, fontSize: '11px' }}>Janela pré-treino: {fmtD(gap)}</div>}
        </div>
      </div>

      <div style={{ background: C.sur, borderRadius: '16px', border: `1px solid ${C.bdr}`, padding: '16px', marginBottom: '10px' }}>
        <div style={{ color: C.acc, fontSize: '9px', letterSpacing: '2px', fontFamily: "'Space Mono',monospace", marginBottom: '12px' }}>✓ AUTORIZADO HOJE</div>
        {acts.filter(a => sc >= a.min).map(a => (
          <div key={a.lbl} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '9px' }}>
            <span style={{ fontSize: '17px' }}>{a.ico}</span>
            <span style={{ color: C.txt, fontSize: '13px' }}>{a.lbl}</span>
          </div>
        ))}
        {acts.filter(a => sc >= a.min).length === 0 && <div style={{ color: C.mut, fontSize: '13px' }}>Repouso completo recomendado.</div>}
      </div>

      {acts.filter(a => sc < a.min).length > 0 && (
        <div style={{ background: C.sur, borderRadius: '16px', border: 'solid 1px rgba(239,68,68,.15)', padding: '16px' }}>
          <div style={{ color: C.red, fontSize: '9px', letterSpacing: '2px', fontFamily: "'Space Mono',monospace", marginBottom: '12px' }}>✕ NÃO RECOMENDADO</div>
          {acts.filter(a => sc < a.min).map(a => (
            <div key={a.lbl} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '9px', opacity: 0.5 }}>
              <span style={{ fontSize: '17px' }}>{a.ico}</span>
              <span style={{ color: C.mut, fontSize: '13px', textDecoration: 'line-through' }}>{a.lbl}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Naps Tab ─────────────────────────────────────────────────── */
const NAPS = [
  { id: 'power',    ico: '⚡', lbl: 'Power Nap',            dur: 20 * 60, desc: 'Alerta imediato, sem inércia' },
  { id: 'recovery', ico: '🔄', lbl: 'Sesta de Recuperação', dur: 90 * 60, desc: 'Ciclo completo, máxima recuperação' },
]

function NapsTab({ p }) {
  const [sel, setSel]      = useState(null)
  const [active, setActive] = useState(false)
  const [elapsed, setElap]  = useState(0)
  const ref = useRef(null)

  const [th, tm] = p.trainTime.split(':').map(Number)
  const wm2 = th * 60 + tm - 180
  const winStr = `${String(Math.floor(wm2 / 60)).padStart(2, '0')}:${String(wm2 % 60).padStart(2, '0')}`

  function start() { setActive(true); setElap(0); ref.current = setInterval(() => setElap(e => e + 1), 1000) }
  function stop()  { setActive(false); clearInterval(ref.current) }

  useEffect(() => { if (active && sel && elapsed >= sel.dur) stop() }, [elapsed, active, sel])
  useEffect(() => () => clearInterval(ref.current), [])

  const fmt  = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const prog = sel ? Math.min(1, elapsed / sel.dur) : 0
  const done = sel && elapsed >= sel.dur && !active

  return (
    <div style={{ padding: '22px 18px 16px', overflowY: 'auto', flex: 1 }}>
      <div style={{ color: C.mut, fontSize: '9px', letterSpacing: '3px', fontFamily: "'Space Mono',monospace", marginBottom: '4px' }}>RECUPERAÇÃO DIURNA</div>
      <div style={{ color: C.txt, fontSize: '22px', fontFamily: "'Bebas Neue',sans-serif", letterSpacing: '2px', marginBottom: '6px' }}>GESTÃO DE SESTAS</div>
      <div style={{ color: C.mut, fontSize: '12px', marginBottom: '20px' }}>
        Janela ideal: antes das <span style={{ color: C.cyan }}>{winStr}</span>
      </div>

      {!active && (
        <div style={{ marginBottom: '18px' }}>
          {NAPS.map(n => (
            <div key={n.id} onClick={() => setSel(n)}
              style={{ background: sel?.id === n.id ? 'rgba(0,207,255,.08)' : C.sur, borderRadius: '16px', border: `1px solid ${sel?.id === n.id ? C.cyan : C.bdr}`, padding: '16px', marginBottom: '10px', cursor: 'pointer', transition: 'all .2s', boxShadow: sel?.id === n.id ? `0 0 20px rgba(0,207,255,.12)` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
                <span style={{ fontSize: '24px' }}>{n.ico}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: sel?.id === n.id ? C.cyan : C.txt, fontSize: '14px', fontWeight: '600' }}>{n.lbl}</div>
                  <div style={{ color: C.mut, fontSize: '11px', marginTop: '2px' }}>{Math.floor(n.dur / 60)} min • {n.desc}</div>
                </div>
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${sel?.id === n.id ? C.cyan : C.dim}`, background: sel?.id === n.id ? C.cyan : 'transparent', transition: 'all .2s' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {sel && (
        <div style={{ background: C.sur, borderRadius: '20px', border: `1px solid ${C.bdr}`, padding: '26px 20px', textAlign: 'center', marginBottom: '16px' }}>
          {active && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ color: C.mut, fontSize: '9px', letterSpacing: '3px', fontFamily: "'Space Mono',monospace", marginBottom: '6px' }}>EM DESCANSO</div>
              <div style={{ fontSize: '46px', fontFamily: "'Space Mono',monospace", color: C.cyan, letterSpacing: '2px' }}>{fmt(elapsed)}</div>
              <div style={{ color: C.mut, fontSize: '11px', marginTop: '4px' }}>de {fmt(sel.dur)}</div>
              <div style={{ background: C.dim, borderRadius: '3px', height: '4px', marginTop: '14px', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '3px', width: `${prog * 100}%`, background: `linear-gradient(90deg,${C.acc},${C.cyan})`, transition: 'width 1s linear' }} />
              </div>
            </div>
          )}
          {done && (
            <div style={{ marginBottom: '20px', padding: '14px', background: 'rgba(0,255,136,.06)', borderRadius: '12px', border: `1px solid ${C.acc}30` }}>
              <div style={{ color: C.acc, fontSize: '20px', fontFamily: "'Bebas Neue',sans-serif", letterSpacing: '2px' }}>SESTA COMPLETA ✓</div>
              <div style={{ color: C.mut, fontSize: '11px', marginTop: '4px' }}>Tempo de activação: ~10 min</div>
            </div>
          )}
          <button onClick={active ? stop : start}
            style={{ padding: '13px 34px', background: active ? 'rgba(239,68,68,.1)' : C.acc, border: active ? `1px solid ${C.red}` : 'none', borderRadius: '12px', color: active ? C.red : C.bg, fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", boxShadow: active ? 'none' : `0 0 20px rgba(0,255,136,.4)` }}>
            {active ? '⏹ Terminar' : `▶ Iniciar ${sel.lbl}`}
          </button>
        </div>
      )}

      <div style={{ background: C.sur, borderRadius: '16px', border: `1px solid ${C.bdr}`, padding: '16px' }}>
        <div style={{ color: C.mut, fontSize: '9px', letterSpacing: '3px', fontFamily: "'Space Mono',monospace", marginBottom: '10px' }}>PROTOCOLO SNA</div>
        {['Ambiente escuro e silencioso', 'Alarme para não exceder o tempo definido', 'Cafeína pré-power nap (activa em 20 min)', 'Sem sestas após as 15h — compromete sono nocturno'].map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '8px', alignItems: 'flex-start' }}>
            <span style={{ color: C.acc, fontSize: '10px', fontFamily: "'Space Mono',monospace", marginTop: '2px', flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
            <span style={{ color: C.mut, fontSize: '12px' }}>{t}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Toggle ───────────────────────────────────────────────────── */
function Toggle({ val, onChange, col = C.acc }) {
  return (
    <div onClick={onChange} style={{ width: '46px', height: '25px', borderRadius: '13px', background: val ? col : C.dim, cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0, boxShadow: val ? `0 0 10px ${col}60` : 'none' }}>
      <div style={{ position: 'absolute', top: '2.5px', left: val ? '23px' : '2.5px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
    </div>
  )
}

/* ── Settings Tab ─────────────────────────────────────────────── */
function SettingsTab({ p, pwa, setPwa, onEdit, onReset }) {
  const [perm, setPerm] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  )
  const [deferredPrompt, setDeferredPrompt] = useState(
    // CORRIGIDO: lê o evento já capturado pelo listener global no index.html
    window.__deferredInstallPrompt || null
  )
  const [installed, setInstalled] = useState(
    window.matchMedia('(display-mode: standalone)').matches
  )

  // CORRIGIDO: useEffect único e sem duplicação de fechamento
  useEffect(() => {
    // Se o evento ainda não disparou, aguarda via custom event
    const onInstallable = () => {
      setDeferredPrompt(window.__deferredInstallPrompt || null)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferredPrompt(null)
      window.__deferredInstallPrompt = null
    }

    window.addEventListener('pwa-installable', onInstallable)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('pwa-installable', onInstallable)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function reqNotif() {
    if (typeof Notification === 'undefined') return
    const r = await Notification.requestPermission()
    setPerm(r)
    setPwa({ ...pwa, notifs: r === 'granted' })
  }

  async function installApp() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setDeferredPrompt(null)
    window.__deferredInstallPrompt = null
  }

  const rows = [
    { lbl: 'Notificações Push', sub: perm === 'granted' ? `Activas — "Hora de dormir craque" ✓` : 'Requer permissão do navegador', val: pwa.notifs && perm === 'granted', col: C.acc, fn: reqNotif },
    { lbl: 'Cache Offline Local', sub: pwa.cache ? 'Dados guardados localmente' : 'App funciona apenas online', val: pwa.cache, col: C.cyan, fn: () => setPwa({ ...pwa, cache: !pwa.cache }) },
  ]

  return (
    <div style={{ padding: '22px 18px 16px', overflowY: 'auto', flex: 1 }}>
      <div style={{ color: C.mut, fontSize: '9px', letterSpacing: '3px', fontFamily: "'Space Mono',monospace", marginBottom: '4px' }}>CONFIGURAÇÃO</div>
      <div style={{ color: C.txt, fontSize: '22px', fontFamily: "'Bebas Neue',sans-serif", letterSpacing: '2px', marginBottom: '20px' }}>DEFINIÇÕES PWA</div>

      {/* Profile */}
      <div style={{ background: C.sur, borderRadius: '16px', border: `1px solid ${C.bdr}`, padding: '16px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '13px' }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg,${C.acc},${C.cyan})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', fontFamily: "'Bebas Neue',sans-serif", color: C.bg }}>
          {p.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: C.txt, fontSize: '14px', fontWeight: '600' }}>{p.name}</div>
          <div style={{ color: C.mut, fontSize: '11px', marginTop: '2px' }}>{p.bedtime} → {p.wakeTime} • Treino: {p.trainTime}</div>
        </div>
        <button onClick={onEdit} style={{ background: C.card, border: `1px solid ${C.bdr}`, borderRadius: '8px', padding: '6px 10px', color: C.mut, fontSize: '10px', cursor: 'pointer', fontFamily: "'Space Mono',monospace", flexShrink: 0 }}>EDITAR</button>
      </div>

      {/* PWA Toggles */}
      <div style={{ background: C.sur, borderRadius: '16px', border: `1px solid ${C.bdr}`, overflow: 'hidden', marginBottom: '12px' }}>
        <div style={{ padding: '12px 16px 8px', borderBottom: `1px solid ${C.bdr}` }}>
          <div style={{ color: C.mut, fontSize: '9px', letterSpacing: '3px', fontFamily: "'Space Mono',monospace" }}>CAPACIDADES PWA</div>
        </div>
        {rows.map((row, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '13px', padding: '15px 16px', borderBottom: i < rows.length - 1 ? `1px solid ${C.bdr}` : 'none' }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: C.txt, fontSize: '13px', fontWeight: '600' }}>{row.lbl}</div>
              <div style={{ color: C.mut, fontSize: '11px', marginTop: '2px' }}>{row.sub}</div>
            </div>
            <Toggle val={row.val} onChange={row.fn} col={row.col} />
          </div>
        ))}
      </div>

      {/* Install */}
      <div style={{ background: C.sur, borderRadius: '16px', border: `1px solid ${C.bdr}`, padding: '16px', marginBottom: '12px' }}>
        <div style={{ color: C.mut, fontSize: '9px', letterSpacing: '3px', fontFamily: "'Space Mono',monospace", marginBottom: '10px' }}>INSTALAR APP</div>

        {deferredPrompt && !installed && (
          <button onClick={installApp} style={{ width: '100%', padding: '14px', background: `linear-gradient(135deg,${C.acc}22,${C.cyan}22)`, border: `1px solid ${C.acc}40`, borderRadius: '12px', color: C.acc, fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", marginBottom: '12px', boxShadow: `0 0 20px rgba(0,255,136,.2)` }}>
            📲 Instalar Elite Sleep no dispositivo
          </button>
        )}
        {installed && (
          <div style={{ color: C.acc, fontSize: '12px', fontFamily: "'Space Mono',monospace", marginBottom: '12px' }}>✓ APP INSTALADA</div>
        )}

        <div style={{ color: C.mut, fontSize: '12px', lineHeight: 1.6, marginBottom: '12px' }}>
          <strong style={{ color: C.txt }}>iOS:</strong> ⎙ Partilhar → Adicionar ao Ecrã de Início<br />
          <strong style={{ color: C.txt }}>Android:</strong> Menu Chrome → Adicionar ao ecrã inicial
        </div>
        <div style={{ background: C.card, borderRadius: '10px', border: `1px solid ${C.bdr}`, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>📲</span>
          <div style={{ flex: 1 }}>
            <div style={{ color: C.txt, fontSize: '12px', fontWeight: '600' }}>Elite Sleep Pro</div>
            <div style={{ color: C.mut, fontSize: '11px' }}>Funciona como app nativa</div>
          </div>
          <div style={{ color: C.acc, fontSize: '9px', fontFamily: "'Space Mono',monospace", padding: '4px 8px', border: `1px solid ${C.acc}40`, borderRadius: '6px' }}>PWA</div>
        </div>
      </div>

      <button
        onClick={() => { if (window.confirm('Apagar todos os dados e recomeçar?')) onReset() }}
        style={{ width: '100%', padding: '14px', background: 'rgba(239,68,68,.06)', border: 'solid 1px rgba(239,68,68,.18)', borderRadius: '12px', color: C.red, fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
        Repor Dados do Atleta
      </button>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   ROOT APP
══════════════════════════════════════════════════════════════ */
export default function App() {
  const [profile, setProfile] = useState(null)
  const [tab,     setTab]     = useState(window.__initialTab ?? 0)
  const [toast,   setToast]   = useState(null)
  const [cl,      setCl]      = useState({})
  const [pwa,     setPwa]     = useState({ notifs: false, cache: false })
  const [editing, setEditing] = useState(false)
  const [ready,   setReady]   = useState(false)

  // ── Load from localStorage ───────────────────────────────────
  useEffect(() => {
    const p  = sGet('profile')
    const c  = sGet('checklist')
    const pw = sGet('pwa')
    if (p)  setProfile(p)
    if (c)  setCl(c)
    if (pw) setPwa(pw)
    setReady(true)
  }, [])

  // ── Persist ─────────────────────────────────────────────────
  useEffect(() => { if (ready && profile) sSet('profile', profile) },  [profile, ready])
  useEffect(() => { if (ready) sSet('checklist', cl) },                [cl, ready])
  useEffect(() => { if (ready) sSet('pwa', pwa) },                     [pwa, ready])

  // ── Bedtime notification ────────────────────────────────────
  useEffect(() => {
    if (!profile) return
    const chk = () => {
      const now = new Date()
      const t = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      if (t === profile.bedtime) {
        setToast('Hora de dormir craque')
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('🌙 Hora de dormir craque', { body: 'Recuperação começa agora.' })
        }
        setTimeout(() => setToast(null), 12000)
      }
    }
    chk()
    const iv = setInterval(chk, 30000)
    return () => clearInterval(iv)
  }, [profile])

  // ── Loading ─────────────────────────────────────────────────
  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: C.acc, fontFamily: "'Space Mono',monospace", fontSize: '11px', letterSpacing: '3px', animation: 'pulse 1.5s ease infinite' }}>A CARREGAR...</div>
      </div>
    )
  }

  // ── Onboarding ──────────────────────────────────────────────
  if (!profile || editing) {
    return (
      <Onboarding onSave={form => { setProfile(form); setEditing(false); setTab(0) }} />
    )
  }

  // ── Tab config ──────────────────────────────────────────────
  const TABS = [
    { ico: '⚡', lbl: 'PAINEL'        },
    { ico: '🌙', lbl: profile.bedtime  },
    { ico: '⚽', lbl: profile.trainTime },
    { ico: '💤', lbl: 'SESTAS'        },
    { ico: '⚙️', lbl: 'WPA'           },
  ]

  return (
    <>
      <style>{`
        @keyframes slideDown { from { transform:translateY(-100%); opacity:0 } to { transform:translateY(0); opacity:1 } }
        @keyframes pulse     { 0%,100% { opacity:1 } 50% { opacity:.4 } }
        input[type="time"]::-webkit-calendar-picker-indicator { filter:invert(1) opacity(.35); cursor:pointer; }
        input::placeholder { color:#3a3a54; }
      `}</style>

      <div style={{ background: C.bg, height: '100vh', maxWidth: '430px', margin: '0 auto', display: 'flex', flexDirection: 'column', fontFamily: "'DM Sans',sans-serif", position: 'relative', overflow: 'hidden' }}>
        {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', paddingBottom: '66px' }}>
          {tab === 0 && <Dashboard    p={profile} />}
          {tab === 1 && <SleepTab     p={profile} cl={cl} setCl={setCl} />}
          {tab === 2 && <TrainingTab  p={profile} />}
          {tab === 3 && <NapsTab      p={profile} />}
          {tab === 4 && (
            <SettingsTab
              p={profile} pwa={pwa} setPwa={setPwa}
              onEdit={() => setEditing(true)}
              onReset={() => { sDelAll(); setProfile(null); setCl({}); setPwa({ notifs: false, cache: false }) }}
            />
          )}
        </div>

        {/* Bottom Nav */}
        <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '430px', background: `${C.sur}f0`, borderTop: `1px solid ${C.bdr}`, backdropFilter: 'blur(12px)', display: 'flex', zIndex: 100 }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)}
              style={{ flex: 1, padding: '9px 2px 10px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', position: 'relative' }}>
              {tab === i && (
                <div style={{ position: 'absolute', top: 0, left: '18%', right: '18%', height: '2px', background: C.acc, borderRadius: '0 0 2px 2px', boxShadow: `0 0 8px ${C.acc}` }} />
              )}
              <span style={{ fontSize: '16px', lineHeight: 1 }}>{t.ico}</span>
              <span style={{ fontSize: '8.5px', letterSpacing: '.3px', fontFamily: "'Space Mono',monospace", color: tab === i ? C.acc : C.mut, transition: 'color .2s', whiteSpace: 'nowrap' }}>{t.lbl}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
