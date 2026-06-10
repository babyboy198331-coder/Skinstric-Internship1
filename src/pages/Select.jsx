import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

const OPTIONS = [
  { key: 'demographics', label: 'DEMOGRAPHICS',       pos: 'top',    enabled: true  },
  { key: 'skintype',     label: 'SKIN TYPE DETAILS',  pos: 'left',   enabled: false },
  { key: 'cosmetic',     label: 'COSMETIC CONCERNS',  pos: 'right',  enabled: false },
  { key: 'weather',      label: 'WEATHER',            pos: 'bottom', enabled: false },
]

export default function Select() {
  const navigate = useNavigate()

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#FCFCFC', overflow: 'hidden' }}>
      <Navbar showEnterCode={false} section="ANALYSIS" />

      {/* Top-left headings */}
      <div style={{ position: 'absolute', top: '86px', left: '32px', zIndex: 5 }}>
        <p style={{
          fontSize: '16px', fontWeight: '600', letterSpacing: '-0.02em',
          textTransform: 'uppercase', color: '#1A1B1C',
        }}>
          A.I. ANALYSIS
        </p>
        <p style={{
          fontSize: '14px', fontWeight: '400', lineHeight: '1.7',
          textTransform: 'uppercase', color: '#1A1B1C', marginTop: '12px',
        }}>
          A.I. HAS ESTIMATED THE FOLLOWING.<br />
          FIX ESTIMATED INFORMATION IF NEEDED.
        </p>
      </div>

      {/* Diamond grid */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%) rotate(45deg)',
        width: 'min(440px, 80vw, 46vh)', height: 'min(440px, 80vw, 46vh)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: '10px',
        zIndex: 10,
      }}>
        {/* grid order (after 45° rotation): TL=top, TR=right, BL=left, BR=bottom */}
        <DiamondTile option={OPTIONS.find(o => o.pos === 'top')}    onClick={() => navigate('/demographics')} />
        <DiamondTile option={OPTIONS.find(o => o.pos === 'right')}  />
        <DiamondTile option={OPTIONS.find(o => o.pos === 'left')}   />
        <DiamondTile option={OPTIONS.find(o => o.pos === 'bottom')} />
      </div>

      {/* Back — bottom left */}
      <div onClick={() => navigate('/upload')} style={{ ...cornerBtn, left: '32px' }}>
        <DiamondArrow direction="left" />
        <span style={btnLabel}>BACK</span>
      </div>

      {/* Get summary — bottom right */}
      <div onClick={() => navigate('/demographics')} style={{ ...cornerBtn, right: '32px' }}>
        <span style={btnLabel}>GET SUMMARY</span>
        <DiamondArrow direction="right" />
      </div>
    </div>
  )
}

function DiamondTile({ option, onClick }) {
  const [hovered, setHovered] = useState(false)
  const { label, enabled } = option
  const active = enabled && hovered

  return (
    <div
      onClick={enabled ? onClick : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: active ? '#1A1B1C' : hovered && !enabled ? '#E1E1E2' : '#F3F3F4',
        cursor: enabled ? 'pointer' : 'not-allowed',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.15s ease',
        userSelect: 'none',
      }}
    >
      <span style={{
        transform: 'rotate(-45deg)',
        fontSize: '13px', fontWeight: '600', letterSpacing: '-0.01em',
        textTransform: 'uppercase', textAlign: 'center',
        color: active ? '#FCFCFC' : '#1A1B1C',
        maxWidth: '110px', lineHeight: '1.5',
      }}>
        {label}
      </span>
    </div>
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

const cornerBtn = {
  position: 'absolute', bottom: '36px',
  display: 'flex', alignItems: 'center', gap: '16px',
  cursor: 'pointer', zIndex: 20, userSelect: 'none',
}

const btnLabel = {
  fontSize: '14px', fontWeight: '600', letterSpacing: '-0.02em',
  textTransform: 'uppercase', color: '#1A1B1C', opacity: 0.85,
}
