import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

const API_URL = import.meta.env.VITE_API_PHASE_ONE
  || 'https://us-central1-api-skinstric-ai.cloudfunctions.net/skinstricPhaseOne'

const isValidString = (val) => /^[a-zA-Z\s'-.]+$/.test(val.trim()) && val.trim().length > 0

const STEPS = [
  { field: 'name',     label: 'INTRODUCE YOURSELF',  placeholder: 'Introduce Yourself' },
  { field: 'location', label: 'WHERE ARE YOU FROM?', placeholder: 'Where are you from?' },
]

export default function Testing() {
  const navigate = useNavigate()
  const [step, setStep]           = useState(0)
  const [values, setValues]       = useState({ name: '', location: '' })
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [dialog, setDialog]       = useState(null) // null | 'confirm' | 'bye'
  const inputRef = useRef(null)

  const { field, label, placeholder } = STEPS[step]
  const value    = values[field]
  const hasText  = value.trim().length > 0

  const validate = (val) => {
    if (!val.trim()) return `Please enter your ${field}.`
    if (!isValidString(val)) return `${field === 'name' ? 'Name' : 'Location'} must only contain letters.`
    return ''
  }

  const handleProceed = async () => {
    if (submitted) { navigate('/upload'); return }

    const err = validate(value)
    if (err) { setError(err); return }
    setError('')

    if (step === 0) { setStep(1); return }

    const nameVal = values.name.trim()
    const locVal  = values.location.trim()

    setLoading(true)
    try {
      const res  = await fetch(API_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: nameVal, location: locVal }),
      })
      const data = await res.json()
      console.log('API response:', data)
      localStorage.setItem('skinstric_name',     nameVal)
      localStorage.setItem('skinstric_location', locVal)
      setSubmitted(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (submitted) { setSubmitted(false); setStep(1); return }
    if (step === 1) { setStep(0); setError(''); return }
    setDialog('confirm')
  }

  // 'SAD TO SEE YOU GO' shows briefly, then leaves — unless they change their mind
  const byeTimer = useRef(null)
  const handleLeave = () => {
    setDialog('bye')
    byeTimer.current = setTimeout(() => navigate('/'), 2000)
  }
  const handleChangedMind = () => {
    clearTimeout(byeTimer.current)
    setDialog(null)
  }
  useEffect(() => () => clearTimeout(byeTimer.current), [])

  const handleChange = (e) => {
    setValues(prev => ({ ...prev, [field]: e.target.value }))
    if (error) setError('')
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#FCFCFC', overflow: 'hidden' }}>
      <Navbar showEnterCode={false} />

      {/* Top-left heading */}
      <p style={{
        position: 'absolute', top: '86px', left: '32px',
        fontSize: '16px', fontWeight: '600', letterSpacing: '-0.02em',
        lineHeight: '24px', textTransform: 'uppercase', color: '#1A1B1C', zIndex: 5,
        fontFamily: "'Roobert TRIAL', 'DM Sans', sans-serif",
      }}>
        TO START ANALYSIS
      </p>

      <RotatingDiamonds />

      {/* Centre content */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 10,
      }}>
        {loading ? (
          <p className="loading-dots" style={{ fontSize: '14px', letterSpacing: '0.05em', color: '#1a1a1a', textTransform: 'uppercase' }}>
            Processing submission
          </p>
        ) : submitted ? (
          <>
            <p style={smallLabel}>THANK YOU!</p>
            <h2 style={{ fontSize: '60px', fontWeight: '400', letterSpacing: '-0.07em', lineHeight: '64px', color: '#1A1B1C', fontFamily: "'Roobert TRIAL', 'DM Sans', sans-serif" }}>
              Proceed for the next step
            </h2>
          </>
        ) : (
          <>
            <p style={smallLabel}>{hasText ? label : 'CLICK TO TYPE'}</p>
            <AutoSizeInput
              ref={inputRef}
              value={value}
              placeholder={placeholder}
              onChange={handleChange}
              onEnter={handleProceed}
            />
            {error && (
              <p style={{ fontSize: '13px', color: '#c0392b', marginTop: '12px', letterSpacing: '0.02em' }}>
                {error}
              </p>
            )}
          </>
        )}
      </div>

      {/* Back — bottom left */}
      <div onClick={handleBack} style={{ ...cornerBtn, left: '32px' }}>
        <DiamondArrow direction="left" />
        <span style={btnLabel}>BACK</span>
      </div>

      {/* Proceed — bottom right, only once there's input (or on success screen) */}
      {(hasText || submitted) && !loading && (
        <div onClick={handleProceed} style={{ ...cornerBtn, right: '32px' }}>
          <span style={btnLabel}>PROCEED</span>
          <DiamondArrow direction="right" />
        </div>
      )}

      {/* Leave-analysis dialogs */}
      {dialog === 'confirm' && (
        <Dialog text={'YOU ARE ABOUT TO LEAVE ANALYSIS.\nARE YOU SURE?'}>
          <button onClick={() => navigate('/')} style={dialogBtn}>LEAVE</button>
          <button onClick={() => setDialog(null)} style={{ ...dialogBtn, fontWeight: '700' }}>STAY</button>
        </Dialog>
      )}
      {dialog === 'bye' && (
        <Dialog text="SAD TO SEE YOU GO">
          <button onClick={handleChangedMind} style={dialogBtn}>CHANGED MY MIND</button>
          <span className="loading-dots" style={{ ...dialogBtn, cursor: 'default' }} />
        </Dialog>
      )}
    </div>
  )
}

/* ── Auto-sizing underlined input ── */
function AutoSizeInput({ value, placeholder, onChange, onEnter, ref }) {
  const measureRef = useRef(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    if (measureRef.current) setWidth(measureRef.current.offsetWidth + 4)
  }, [value, placeholder])

  const textStyle = {
    fontSize: 'clamp(36px, 3.125vw, 60px)',
    fontWeight: '400',
    letterSpacing: '-0.07em',
    lineHeight: '1.0667',
    fontFamily: "'Roobert TRIAL', 'DM Sans', sans-serif",
    color: '#1A1B1C',
  }

  return (
    <>
      {/* hidden measurer */}
      <span ref={measureRef} style={{ ...textStyle, position: 'absolute', visibility: 'hidden', whiteSpace: 'pre' }}>
        {value || placeholder}
      </span>
      <input
        ref={ref}
        autoFocus
        type="text"
        value={value}
        onChange={onChange}
        onKeyDown={(e) => e.key === 'Enter' && onEnter()}
        placeholder={placeholder}
        style={{
          ...textStyle,
          width: width ? `${width}px` : 'auto',
          maxWidth: '80vw',
          background: 'transparent',
          border: 'none',
          borderBottom: '1px solid #1a1a1a',
          outline: 'none',
          textAlign: 'center',
          color: '#1a1a1a',
          padding: '0 0 4px',
          caretColor: '#1a1a1a',
        }}
      />
    </>
  )
}

/* ── Dark confirmation dialog (top-left, below navbar) ── */
function Dialog({ text, children }) {
  return (
    <div style={{
      position: 'absolute', top: '64px', left: '32px',
      width: '420px', maxWidth: 'calc(100vw - 64px)', background: '#1a1a1a', zIndex: 50,
    }}>
      <p style={{
        color: '#fcfcfc', fontSize: '14px', fontWeight: '600',
        textTransform: 'uppercase', lineHeight: '1.6',
        padding: '16px 20px 28px', whiteSpace: 'pre-line', letterSpacing: '0.02em',
      }}>
        {text}
      </p>
      <div style={{
        borderTop: '1px solid rgba(252,252,252,0.4)',
        display: 'flex', justifyContent: 'flex-end', gap: '28px',
        padding: '10px 20px',
      }}>
        {children}
      </div>
    </div>
  )
}

const dialogBtn = {
  background: 'transparent', border: 'none', cursor: 'pointer',
  color: '#FCFCFC', fontSize: '12px', fontWeight: '600',
  letterSpacing: '-0.02em', textTransform: 'uppercase',
  fontFamily: "'Roobert TRIAL', 'DM Sans', sans-serif", padding: 0,
}

/* ── Corner buttons ── */
const cornerBtn = {
  position: 'absolute', bottom: '36px',
  display: 'flex', alignItems: 'center', gap: '16px',
  cursor: 'pointer', zIndex: 20, userSelect: 'none',
}

const btnLabel = {
  fontSize: '14px', fontWeight: '600', letterSpacing: '-0.02em',
  lineHeight: '16px', textTransform: 'uppercase', color: '#1A1B1C',
  opacity: 0.7, fontFamily: "'Roobert TRIAL', 'DM Sans', sans-serif",
}

const smallLabel = {
  fontSize: '14px', fontWeight: '400', letterSpacing: '0', lineHeight: '24px',
  color: 'rgba(26,27,28,0.4)', textTransform: 'uppercase', marginBottom: '8px',
  fontFamily: "'Roobert TRIAL', 'DM Sans', sans-serif",
}

function DiamondArrow({ direction }) {
  /* Polygon points from Figma: left 35.71%, right 42.86%, top/bottom 37.63% of 44px */
  const points = direction === 'left'
    ? '15.71,22 25.14,16.56 25.14,27.44'
    : '28.29,22 18.86,16.56 18.86,27.44'
  return (
    <div style={{
      width: '44px', height: '44px',
      border: '1px solid #1A1B1C',
      transform: 'rotate(45deg)',
      position: 'relative', flexShrink: 0,
    }}>
      <svg width="44" height="44" viewBox="0 0 44 44"
        style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-45deg)' }}>
        <polygon points={points} fill="#1A1B1C" />
      </svg>
    </div>
  )
}

/* ── Three nested rotating dashed diamonds ── */
function RotatingDiamonds() {
  const base = {
    position: 'absolute',
    top: '50%', left: '50%',
    pointerEvents: 'none',
    border: '2px dashed #A0A4AB',
  }
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 1, overflow: 'hidden' }}>
      <div className="diamond-outer" style={{ ...base, width: 'min(762px, 70.6vh)', height: 'min(762px, 70.6vh)', opacity: 0.3 }} />
      <div className="diamond-mid"   style={{ ...base, width: 'min(682px, 63.1vh)', height: 'min(682px, 63.1vh)', opacity: 0.6 }} />
      <div className="diamond-inner" style={{ ...base, width: 'min(602px, 55.7vh)', height: 'min(602px, 55.7vh)', opacity: 1   }} />
    </div>
  )
}
