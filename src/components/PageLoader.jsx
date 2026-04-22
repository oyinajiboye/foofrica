import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FootballIcon } from './CustomCursor'

export default function PageLoader({ onComplete }) {
  const [phase, setPhase] = useState(0) // 0=ball drop, 1=logo, 2=done

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800)
    const t2 = setTimeout(() => setPhase(2), 1800)
    const t3 = setTimeout(() => onComplete(), 2200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onComplete])

  return (
    <AnimatePresence>
      {phase < 2 && (
        <motion.div
          className="page-loader"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Bouncing ball */}
          <motion.div
            className="page-loader__ball"
            initial={{ y: -200, opacity: 0 }}
            animate={{
              y: [-200, 0, -40, 0, -15, 0],
              opacity: 1,
              rotate: [0, 360, 540, 720, 800, 720],
            }}
            transition={{
              y: { duration: 0.8, times: [0, 0.4, 0.55, 0.7, 0.85, 1], ease: 'easeOut' },
              opacity: { duration: 0.2 },
              rotate: { duration: 0.8, ease: 'easeOut' },
            }}
          >
            <FootballIcon size={60} />
          </motion.div>

          {/* Logo text */}
          <motion.div
            className="page-loader__text"
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            ⚽ Footfrica
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
