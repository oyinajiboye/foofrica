import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const cards = [
  { emoji: '💼', source: 'Inspired by LinkedIn', title: 'Professional Credibility', text: 'Structured player CVs with verified career histories, club affiliations, and professional endorsements.' },
  { emoji: '💬', source: 'Inspired by Twitter/X', title: 'Social Engagement', text: 'Real-time football discussions, match threads, hot takes, polls, and a vibrant fan community.' },
  { emoji: '🎬', source: 'Inspired by TikTok', title: 'Video Discovery', text: 'Short-form highlight reels with rich metadata that surface talent to scouts through engagement.' },
]

function TiltCard({ children, className, delay = 0, isInView }) {
  const cardRef = useRef(null)

  const handleMouseMove = (e) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = ((y - centerY) / centerY) * -8
    const rotateY = ((x - centerX) / centerX) * 8
    card.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`
  }

  const handleMouseLeave = () => {
    const card = cardRef.current
    if (card) card.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)'
  }

  return (
    <motion.div
      ref={cardRef}
      className={className}
      initial={{ opacity: 0, rotateY: -90 }}
      animate={isInView ? { opacity: 1, rotateY: 0 } : {}}
      transition={{
        duration: 0.7,
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

export default function Solution() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="section" id="solution" ref={ref}>
      <div className="solution__glow" />
      <div className="container">
        <div className="solution__header">
          <motion.div
            className="section__label"
            style={{ justifyContent: 'center' }}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            Meet Footfrica
          </motion.div>
          <motion.h2
            className="section__title"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            One Platform.<br /><span className="text-gradient">The Entire Football Ecosystem.</span>
          </motion.h2>
          <motion.p
            className="section__subtitle section__subtitle--center"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            We combine the best of professional networking, social engagement, and video discovery — purpose-built for football.
          </motion.p>
        </div>

        <div className="solution__inspiration">
          {cards.map((card, i) => (
            <TiltCard
              key={i}
              className="solution__card"
              delay={0.3 + i * 0.15}
              isInView={isInView}
            >
              <span className="solution__card-emoji">{card.emoji}</span>
              <div className="solution__card-source">{card.source}</div>
              <h3 className="solution__card-title">{card.title}</h3>
              <p className="solution__card-text">{card.text}</p>
            </TiltCard>
          ))}
        </div>

        <motion.div
          className="solution__equation"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <span className="solution__eq-item">Careers built like LinkedIn</span>
          <span className="solution__eq-plus">+</span>
          <span className="solution__eq-item">Visibility driven like Twitter</span>
          <span className="solution__eq-plus">+</span>
          <span className="solution__eq-item">Talent discovered like TikTok</span>
          <span className="solution__eq-plus">=</span>
          <span className="solution__eq-item solution__eq-result">⚽ Footfrica</span>
        </motion.div>
      </div>
    </section>
  )
}
