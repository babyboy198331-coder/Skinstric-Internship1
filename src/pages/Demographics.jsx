import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'

function sortDesc(obj) {
  return Object.entries(obj).sort((a, b) => b[1] - a[1])
}

function titleCase(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase())
}

const CATEGORIES = [
  { key: 'race',   label: 'RACE' },
  { key: 'age',    label: 'AGE'  },
  { key: 'gender', label: 'SEX'  },
]

export default function Demographics() {
  const navigate = useNavigate()
  const { state } = useLocation()

  // Data: route state first, then localStorage (so /select → here works on refresh)
  const data = useMemo(() => {
    if (state?.data) return state.data
    try { return JSON.parse(localStorage.getItem('skinstric_demographics')) } catch { return null }
  }, [state])

  useEffect(() => {
    if (!data) navigate('/upload', { replace: true })
  }, [data, navigate])

  const sorted = useMemo(() => data ? ({
    race:   sortDesc(data.race),
    age:    sortDesc(data.age),
    gender: sortDesc(data.gender),
  }) : null, [data])

  const aiPicks = useMemo(() => sorted ? ({
    race:   sorted.race[0]?.[0]   || '',
    age:    sorted.age[0]?.[0]    || '',
    gender: sorted.gender[0]?.[0] || '',
  }) : null, [sorted])
  const [active, setActive] = useState('race')

  // Initialise from previously saved corrections (if they match this analysis), else AI picks
  const [selected, setSelected] = useState(() => {
    if (!aiPicks || !data) return null
    let saved
    try { saved = JSON.parse(localStorage.getItem('skinstric_demographics_selected')) } catch { saved = null }
    const valid = saved
      && data.race[saved.race]     !== undefined
      && data.age[saved.age]       !== undefined
      && data.gender[saved.gender] !== undefined
    return valid ? saved : aiPicks
  })

  // Persist every change so corrections survive navigation and refresh
  useEffect(() => {
    if (selected) localStorage.setItem('skinstric_demographics_selected', JSON.stringify(selected))
  }, [selected])
  if (!data || !sorted || !selected) return null

  const entries     = sorted[active]
  const activeKey   = selected[active]
  const activeScore = Object.fromEntries(entries)[activeKey] ?? 0
  const pct         = Math.round(activeScore * 100)

  const handleRowClick = (key) => {
    setSelected(prev => ({ ...prev, [active]: key }))
  }

  const handleReset = () => setSelected(aiPicks)

  const handleConfirm = () => {
    localStorage.setItem('skinstric_demographics_confirmed', JSON.stringify(selected))
    navigate('/select')
  }

  return (
    <div style={{
      position: 'relative', width: '100vw', height: '100vh',
      background: '#FCFCFC', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      <Navbar showEnterCode={false} />

      {/* Headings */}
      <div style={{ padding: '86px 32px 0', flexShrink: 0 }}>
        <p style={{ fontSize: '16px', fontWeight: '600', letterSpacing: '-0.02em', textTransform: 'uppercase', color: '#1A1B1C' }}>
          A.I. ANALYSIS
        </p>
        <h1 style={{
          fontSize: 'clamp(48px, 5vw, 72px)', fontWeight: '300',
          letterSpacing: '-0.05em', lineHeight: '1.1', color: '#1A1B1C', margin: '4px 0 2px',
        }}>
          DEMOGRAPHICS
        </h1>
        <p style={{ fontSize: '14px', textTransform: 'uppercase', color: '#1A1B1C' }}>
          PREDICTED RACE &amp; AGE
        </p>
      </div>

      {/* Three-column body */}
      <div style={{
        flex: 1, display: 'flex', gap: '10px',
        padding: '24px 32px 90px', minHeight: 0,
      }}>
        {/* Left: category blocks */}
        <div style={{ width: '196px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {CATEGORIES.map(({ key, label }) => {
            const isActive = key === active
            return (
              <div
                key={key}
                onClick={() => setActive(key)}
                style={{
                  flex: 1, cursor: 'pointer', padding: '12px 14px',
                  background: isActive ? '#1A1B1C' : '#F3F3F4',
                  borderTop: `1px solid ${isActive ? '#1A1B1C' : 'rgba(26,27,28,0.6)'}`,
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  transition: 'background 0.15s ease',
                }}
              >
                <p style={{
                  fontSize: '14px', fontWeight: '600', letterSpacing: '-0.01em',
                  color: isActive ? '#FCFCFC' : '#1A1B1C',
                }}>
                  {titleCase(selected[key])}
                </p>
                <p style={{
                  fontSize: '14px', fontWeight: '600',
                  color: isActive ? '#FCFCFC' : '#1A1B1C',
                }}>
                  {label}
                </p>
              </div>
            )
          })}
        </div>

        {/* Middle: main panel with donut */}
        <div style={{
          flex: 1, background: '#F3F3F4', borderTop: '1px solid rgba(26,27,28,0.6)',
          position: 'relative', padding: '20px 24px', minWidth: 0,
        }}>
          <p style={{
            fontSize: 'clamp(24px, 2.2vw, 40px)', fontWeight: '400',
            letterSpacing: '-0.02em', color: '#1A1B1C',
          }}>
            {titleCase(activeKey)}{active === 'age' ? ' y.o.' : ''}
          </p>

          <ConfidenceDonut pct={pct} />

          <p style={{
            position: 'absolute', bottom: '16px', left: '24px', right: '24px',
            fontSize: '12px', color: 'rgba(26,27,28,0.5)', textAlign: 'center',
          }}>
            If A.I. estimate is wrong, select the correct one.
          </p>
        </div>

        {/* Right: confidence list */}
        <div style={{
          width: '380px', flexShrink: 0,
          background: '#F3F3F4', borderTop: '1px solid rgba(26,27,28,0.6)',
          display: 'flex', flexDirection: 'column', minHeight: 0,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '16px 20px', flexShrink: 0,
          }}>
            <span style={listHeader}>{CATEGORIES.find(c => c.key === active).label}</span>
            <span style={listHeader}>A.I. CONFIDENCE</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {entries.map(([key, score]) => {
              const isSel = key === activeKey
              return (
                <ConfidenceRow
                  key={key}
                  label={titleCase(key)}
                  pct={(score * 100).toFixed(2)}
                  selected={isSel}
                  onClick={() => handleRowClick(key)}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div onClick={() => navigate('/select')} style={{ ...cornerBtn, left: '32px' }}>
        <DiamondArrow direction="left" />
        <span style={btnLabel}>BACK</span>
      </div>

      <div style={{
        position: 'absolute', bottom: '36px', right: '32px',
        display: 'flex', gap: '14px', zIndex: 20,
      }}>
        <button onClick={handleReset} style={actionBtn}>RESET</button>
        <button onClick={handleConfirm} style={{ ...actionBtn, background: '#1A1B1C', color: '#FCFCFC' }}>
          CONFIRM
        </button>
      </div>
    </div>
  )
}

/* ── SVG donut progress ── */
function ConfidenceDonut({ pct }) {
  const R = 150
  const STROKE = 4
  const C = 2 * Math.PI * R
  const size = (R + STROKE) * 2

  return (
    <div style={{
      position: 'absolute', right: '24px', bottom: '48px',
      width: 'min(340px, 38vh)', height: 'min(340px, 38vh)',
    }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', height: '100%' }}>
        <circle
          cx={size / 2} cy={size / 2} r={R}
          fill="none" stroke="rgba(26,27,28,0.1)" strokeWidth={STROKE}
        />
        <circle
          cx={size / 2} cy={size / 2} r={R}
          fill="none" stroke="#1A1B1C" strokeWidth={STROKE}
          strokeDasharray={`${(pct / 100) * C} ${C}`}
          strokeLinecap="butt"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 0.4s ease' }}
        />
        <text
          x="50%" y="50%" dominantBaseline="central" textAnchor="middle"
          style={{ fontSize: '64px', fontWeight: '300', letterSpacing: '-0.02em', fill: '#1A1B1C' }}
        >
          {pct}<tspan style={{ fontSize: '28px' }}>%</tspan>
        </text>
      </svg>
    </div>
  )
}

function ConfidenceRow({ label, pct, selected, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px', cursor: 'pointer',
        background: selected ? '#1A1B1C' : hovered ? '#E1E1E2' : 'transparent',
        transition: 'background 0.12s ease',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <DiamondRadio selected={selected} />
        <span style={{
          fontSize: '14px', fontWeight: '400',
          color: selected ? '#FCFCFC' : '#1A1B1C',
        }}>
          {label}
        </span>
      </span>
      <span style={{ fontSize: '14px', color: selected ? '#FCFCFC' : '#1A1B1C' }}>
        {pct}%
      </span>
    </div>
  )
}

function DiamondRadio({ selected }) {
  const color = selected ? '#FCFCFC' : '#1A1B1C'
  return (
    <span style={{
      width: '11px', height: '11px', flexShrink: 0,
      border: `1px solid ${color}`,
      transform: 'rotate(45deg)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {selected && <span style={{ width: '5px', height: '5px', background: color }} />}
    </span>
  )
}

function DiamondArrow({ direction }) {
  return (
    <div style={{
      width: '44px', height: '44px', border: '1px solid #1A1B1C',
      transform: 'rotate(45deg)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexShrink: 0,
    }}>
      <span style={{ transform: 'rotate(-45deg)', fontSize: '10px', lineHeight: 1, color: '#1A1B1C' }}>
        {direction === 'left' ? '◀' : '▶'}
      </span>
    </div>
  )
}

const listHeader = {
  fontSize: '13px', fontWeight: '600', letterSpacing: '0',
  textTransform: 'uppercase', color: '#1A1B1C',
}

const cornerBtn = {
  position: 'absolute', bottom: '36px',
  display: 'flex', alignItems: 'center', gap: '16px',
  cursor: 'pointer', zIndex: 20, userSelect: 'none',
}

const btnLabel = {
  fontSize: '14px', fontWeight: '600', letterSpacing: '-0.02em',
  textTransform: 'uppercase', color: '#1A1B1C', opacity: 0.85,
}

const actionBtn = {
  background: 'transparent', border: '1px solid #1A1B1C',
  color: '#1A1B1C', cursor: 'pointer',
  padding: '10px 22px', fontSize: '13px', fontWeight: '600',
  letterSpacing: '0.02em', textTransform: 'uppercase', fontFamily: 'inherit',
}
