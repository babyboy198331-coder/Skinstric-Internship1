import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function Landing() {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(null)
  const sophisticatedRef = useRef(null)
  const skincareRef = useRef(null)
  const [skincareOffset, setSkincareOffset] = useState(0)

  useEffect(() => {
    const measure = () => {
      if (sophisticatedRef.current && skincareRef.current) {
        const sW = sophisticatedRef.current.getBoundingClientRect().width
        const kW = skincareRef.current.getBoundingClientRect().width
        setSkincareOffset((sW - kW) / 2)
      }
    }
    requestAnimationFrame(() => {
      document.fonts.ready.then(measure)
      measure()
    })
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const slideX =
    hovered === 'right' ? '-24vw' :
    hovered === 'left'  ? '24vw'  : '0px'

  const sophisticatedTranslate = `translateX(${slideX})`

  const skincareTranslate =
    hovered === 'right' ? `translateX(calc(${slideX} - ${skincareOffset}px))` :
    hovered === 'left'  ? `translateX(calc(${slideX} + ${skincareOffset}px))`  :
    'translateX(0px)'

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#fff' }}>
    <DiagonalLines hovered={hovered} />

      {/* White mask — hides diagonal lines behind text */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '58%',
        height: '36%',
        background: '#fff',
        zIndex: 1,
        pointerEvents: 'none',
      }} />

      <Navbar />

      {/* Hero text — full width, no clip, text slides freely */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        transform: 'translateY(-50%)',
        textAlign: 'center',
        pointerEvents: 'none',
        zIndex: 3,
      }}>
        <h1 style={{
          fontSize: 'clamp(60px, 6.67vw, 128px)',
          fontWeight: '300',
          lineHeight: '0.9375',
          letterSpacing: '-0.07em',
          color: '#1a1a1a',
          whiteSpace: 'nowrap',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <span ref={sophisticatedRef} style={{
            display: 'inline-block',
            transform: sophisticatedTranslate,
            transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}>Sophisticated</span>
          <span ref={skincareRef} style={{
            display: 'inline-block',
            transform: skincareTranslate,
            transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}>skincare</span>
        </h1>
      </div>

      {/* Left nav — fades out when RIGHT is hovered */}
      <div
        onMouseEnter={() => setHovered('left')}
        onMouseLeave={() => setHovered(null)}
        style={{
          position: 'absolute',
          left: '32px',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          cursor: 'pointer',
          zIndex: 4,
          opacity: hovered === 'right' ? 0 : 1,
          transition: 'opacity 0.4s ease',
        }}
      >
        <DiamondButton direction="left" />
        <span style={{ fontSize: '14px', letterSpacing: '0', fontWeight: '400', color: '#1a1a1a', textTransform: 'uppercase' }}>
          DISCOVER A.I.
        </span>
      </div>

      {/* Right nav — fades out when LEFT is hovered */}
      <div
        onClick={() => navigate('/testing')}
        onMouseEnter={() => setHovered('right')}
        onMouseLeave={() => setHovered(null)}
        style={{
          position: 'absolute',
          right: '32px',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          cursor: 'pointer',
          zIndex: 4,
          opacity: hovered === 'left' ? 0 : 1,
          transition: 'opacity 0.4s ease',
        }}
      >
        <span style={{ fontSize: '14px', letterSpacing: '0', fontWeight: '400', color: '#1a1a1a', textTransform: 'uppercase' }}>
          TAKE TEST
        </span>
        <DiamondButton direction="right" />
      </div>

      {/* Bottom-left description */}
      <p style={{
        position: 'absolute',
        bottom: '40px',
        left: '32px',
        fontSize: '14px',
        letterSpacing: '0',
        fontWeight: '400',
        color: '#1a1a1a',
        maxWidth: '240px',
        lineHeight: '24px',
        textTransform: 'uppercase',
      }}>
        Skinstric developed an A.I. that creates a highly-personalised routine tailored to what your skin needs.
      </p>
    </div>
  )
}

function DiamondButton({ direction }) {
  return (
    <div style={{
      width: '36px',
      height: '36px',
      border: '1px solid #1a1a1a',
      transform: 'rotate(45deg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      <span style={{ transform: 'rotate(-45deg)', fontSize: '9px', lineHeight: 1, color: '#1a1a1a' }}>
        {direction === 'left' ? '◄' : '►'}
      </span>
    </div>
  )
}

function DiagonalLines({ hovered }) {
  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g style={{ opacity: hovered === 'right' ? 0 : 1, transition: 'opacity 0.4s ease' }}>
        <line x1="0" y1="0"    x2="20%" y2="50%" stroke="rgba(0,0,0,0.18)" strokeWidth="1" strokeDasharray="5 5" />
        <line x1="0" y1="100%" x2="20%" y2="50%" stroke="rgba(0,0,0,0.18)" strokeWidth="1" strokeDasharray="5 5" />
      </g>
      <g style={{ opacity: hovered === 'left' ? 0 : 1, transition: 'opacity 0.4s ease' }}>
        <line x1="100%" y1="0"    x2="80%" y2="50%" stroke="rgba(0,0,0,0.18)" strokeWidth="1" strokeDasharray="5 5" />
        <line x1="100%" y1="100%" x2="80%" y2="50%" stroke="rgba(0,0,0,0.18)" strokeWidth="1" strokeDasharray="5 5" />
      </g>
    </svg>
  )
}