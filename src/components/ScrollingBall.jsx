import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'
import { FootballIcon } from './CustomCursor'

export default function ScrollingBall() {
  const { scrollYProgress } = useScroll()
  const [windowHeight, setWindowHeight] = useState(0)
  const [docHeight, setDocHeight] = useState(0)

  useEffect(() => {
    const update = () => {
      setWindowHeight(window.innerHeight)
      setDocHeight(document.documentElement.scrollHeight)
    }
    update()
    window.addEventListener('resize', update)
    const timer = setTimeout(update, 1000)
    return () => { window.removeEventListener('resize', update); clearTimeout(timer) }
  }, [])

  // Ball Y position: moves down the page with scroll
  const rawY = useTransform(scrollYProgress, [0, 1], [120, windowHeight - 120])
  const y = useSpring(rawY, { stiffness: 100, damping: 20, mass: 0.5 })

  // Ball X position: zigzag pattern
  const rawX = useTransform(
    scrollYProgress,
    [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
    [60, 40, 70, 35, 65, 45, 60, 30, 55, 45, 50]
  )
  const x = useSpring(rawX, { stiffness: 80, damping: 15 })

  // Rotation based on scroll
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 1440])
  const smoothRotate = useSpring(rotate, { stiffness: 50, damping: 20 })

  // Scale bounce at section transitions
  const scale = useTransform(
    scrollYProgress,
    [0, 0.12, 0.13, 0.25, 0.26, 0.37, 0.38, 0.5, 0.51, 0.62, 0.63, 0.75, 0.76, 0.87, 0.88, 1],
    [1, 1, 1.3, 1, 1.3, 1, 1.3, 1, 1.3, 1, 1.3, 1, 1.3, 1, 1.3, 1]
  )
  const smoothScale = useSpring(scale, { stiffness: 300, damping: 15 })

  return (
    <>
      {/* Trail dots */}
      <BallTrail scrollYProgress={scrollYProgress} windowHeight={windowHeight} />

      {/* Main ball */}
      <motion.div
        className="scrolling-ball"
        style={{
          top: 0,
          left: 0,
          x,
          y,
          rotate: smoothRotate,
          scale: smoothScale,
        }}
      >
        <FootballIcon size={50} />
      </motion.div>
    </>
  )
}

function BallTrail({ scrollYProgress, windowHeight }) {
  const [dots, setDots] = useState([])

  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (v) => {
      const numDots = 12
      const newDots = []
      for (let i = 0; i < numDots; i++) {
        const t = Math.max(0, v - i * 0.008)
        const yPos = 120 + t * (windowHeight - 240)
        const xOffsets = [60, 40, 70, 35, 65, 45, 60, 30, 55, 45, 50]
        // interpolate x
        const segLen = 1 / (xOffsets.length - 1)
        const segIndex = Math.min(Math.floor(t / segLen), xOffsets.length - 2)
        const segProgress = (t - segIndex * segLen) / segLen
        const xPos = xOffsets[segIndex] + (xOffsets[segIndex + 1] - xOffsets[segIndex]) * segProgress
        newDots.push({
          x: xPos,
          y: yPos,
          opacity: 0.3 - i * 0.025,
          size: 4 - i * 0.2,
        })
      }
      setDots(newDots)
    })
    return unsubscribe
  }, [scrollYProgress, windowHeight])

  return (
    <div className="ball-trail">
      {dots.map((dot, i) => (
        <div
          key={i}
          className="ball-trail__dot"
          style={{
            left: dot.x,
            top: dot.y,
            opacity: Math.max(0, dot.opacity),
            width: Math.max(2, dot.size),
            height: Math.max(2, dot.size),
          }}
        />
      ))}
    </div>
  )
}
