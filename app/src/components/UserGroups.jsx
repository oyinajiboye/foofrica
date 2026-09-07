import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const users = [
  { icon: '⚡', title: 'Players', text: 'Build your digital football CV with videos, stats, career history, and verified endorsements.', image: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=500&q=80&fit=crop', alt: 'Football player in action' },
  { icon: '🏟️', title: 'Clubs & Academies', text: 'Manage squads, verify players, post trials, and showcase your talent pipeline.', image: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=500&q=80&fit=crop', alt: 'Football club stadium' },
  { icon: '🔎', title: 'Scouts & Agents', text: 'Advanced filters, video evaluation, private shortlists, and direct player messaging.', image: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=500&q=80&fit=crop', alt: 'Scout watching from the stands' },
  { icon: '📋', title: 'Coaches', text: 'Endorse players, create tactical content, and build credibility as a validator.', image: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=500&q=80&fit=crop', alt: 'Football coach on the pitch' },
  { icon: '🔥', title: 'Fans', text: 'Match threads, debates, polls, communities, and grassroots talent discovery.', image: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=500&q=80&fit=crop', alt: 'Football fans cheering in the stands' },
]

export default function UserGroups() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="section section--alt" id="users" ref={ref}>
      <div className="container">
        <div className="users__header">
          <motion.div
            className="section__label"
            style={{ justifyContent: 'center' }}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            Who It's For
          </motion.div>
          <motion.h2
            className="section__title text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Built for <span className="text-gradient">Everyone</span> in Football
          </motion.h2>
          <motion.p
            className="section__subtitle section__subtitle--center"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Five user groups, one interconnected ecosystem — each powering the others.
          </motion.p>
        </div>

        <div className="users__grid">
          {users.map((user, i) => (
            <motion.div
              key={i}
              className="users__card"
              initial={{ opacity: 0, scale: 0 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{
                duration: 0.5,
                delay: 0.3 + i * 0.1,
                type: 'spring',
                stiffness: 200,
                damping: 15,
              }}
            >
              <img src={user.image} alt={user.alt} className="users__card-image" loading="lazy" />
              <div className="users__card-overlay">
                <span className="users__card-icon">{user.icon}</span>
                <h3 className="users__card-title">{user.title}</h3>
                <p className="users__card-text">{user.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
