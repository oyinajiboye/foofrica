import { useRef, useEffect, useState } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'

function AnimatedCounter({ target, prefix = '', suffix = '', duration = 2 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  useEffect(() => {
    if (!isInView) return
    let start = 0
    const increment = target / (duration * 60)
    const step = () => {
      start += increment
      if (start >= target) {
        setCount(target)
        return
      }
      setCount(Math.floor(start))
      requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [isInView, target, duration])

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  )
}

// Title words animate in one by one
const titleWords = ['The', 'Future', 'of', 'Football']

export default function Hero() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start']
  })
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 150])
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.2])

  return (
    <section className="hero" id="hero" ref={ref}>
      <div className="hero__bg">
        <motion.img
          src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1800&q=80&fit=crop"
          alt="Football match action shot"
          className="hero__bg-image"
          style={{ y: bgY, scale: bgScale }}
          loading="eager"
        />
        <div className="hero__bg-overlay-top" />
        <div className="hero__bg-overlay" />
        <div className="hero__bg-glow" />

        {/* Floating football shapes for parallax depth */}
        {[1,2,3,4,5].map((i) => (
          <motion.div
            key={i}
            className="hero__floating-ball"
            style={{
              right: `${10 + i * 15}%`,
              top: `${15 + i * 12}%`,
              fontSize: `${20 + i * 8}px`,
            }}
            animate={{
              y: [0, -20 - i * 5, 0],
              x: [0, 10 + i * 3, 0],
              rotate: [0, 360],
            }}
            transition={{
              y: { duration: 4 + i, repeat: Infinity, ease: 'easeInOut' },
              x: { duration: 5 + i, repeat: Infinity, ease: 'easeInOut' },
              rotate: { duration: 20 + i * 5, repeat: Infinity, ease: 'linear' },
            }}
          >
            ⚽
          </motion.div>
        ))}
      </div>

      <div className="container hero__content">
        <motion.div
          className="hero__badge"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <span className="hero__badge-dot" />
          Coming 2026 — Join the waitlist
        </motion.div>

        <h1 className="hero__title">
          {titleWords.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: 'inline-block', marginRight: '0.3em' }}
            >
              {word}
            </motion.span>
          ))}
          <br />
          <motion.span
            className="text-gradient"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'inline-block', marginRight: '0.3em' }}
          >
            Talent Discovery
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'inline-block' }}
          >
            in Africa
          </motion.span>
        </h1>

        <motion.p
          className="hero__subtitle"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1 }}
        >
          A professional networking and talent discovery platform connecting grassroots players, scouts, clubs, coaches, and fans — all in one football-native ecosystem.
        </motion.p>

        <motion.div
          className="hero__actions"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.3 }}
        >
          <a
            href="#waitlist"
            className="btn btn--primary btn--lg"
            onClick={(e) => {
              e.preventDefault()
              document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
          >
            Join the Waitlist →
          </a>
          <a
            href="#solution"
            className="btn btn--outline btn--lg"
            onClick={(e) => {
              e.preventDefault()
              document.getElementById('solution')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
          >
            Learn More
          </a>
        </motion.div>

        <motion.div
          className="hero__stats"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.5 }}
        >
          <div className="hero__stat">
            <div className="hero__stat-value">
              <AnimatedCounter target={500} suffix="M+" />
            </div>
            <div className="hero__stat-label">Football Fans in Africa</div>
          </div>
          <div className="hero__stat">
            <div className="hero__stat-value">
              <AnimatedCounter target={10} suffix="M+" />
            </div>
            <div className="hero__stat-label">Grassroots Players</div>
          </div>
          <div className="hero__stat">
            <div className="hero__stat-value">
              <AnimatedCounter target={8} prefix="$" suffix="B+" />
            </div>
            <div className="hero__stat-label">Transfer Market</div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
