import { useRef } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'

const steps = [
  { icon: '🎬', title: 'Player Uploads', text: 'Players upload highlight reels with metadata' },
  { icon: '🔥', title: 'Fans Engage', text: 'Fans react, comment, and amplify content' },
  { icon: '📈', title: 'Algorithm Boosts', text: 'Engagement signals surface quality talent' },
  { icon: '🔎', title: 'Scouts Discover', text: 'Scouts find and evaluate verified players' },
  { icon: '⭐', title: 'Opportunity Created', text: 'Real careers built, real lives changed' },
]

export default function HowItWorks() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center'],
  })
  const lineWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  return (
    <section className="section section--alt" id="how-it-works" ref={ref}>
      <div className="container">
        <div className="how-it-works__header">
          <motion.div
            className="section__label"
            style={{ justifyContent: 'center' }}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            The Discovery Loop
          </motion.div>
          <motion.h2
            className="section__title text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            How <span className="text-gradient">Footfrica</span> Works
          </motion.h2>
          <motion.p
            className="section__subtitle section__subtitle--center"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Fan engagement isn't a byproduct — it's the engine. Every interaction amplifies talent visibility.
          </motion.p>
        </div>

        <div className="how-it-works__steps">
          {/* Animated connecting line */}
          <div className="how-it-works__line">
            <motion.div
              className="how-it-works__line-fill"
              style={{ width: lineWidth }}
            />
          </div>

          {steps.map((step, i) => (
            <motion.div
              key={i}
              className="step"
              initial={{ opacity: 0, y: 40, scale: 0.8 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{
                duration: 0.5,
                delay: 0.4 + i * 0.15,
                type: 'spring',
                stiffness: 200,
                damping: 20,
              }}
            >
              <motion.div
                className="step__number"
                whileHover={{ scale: 1.15, borderColor: '#00C853' }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              >
                {step.icon}
              </motion.div>
              <h3 className="step__title">{step.title}</h3>
              <p className="step__text">{step.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
