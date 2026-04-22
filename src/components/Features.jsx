import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const features = [
  { icon: '📄', title: 'Structured Profiles', text: 'Football CVs with position, stats, career history, and tagged video galleries — not generic social bios.' },
  { icon: '🎥', title: 'Video Discovery', text: 'Upload highlights with rich metadata — match type, position, key actions — making talent searchable and evaluable.' },
  { icon: '🔍', title: 'Advanced Search', text: 'Filter players by position, age, location, height, dominant foot, club, and verification status. Find exactly who you need.' },
  { icon: '✅', title: 'Trust & Verification', text: '4-tier badge system, coach endorsements, club verification, and credential checks — real trust in a trust-deficient space.' },
  { icon: '💬', title: 'Fan Community', text: 'Match threads, tactical discussions, polls, communities, and a reputation system that rewards quality football knowledge.' },
  { icon: '🧠', title: 'Smart Feed', text: 'Personalized algorithmic feed with 5 tabs — For You, Following, Trending, Discover, and Match Day. Role-aware content delivery.' },
]

function TiltFeatureCard({ children, className, delay, isInView }) {
  const cardRef = useRef(null)

  const handleMouseMove = (e) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = ((y - centerY) / centerY) * -6
    const rotateY = ((x - centerX) / centerX) * 6
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`
  }

  const handleMouseLeave = () => {
    const card = cardRef.current
    if (card) card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px)'
  }

  return (
    <motion.div
      ref={cardRef}
      className={className}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transition: 'transform 0.15s ease' }}
    >
      {children}
    </motion.div>
  )
}

export default function Features() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="section" id="features" ref={ref}>
      <div className="container">
        <div className="features__header">
          <motion.div
            className="section__label"
            style={{ justifyContent: 'center' }}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            Core Features
          </motion.div>
          <motion.h2
            className="section__title text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Everything You Need.<br /><span className="text-gradient">Nothing You Don't.</span>
          </motion.h2>
          <motion.p
            className="section__subtitle section__subtitle--center"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Purpose-built for football — not a generic social platform adapted for sports.
          </motion.p>
        </div>

        <div className="features__grid">
          {features.map((feature, i) => {
            // Wave pattern: top-left to bottom-right
            const row = Math.floor(i / 3)
            const col = i % 3
            const waveDelay = 0.3 + (row + col) * 0.1

            return (
              <TiltFeatureCard
                key={i}
                className="feature-card"
                delay={waveDelay}
                isInView={isInView}
              >
                <div className="feature-card__icon">{feature.icon}</div>
                <h3 className="feature-card__title">{feature.title}</h3>
                <p className="feature-card__text">{feature.text}</p>
              </TiltFeatureCard>
            )
          })}
        </div>
      </div>
    </section>
  )
}
