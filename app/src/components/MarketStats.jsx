import { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'

const stats = [
  { target: 500, suffix: 'M+', label: 'Football fans across Africa' },
  { target: 10, suffix: 'M+', label: 'Unregistered grassroots players' },
  { target: 5000, suffix: '+', label: 'Football academies in Africa' },
  { target: 20, suffix: '%+', label: 'Sports tech market growth' },
]

function SlotCounter({ target, suffix = '', isActive }) {
  const [display, setDisplay] = useState('0')
  const [rolling, setRolling] = useState(false)

  useEffect(() => {
    if (!isActive) return
    setRolling(true)

    // Slot machine effect: rapidly cycle through random numbers then land on target
    const totalDuration = 1500
    const flickerDuration = 1000
    const startTime = Date.now()

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      if (elapsed < flickerDuration) {
        // Random numbers flickering
        const randomNum = Math.floor(Math.random() * target * 1.5)
        setDisplay(randomNum.toLocaleString())
      } else if (elapsed < totalDuration) {
        // Slowing down, getting closer to target
        const progress = (elapsed - flickerDuration) / (totalDuration - flickerDuration)
        const val = Math.floor(target * progress + (Math.random() * target * 0.2 * (1 - progress)))
        setDisplay(Math.min(val, target).toLocaleString())
      } else {
        setDisplay(target.toLocaleString())
        setRolling(false)
        clearInterval(interval)
      }
    }, 50)

    return () => clearInterval(interval)
  }, [isActive, target])

  return (
    <span style={{ fontVariantNumeric: 'tabular-nums' }}>
      {display}{suffix}
    </span>
  )
}

export default function MarketStats() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="section" id="market" ref={ref}>
      <div className="market__glow" />
      <div className="container">
        <div className="market__header">
          <motion.div
            className="section__label"
            style={{ justifyContent: 'center' }}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            The Opportunity
          </motion.div>
          <motion.h2
            className="section__title text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            A Massive, <span className="text-gradient">Underserved</span> Market
          </motion.h2>
          <motion.p
            className="section__subtitle section__subtitle--center"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Africa's football ecosystem is enormous and growing — but there's no platform built for it. Until now.
          </motion.p>
        </div>

        <div className="market__stats">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              className="market__stat-card"
              initial={{ opacity: 0, y: 60 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.6,
                delay: 0.3 + i * 0.12,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <div className="market__stat-value">
                <SlotCounter target={stat.target} suffix={stat.suffix} isActive={isInView} />
              </div>
              <div className="market__stat-label">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
