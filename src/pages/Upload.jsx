import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

const API_URL = import.meta.env.VITE_API_PHASE_TWO
  || 'https://us-central1-api-skinstric-ai.cloudfunctions.net/skinstricPhaseTwo'

/* ── Global camera stream registry ──
   Every stream ever opened is tracked here, so no stream can leak —
   even ones from StrictMode double-mounts or hot-reload races. */
const activeStreams = new Set()

async function openCameraStream() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: { ideal: 1280 } },
  })
  activeStreams.add(stream)
  return stream
}

function closeAllCameraStreams() {
  activeStreams.forEach((stream) => stream.getTracks().forEach((t) => t.stop()))
  activeStreams.clear()
}

/* Downscale image to max 1024px and return { dataUrl, base64 } */
function processImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const MAX = 1024
      let { width, height } = img
      if (width > MAX || height > MAX) {
        const scale = MAX / Math.max(width, height)
        width = Math.round(width * scale)
        height = Math.round(height * scale)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
      resolve({ dataUrl, base64: dataUrl.split(',')[1] })
    }
    img.onerror = reject
    img.src = src
  })
}

export default function Upload() {
  const navigate = useNavigate()
  const galleryRef = useRef(null)

  // 'choose' | 'permission' | 'settingUp' | 'camera' | 'analyzing'
  const [phase, setPhase]     = useState('choose')
  const [preview, setPreview] = useState(null)
  const [error, setError]     = useState('')

  // Safety net: whatever happens, leaving this page kills the camera
  useEffect(() => closeAllCameraStreams, [])

  const analyze = useCallback(async (dataUrl) => {
    setPhase('analyzing')
    setError('')
    try {
      const { dataUrl: scaled, base64 } = await processImage(dataUrl)
      const res = await fetch(API_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ image: base64 }),
      })
      const json = await res.json()
      if (!json.data) throw new Error('No data')
      localStorage.setItem('skinstric_demographics', JSON.stringify(json.data))
      // New analysis — clear corrections from any previous photo
      localStorage.removeItem('skinstric_demographics_selected')
      localStorage.removeItem('skinstric_demographics_confirmed')
      try { localStorage.setItem('skinstric_preview', scaled) } catch { /* quota — preview optional */ }
      navigate('/select')
    } catch {
      setError('Something went wrong analyzing your image. Please try again.')
      setPhase('choose')
    }
  }, [navigate])

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }
    setError('')
    const reader = new FileReader()
    reader.onload = (e) => { setPreview(e.target.result); analyze(e.target.result) }
    reader.readAsDataURL(file)
  }

  /* ── Live camera gets its own full screen ── */
  if (phase === 'camera') {
    return (
      <CameraScreen
        onCapture={(dataUrl) => { setPreview(dataUrl); analyze(dataUrl) }}
        onBack={() => setPhase('choose')}
        onError={() => { setError('Could not access camera. Please allow camera access or upload from gallery.'); setPhase('choose') }}
      />
    )
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#FCFCFC', overflow: 'hidden' }}>
      <Navbar showEnterCode={false} />

      <p style={{
        position: 'absolute', top: '86px', left: '32px',
        fontSize: '16px', fontWeight: '600', letterSpacing: '-0.02em',
        textTransform: 'uppercase', color: '#1A1B1C', zIndex: 5,
      }}>
        TO START ANALYSIS
      </p>

      {/* Preview thumbnail — top right */}
      {phase === 'choose' && (
        <div className="upload-preview" style={{ position: 'absolute', top: '86px', right: '32px', zIndex: 5, textAlign: 'left' }}>
          <p style={{ fontSize: '14px', color: '#1A1B1C', marginBottom: '8px' }}>Preview</p>
          <div style={{ width: '96px', height: '96px', border: '1px solid rgba(26,27,28,0.4)', overflow: 'hidden' }}>
            {preview && <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          </div>
        </div>
      )}

      {phase === 'analyzing' && <CenterLoader text="PREPARING YOUR ANALYSIS" />}
      {phase === 'settingUp' && <SettingUpCamera onReady={() => setPhase('camera')} />}

      {(phase === 'choose' || phase === 'permission') && (
        <>
          {/* Camera option — left */}
          <DiamondOption
            side="left"
            icon={<ApertureGlyph />}
            iconBg="#FCFCFC"
            label={'ALLOW A.I.\nTO SCAN YOUR FACE'}
            onClick={() => setPhase('permission')}
          />
          {/* Gallery option — right */}
          <DiamondOption
            side="right"
            icon={<GalleryGlyph />}
            iconBg="#1A1B1C"
            label={'ALLOW A.I.\nACCESS GALLERY'}
            onClick={() => galleryRef.current?.click()}
          />

          {/* Select preferred way — bottom centre */}
          <div className="select-way" style={{
            position: 'absolute', bottom: '64px', left: '50%', transform: 'translateX(-50%)',
            textAlign: 'center', zIndex: 15,
          }}>
            <div style={{
              width: '26px', height: '26px', margin: '0 auto',
              border: '1px dotted rgba(26,27,28,0.4)', transform: 'rotate(45deg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ width: '5px', height: '5px', background: 'rgba(26,27,28,0.5)' }} />
            </div>
            <p style={{
              fontSize: '12px', letterSpacing: '0.04em', textTransform: 'uppercase',
              color: 'rgba(26,27,28,0.5)', marginTop: '12px',
            }}>
              SELECT PREFERRED WAY
            </p>
          </div>

          {error && (
            <p style={{
              position: 'absolute', bottom: '110px', left: '50%', transform: 'translateX(-50%)',
              fontSize: '13px', color: '#c0392b', zIndex: 20, textAlign: 'center',
            }}>
              {error}
            </p>
          )}

          <input
            ref={galleryRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={(e) => { handleFile(e.target.files[0]); e.target.value = '' }}
          />
        </>
      )}

      {/* Camera permission dialog */}
      {phase === 'permission' && (
        <div className="camera-permission" style={{
          position: 'absolute', top: '50%', left: 'calc(25% + 86px)',
          transform: 'translateY(-50%)',
          width: '352px', maxWidth: '90vw', background: '#1A1B1C', zIndex: 50,
        }}>
          <p style={{
            color: '#FCFCFC', fontSize: '14px', fontWeight: '600',
            textTransform: 'uppercase', padding: '16px 20px 32px', letterSpacing: '0.02em',
          }}>
            ALLOW A.I. TO ACCESS YOUR CAMERA
          </p>
          <div style={{
            borderTop: '1px solid rgba(252,252,252,0.4)',
            display: 'flex', justifyContent: 'flex-end', gap: '28px', padding: '10px 20px',
          }}>
            <button onClick={() => setPhase('choose')} style={dialogBtn}>DENY</button>
            <button onClick={() => setPhase('settingUp')} style={{ ...dialogBtn, fontWeight: '700' }}>ALLOW</button>
          </div>
        </div>
      )}

      {/* Back — bottom left */}
      {phase !== 'analyzing' && (
        <div onClick={() => navigate('/testing')} style={{ ...cornerBtn, left: '32px' }}>
          <DiamondArrow direction="left" />
          <span style={btnLabel}>BACK</span>
        </div>
      )}
    </div>
  )
}

/* ── Diamond cluster with icon, connector line + label ── */
function DiamondOption({ side, icon, iconBg = '#FCFCFC', label, onClick }) {
  const isLeft = side === 'left'
  return (
    <div className={isLeft ? 'upload-option-left' : 'upload-option-right'} style={{
      position: 'absolute',
      top: '50%',
      left: isLeft ? '25%' : '75%',
      transform: 'translate(-50%, -50%)',
      width: 'min(420px, 44vh, 88vw)', height: 'min(420px, 44vh, 88vw)',
      zIndex: 10,
    }}>
      {/* rotating dotted diamonds */}
      {['outer', 'mid', 'inner'].map((ring, i) => (
        <div
          key={ring}
          className={`diamond-${ring}`}
          style={{
            position: 'absolute', top: '50%', left: '50%',
            width: `${100 - i * 14}%`, height: `${100 - i * 14}%`,
            border: `1.5px dotted rgba(26,27,28,${0.15 + i * 0.1})`,
          }}
        />
      ))}

      {/* icon button — thin outer ring, then inner circle */}
      <div
        onClick={onClick}
        style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '136px', height: '136px', borderRadius: '50%',
          border: '1px solid rgba(26,27,28,0.6)', padding: '5px',
          background: 'transparent', cursor: 'pointer',
          transition: 'transform 0.2s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'}
      >
        <div style={{
          width: '100%', height: '100%', borderRadius: '50%',
          background: iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </div>
      </div>

      {/* connector line + label */}
      <div style={{
        position: 'absolute',
        top: isLeft ? '24%' : 'auto',
        bottom: isLeft ? 'auto' : '24%',
        left: isLeft ? '60%' : 'auto',
        right: isLeft ? 'auto' : '60%',
        width: '70px', height: '1px', background: '#1A1B1C',
        transform: 'rotate(-45deg)',
        transformOrigin: isLeft ? 'left bottom' : 'right top',
      }} />
      <p style={{
        position: 'absolute',
        top: isLeft ? '8%' : 'auto',
        bottom: isLeft ? 'auto' : '8%',
        left: isLeft ? '73%' : 'auto',
        right: isLeft ? 'auto' : '73%',
        fontSize: '14px', fontWeight: '400', lineHeight: '1.7',
        textTransform: 'uppercase', color: '#1A1B1C',
        whiteSpace: 'pre-line', width: '170px',
        textAlign: isLeft ? 'left' : 'right',
      }}>
        {label}
      </p>
    </div>
  )
}

/* ── SETTING UP CAMERA loading screen ── */
function SettingUpCamera({ onReady }) {
  useEffect(() => {
    const t = setTimeout(onReady, 2000)
    return () => clearTimeout(t)
  }, [onReady])

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 30,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: '#FCFCFC',
    }}>
      <div style={{ position: 'relative', width: 'min(380px, 40vh, 62vw)', height: 'min(380px, 40vh, 62vw)' }}>
        {['outer', 'mid', 'inner'].map((ring, i) => (
          <div
            key={ring}
            className={`diamond-${ring}`}
            style={{
              position: 'absolute', top: '50%', left: '50%',
              width: `${100 - i * 14}%`, height: `${100 - i * 14}%`,
              border: `1.5px dotted rgba(26,27,28,${0.15 + i * 0.1})`,
            }}
          />
        ))}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '136px', height: '136px', borderRadius: '50%',
          border: '1px solid rgba(26,27,28,0.6)', background: '#FCFCFC',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ApertureGlyph />
        </div>
      </div>
      <p className="loading-dots" style={{
        fontSize: '16px', fontWeight: '600', letterSpacing: '0.02em',
        textTransform: 'uppercase', color: '#1A1B1C', marginTop: '8px',
      }}>
        SETTING UP CAMERA
      </p>
      <CameraTips style={{ marginTop: '32px' }} />
    </div>
  )
}

/* ── Live camera capture screen ── */
function CameraScreen({ onCapture, onBack, onError }) {
  const videoRef = useRef(null)
  const [captured, setCaptured] = useState(null) // dataUrl after snap

  // Fully release the camera: stop EVERY stream ever opened and detach the <video>
  const stopCamera = useCallback(() => {
    closeAllCameraStreams()
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null
    }
  }, [])

  const startCamera = useCallback(async () => {
    try {
      const stream = await openCameraStream()
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      } else {
        // video element gone (unmounted mid-request) — don't leak the stream
        stream.getTracks().forEach(t => t.stop())
        activeStreams.delete(stream)
      }
    } catch {
      onError()
    }
  }, [onError])

  useEffect(() => {
    startCamera()
    return stopCamera
  }, [startCamera, stopCamera])

  const snap = () => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return

    const canvas = document.createElement('canvas')
    // Capture the full hardware stream dimensions
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')

    // Clean draw without mirroring matrix transformations
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    setCaptured(canvas.toDataURL('image/jpeg', 0.9))
    stopCamera()
  }

  const retake = () => {
    setCaptured(null)
    startCamera()
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#1A1B1C', overflow: 'hidden' }}>
      {captured ? (
        <img src={captured} alt="Captured" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <video
          ref={videoRef} autoPlay playsInline muted
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
        />
      )}

      <Navbar showEnterCode={false} />

      {captured ? (
        <>
          <p style={{
            position: 'absolute', top: '28%', left: '50%', transform: 'translateX(-50%)',
            fontSize: '16px', fontWeight: '600', letterSpacing: '0.02em',
            textTransform: 'uppercase', color: '#FCFCFC', zIndex: 20,
            textShadow: '0 1px 8px rgba(0,0,0,0.5)',
          }}>
            GREAT SHOT!
          </p>

          {/* Preview label + Retake / Use This Photo */}
          <div style={{
            position: 'absolute', bottom: '64px', left: 0, right: 0, zIndex: 20,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px',
          }}>
            <p style={{
              fontSize: '24px', fontWeight: '600', color: '#FCFCFC',
              textShadow: '0 1px 8px rgba(0,0,0,0.5)',
            }}>
              Preview
            </p>
            <div style={{ display: 'flex', gap: '20px' }}>
              <button onClick={retake} style={previewBtnLight}>Retake</button>
              <button onClick={() => onCapture(captured)} style={previewBtnDark}>Use This Photo</button>
            </div>
          </div>

          {/* Back — bottom left */}
          <div onClick={onBack} style={{ ...cornerBtn, left: '32px', zIndex: 20 }}>
            <DiamondArrow direction="left" light />
            <span style={{ ...btnLabel, color: '#FCFCFC', textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>BACK</span>
          </div>
        </>
      ) : (
        <>
          {/* Take picture — right centre (bottom centre on phones) */}
          <div
            className="camera-shutter"
            onClick={snap}
            style={{
              position: 'absolute', top: '50%', right: '40px',
              transform: 'translateY(-50%)', zIndex: 20,
              display: 'flex', alignItems: 'center', gap: '14px',
              cursor: 'pointer', userSelect: 'none',
            }}
          >
            <span style={{
              fontSize: '14px', fontWeight: '600', letterSpacing: '0.02em',
              textTransform: 'uppercase', color: '#FCFCFC',
              textShadow: '0 1px 8px rgba(0,0,0,0.5)',
            }}>
              TAKE PICTURE
            </span>
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%',
              background: '#FCFCFC', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ApertureGlyph size={32} />
            </div>
          </div>

          <CameraTips light style={{
            position: 'absolute', bottom: '40px', left: 0, right: 0, zIndex: 20,
          }} />

          {/* Back */}
          <div onClick={onBack} style={{ ...cornerBtn, left: '32px', zIndex: 20 }}>
            <DiamondArrow direction="left" light />
            <span style={{ ...btnLabel, color: '#FCFCFC', textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>BACK</span>
          </div>
        </>
      )}
    </div>
  )
}

/* ── Better-results tips row ── */
function CameraTips({ light, style }) {
  const color = light ? '#FCFCFC' : '#1A1B1C'
  return (
    <div style={{ textAlign: 'center', ...style }}>
      <p style={{
        fontSize: '12px', letterSpacing: '0.04em', textTransform: 'uppercase',
        color, opacity: 0.9, marginBottom: '12px',
        textShadow: light ? '0 1px 6px rgba(0,0,0,0.5)' : 'none',
      }}>
        TO GET BETTER RESULTS MAKE SURE TO HAVE
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px 32px', flexWrap: 'wrap', padding: '0 16px' }}>
        {['NEUTRAL EXPRESSION', 'FRONTAL POSE', 'ADEQUATE LIGHTING'].map((tip) => (
          <span key={tip} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '12px', letterSpacing: '0.04em', textTransform: 'uppercase',
            color, textShadow: light ? '0 1px 6px rgba(0,0,0,0.5)' : 'none',
          }}>
            <span style={{
              width: '7px', height: '7px', border: `1px solid ${color}`,
              transform: 'rotate(45deg)', display: 'inline-block', flexShrink: 0,
            }} />
            {tip}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ── Centre loading text with rotating diamonds ── */
function CenterLoader({ text }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 30,
      display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FCFCFC',
    }}>
      <div style={{ position: 'relative', width: 'min(480px, 50vh, 63vw)', height: 'min(480px, 50vh, 63vw)' }}>
        {['outer', 'mid', 'inner'].map((ring, i) => (
          <div
            key={ring}
            className={`diamond-${ring}`}
            style={{
              position: 'absolute', top: '50%', left: '50%',
              width: `${100 - i * 14}%`, height: `${100 - i * 14}%`,
              border: `1.5px dotted rgba(26,27,28,${0.15 + i * 0.1})`,
            }}
          />
        ))}
        <p className="loading-dots" style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '16px', fontWeight: '600', letterSpacing: '0.02em',
          textTransform: 'uppercase', color: '#1A1B1C', whiteSpace: 'nowrap',
        }}>
          {text}
        </p>
      </div>
    </div>
  )
}

/* ── Icons ── */
function ApertureGlyph({ size = 56, color = '#1A1B1C' }) {
  // camera aperture / shutter icon
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.3" />
      <path
        d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83M16.62 12l-5.74 9.94"
        stroke={color} strokeWidth="1.2" strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="2.6" fill={color} />
    </svg>
  )
}

function GalleryGlyph() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="16" rx="1" stroke="#FCFCFC" strokeWidth="1.4" />
      <circle cx="8.5" cy="9.5" r="1.8" stroke="#FCFCFC" strokeWidth="1.4" />
      <path d="M3 16.5l5-5 4 4 3-3 6 6" stroke="#FCFCFC" strokeWidth="1.4" fill="none" strokeLinejoin="round" />
    </svg>
  )
}

function DiamondArrow({ direction, light }) {
  const color = light ? '#FCFCFC' : '#1A1B1C'
  return (
    <div style={{
      width: '44px', height: '44px', border: `1px solid ${color}`,
      transform: 'rotate(45deg)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexShrink: 0,
    }}>
      <span style={{ transform: 'rotate(-45deg)', fontSize: '10px', lineHeight: 1, color }}>
        {direction === 'left' ? '◀' : '▶'}
      </span>
    </div>
  )
}

/* ── Shared styles ── */
const cornerBtn = {
  position: 'absolute', bottom: '36px',
  display: 'flex', alignItems: 'center', gap: '16px',
  cursor: 'pointer', zIndex: 20, userSelect: 'none',
}

const btnLabel = {
  fontSize: '14px', fontWeight: '600', letterSpacing: '-0.02em',
  textTransform: 'uppercase', color: '#1A1B1C', opacity: 0.85,
}

const previewBtnLight = {
  background: '#F3F3F4', border: 'none', cursor: 'pointer',
  color: '#1A1B1C', padding: '12px 28px',
  fontSize: '16px', fontWeight: '500', fontFamily: 'inherit',
}

const previewBtnDark = {
  background: '#1A1B1C', border: 'none', cursor: 'pointer',
  color: '#FCFCFC', padding: '12px 28px',
  fontSize: '16px', fontWeight: '500', fontFamily: 'inherit',
}

const dialogBtn = {
  background: 'transparent', border: 'none', cursor: 'pointer',
  color: '#FCFCFC', fontSize: '12px', fontWeight: '400',
  letterSpacing: '0.05em', textTransform: 'uppercase',
  fontFamily: 'inherit', padding: 0,
}

