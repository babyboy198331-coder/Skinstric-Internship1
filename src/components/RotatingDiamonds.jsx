export default function RotatingDiamonds() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>

      {/* Four corner diagonal lines using CSS gradients — no SVG, no clipPath */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `
          linear-gradient(to bottom right, transparent calc(50% - 0.5px), #ccc calc(50% - 0.5px), #ccc calc(50% + 0.5px), transparent calc(50% + 0.5px)) top left     / 30% 40% no-repeat,
          linear-gradient(to bottom left,  transparent calc(50% - 0.5px), #ccc calc(50% - 0.5px), #ccc calc(50% + 0.5px), transparent calc(50% + 0.5px)) top right    / 30% 40% no-repeat,
          linear-gradient(to top right,    transparent calc(50% - 0.5px), #ccc calc(50% - 0.5px), #ccc calc(50% + 0.5px), transparent calc(50% + 0.5px)) bottom left  / 30% 40% no-repeat,
          linear-gradient(to top left,     transparent calc(50% - 0.5px), #ccc calc(50% - 0.5px), #ccc calc(50% + 0.5px), transparent calc(50% + 0.5px)) bottom right / 30% 40% no-repeat
        `,
      }} />

      {/* Left diamond */}
      <div style={{ position: 'absolute', left: '4%', top: '50%', transform: 'translateY(-50%) rotate(45deg)', width: '28px', height: '28px', border: '1.5px solid #1a1a1a' }} />
      {/* Right diamond */}
      <div style={{ position: 'absolute', right: '4%', top: '50%', transform: 'translateY(-50%) rotate(45deg)', width: '28px', height: '28px', border: '1.5px solid #1a1a1a' }} />
    </div>
  )
}
