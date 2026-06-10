import { Link } from 'react-router-dom'

export default function Navbar({ showEnterCode = true, section = 'INTRO' }) {
  return (
    <nav style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      zIndex: 100,
    }}>
      {/* Left: SKINSTRIC [ INTRO ] */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link to="/" style={{
          fontSize: '14px',
          fontWeight: '600',
          letterSpacing: '-0.02em',
          color: '#1A1B1C',
          textDecoration: 'none',
          fontFamily: "'Roobert TRIAL', 'DM Sans', sans-serif",
        }}>
          SKINSTRIC
        </Link>

        {/* Bracket indicator — [ INTRO ] rendered as bordered rectangles */}
        <div style={{
          display: 'flex', flexDirection: 'row',
          alignItems: 'center', gap: '6px',
          opacity: 0.6,
        }}>
          <div style={{ width: '4px', height: '17px', border: '1px solid #1A1B1C', borderRadius: '2px' }} />
          <span style={{
            fontSize: '14px', fontWeight: '600',
            letterSpacing: '-0.02em', lineHeight: '16px',
            textTransform: 'uppercase', color: '#1A1B1C',
            fontFamily: "'Roobert TRIAL', 'DM Sans', sans-serif",
          }}>
            {section}
          </span>
          <div style={{ width: '4px', height: '17px', border: '1px solid #1A1B1C', borderRadius: '2px', transform: 'scaleX(-1)' }} />
        </div>
      </div>

      {/* Right: ENTER CODE (hidden on analysis pages) */}
      {showEnterCode && (
        <button style={{
          display: 'flex', alignItems: 'center',
          padding: '8px 16px',
          fontSize: '10px', fontWeight: '600',
          letterSpacing: '-0.02em', lineHeight: '16px',
          textTransform: 'uppercase',
          color: '#FCFCFC', background: '#1A1B1C',
          border: 'none', cursor: 'pointer',
          fontFamily: "'Roobert TRIAL', 'DM Sans', sans-serif",
        }}>
          ENTER CODE
        </button>
      )}
    </nav>
  )
}
