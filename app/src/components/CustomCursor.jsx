import { useMousePosition } from '../hooks/useMousePosition'

const FootballIcon = ({ size = 32, className = '' }) => (
  <img
    src="/1380575802.svg"
    alt=""
    width={size}
    height={size}
    className={className}
    style={{ pointerEvents: 'none', display: 'block' }}
    draggable={false}
  />
)

export default function CustomCursor() {
  const { position, isHovering } = useMousePosition()

  return (
    <div
      className="custom-cursor"
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      <div className={`custom-cursor__ball ${isHovering ? 'hovered' : ''}`}>
        <FootballIcon size={isHovering ? 48 : 32} />
      </div>
      <div className="custom-cursor__glow" />
    </div>
  )
}

export { FootballIcon }
