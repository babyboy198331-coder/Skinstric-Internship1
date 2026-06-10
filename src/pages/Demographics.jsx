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
    <div className="demo-page" style={{
      position: 'relative', width: '100vw', height: '100vh',
      background: '#FCFCFC', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      <Navbar showEnterCode={false} section="ANALYSIS" />

      {/* Headings */}
      <div style={{ padding: '80px 32px 0', flexShrink: 0 }}>
        <p style={{ fontSize: '16px', fontWeight: '600', letterSpacing: '-0.02em', textTransform: 'uppercase', color: '#1A1B1C' }}>
          A.I. ANALYSIS
        </p>
        <h1 style={{
          fontSize: 'clamp(48px, 4vw, 72px)', fontWeight: '400',
          letterSpacing: '-0.04em', lineHeight: '1.05', color: '#1A1B1C', margin: '6px 0 4px',
        }}>
          DEMOGRAPHICS
        </h1>
        <p style={{ fontSize: '14px', textTransform: 'uppercase', color: '#1A1B1C' }}>
          PREDICTED RACE &amp; AGE
        </p>
      </div>

      {/* Three-column body */}
      <div className="demo-body" style={{
        flex: 1, display: 'flex', gap: '16px',
        padding: '28px 32px 80px', minHeight: 0, alignItems: 'stretch',
      }}>
        {/* Left: category blocks (short, stacked at top) */}
        <div className="demo-left" style={{ width: '204px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {CATEGORIES.map(({ key, label }) => {
            const isActive = key === active
            return (
              <CategoryBlock
                key={key}
                value={titleCase(selected[key])}
                label={label}
                active={isActive}
                onClick={() => setActive(key)}
              />
            )
          })}
        </div>

        {/* Middle: main panel with confidence circle */}
        <div className="demo-main" style={{
          flex: 1, background: '#F3F3F4', borderTop: '1px solid #1A1B1C',
          position: 'relative', padding: '20px 24px', minWidth: 0,
        }}>
          <p style={{
            fontSize: 'clamp(28px, 2.2vw, 40px)', fontWeight: '400',
            letterSpacing: '-0.02em', color: '#1A1B1C',
          }}>
            {titleCase(activeKey)}{active === 'age' ? ' y.o.' : ''}
          </p>

          <ConfidenceCircle pct={pct} />
        </div>

        {/* Right: confidence list */}
        <div className="demo-right" style={{
          width: 'clamp(300px, 23vw, 446px)', flexShrink: 0,
          background: '#F3F3F4', borderTop: '1px solid #1A1B1C',
          display: 'flex', flexDirection: 'column', minHeight: 0,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '18px 20px 12px', flexShrink: 0,
          }}>
            <span style={listHeader}>{CATEGORIES.find(c => c.key === active).label}</span>
            <span style={listHeader}>A.I. CONFIDENCE</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {entries.map(([key, score]) => (
              <ConfidenceRow
                key={key}
                label={titleCase(key)}
                pct={(score * 100).toFixed(2)}
                selected={key === activeKey}
                onClick={() => handleRowClick(key)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar: BACK | note | RESET + CONFIRM */}
      <div onClick={() => navigate('/select')} style={{ ...cornerBtn, left: '32px' }}>
        <DiamondArrow direction="left" />
        <span style={btnLabel}>BACK</span>
      </div>

      <p style={{
        position: 'absolute', bottom: '46px', left: '50%', transform: 'translateX(-50%)',
        fontSize: '14px', color: 'rgba(26,27,28,0.6)', zIndex: 20,
      }}>
        If A.I. estimate is wrong, select the correct one.
      </p>

      <div style={{
        position: 'absolute', bottom: '38px', right: '32px',
        display: 'flex', gap: '10px', zIndex: 20,
      }}>
        <button onClick={handleReset} style={actionBtn}>RESET</button>
        <button onClick={handleConfirm} style={{ ...actionBtn, background: '#1A1B1C', color: '#FCFCFC', border: '1px solid #1A1B1C' }}>
          CONFIRM
        </button>
      </div>
    </div>
  )
}

/* ── Left category block: value top, label bottom ── */
function CategoryBlock({ value, label, active, onClick }) {
  const [hovered, setHovered] = useState(false)
  const bg = active ? '#1A1B1C' : hovered ? '#E1E1E2' : '#F3F3F4'
  const fg = active ? '#FCFCFC' : '#1A1B1C'
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        height: '104px', flexShrink: 0, cursor: 'pointer', padding: '12px 14px',
        background: bg, borderTop: '1px solid #1A1B1C',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        transition: 'background 0.15s ease',
      }}
    >
      <p style={{ fontSize: '14px', fontWeight: '600', letterSpacing: '-0.01em', textTransform: 'uppercase', color: fg }}>
        {value}
      </p>
      <p style={{ fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', color: fg }}>
        {label}
      </p>
    </div>
  )
}

/* ── Thin-ring confidence circle, bottom-right of panel ── */
function ConfidenceCircle({ pct }) {
  const R = 191
  const STROKE = 2
  const C = 2 * Math.PI * R
  const size = (R + STROKE) * 2

  return (
    <div className="demo-circle" style={{
      position: 'absolute', right: '20px', bottom: '20px',
      width: 'min(384px, 42vh)', height: 'min(384px, 42vh)',
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
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 0.4s ease' }}
        />
        <text
          x="50%" y="52%" dominantBaseline="central" textAnchor="middle"
          style={{ fill: '#1A1B1C' }}
        >
          <tspan style={{ fontSize: '56px', fontWeight: '400', letterSpacing: '-0.02em' }}>{pct}</tspan>
          <tspan dy="-18" style={{ fontSize: '22px', fontWeight: '400' }}>%</tspan>
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
      <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <DiamondRadio selected={selected} />
        <span style={{ fontSize: '14px', fontWeight: '400', color: selected ? '#FCFCFC' : '#1A1B1C' }}>
          {label}
        </span>
      </span>
      <span style={{ fontSize: '14px', color: selected ? '#FCFCFC' : '#1A1B1C' }}>
        {pct}&nbsp;%
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
      width: '34px', height: '34px', border: '1px solid #1A1B1C',
      transform: 'rotate(45deg)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexShrink: 0,
    }}>
      <span style={{ transform: 'rotate(-45deg)', fontSize: '9px', lineHeight: 1, color: '#1A1B1C' }}>
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
  position: 'absolute', bottom: '38px',
  display: 'flex', alignItems: 'center', gap: '14px',
  cursor: 'pointer', zIndex: 20, userSelect: 'none',
}

const btnLabel = {
  fontSize: '14px', fontWeight: '600', letterSpacing: '-0.02em',
  textTransform: 'uppercase', color: '#1A1B1C',
}

const actionBtn = {
  background: '#FCFCFC', border: '1px solid #1A1B1C',
  color: '#1A1B1C', cursor: 'pointer',
  padding: '10px 18px', fontSize: '12px', fontWeight: '600',
  letterSpacing: '0.02em', textTransform: 'uppercase', fontFamily: 'inherit',
}
