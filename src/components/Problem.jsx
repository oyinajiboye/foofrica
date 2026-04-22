import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const problems = [
  { icon: '👤', title: 'Players Are Unseen', text: 'Talented grassroots players rely on local tournaments and "who you know" — with no structured path to visibility.' },
  { icon: '🔍', title: 'Scouts Struggle', text: 'No central database exists. Scouting is travel-dependent, expensive, and plagued by fake profiles and agents.' },
  { icon: '📱', title: 'Fans Are Scattered', text: '500M+ African football fans are scattered across generic social platforms with no football-first community.' },
  { icon: '⚠️', title: 'Trust Is Broken', text: 'Fake highlights, exaggerated stats, and fraudulent intermediaries make the system unreliable for everyone.' },
]

export default function Problem() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="section section--alt" id="problem" ref={ref}>
      <div className="container">
        <div className="problem__grid">
          <motion.div
            className="problem__image-wrapper"
            initial={{ opacity: 0, x: -80 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <img
              src="https://images.unsplash.com/photo-1722978687695-212eecfa4cbe?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Young African football players on a dusty pitch"
              className="problem__image"
              loading="lazy"
            />
            <div className="problem__image-overlay" />
          </motion.div>

          <div>
            <motion.div
              className="section__label"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              The Broken System
            </motion.div>

            <motion.h2
              className="section__title"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Millions of Talented Players<br />
              <span className="text-gradient">Remain Invisible</span>
            </motion.h2>

            <motion.p
              className="section__subtitle"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Africa produces world-class football talent, but fragmented, offline, and trust-deficient discovery processes leave millions unseen.
            </motion.p>

            <div className="problem__cards">
              {problems.map((p, i) => (
                <motion.div
                  key={i}
                  className="problem__card"
                  initial={{ opacity: 0, x: -60 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{
                    duration: 0.5,
                    delay: 0.4 + i * 0.12,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <div className="problem__card-icon">{p.icon}</div>
                  <div>
                    <div className="problem__card-title">{p.title}</div>
                    <div className="problem__card-text">{p.text}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
