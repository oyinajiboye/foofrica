import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_SCRIPT_URL' // Same URL as waitlist, handles spotlight too

export default function Spotlight() {
  const [player, setPlayer] = useState(null)
  const [loading, setLoading] = useState(true)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  useEffect(() => {
    fetchSpotlight()
  }, [])

  const fetchSpotlight = async () => {
    try {
      const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=getSpotlight`)
      const data = await res.json()
      if (data && data.name) {
        setPlayer(data)
      }
    } catch (err) {
      console.log('Spotlight fetch error:', err)
      // Fallback demo data
      setPlayer({
        name: 'Rashidi Yekini',
        nickname: 'The Goalsfather',
        position: 'Striker',
        nationality: 'Nigeria',
        era: '1984–2004',
        clubs: 'Shooting Stars, Vitória de Setúbal, Olympiacos, FC Zürich',
        achievements: 'Africa\'s all-time great goalscorer. First Nigerian to score at a FIFA World Cup (USA 1994). African Footballer of the Year 1993.',
        quote: '"Football gave me everything. I want African football to give the next generation even more."',
        bio: 'Rashidi Yekini remains one of Africa\'s most iconic footballers. His thunderous strikes and raw passion on the pitch inspired an entire generation of Nigerian and African players. His emotional celebration after scoring Nigeria\'s first-ever World Cup goal against Bulgaria in 1994 became one of the most powerful images in African football history.',
        imageUrl: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80&fit=crop',
        stats: { goals: '37', caps: '58', trophies: '12' }
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="section section--alt" id="spotlight">
        <div className="container text-center">
          <div className="spotlight__loading">
            <div className="spinner" style={{ borderTopColor: 'var(--color-accent)' }} />
            <p style={{ color: 'var(--color-text-muted)', marginTop: '1rem' }}>Loading spotlight...</p>
          </div>
        </div>
      </section>
    )
  }

  if (!player) return null

  return (
    <section className="section section--alt" id="spotlight" ref={ref}>
      <div className="container">
        {/* Section header */}
        <motion.div
          className="spotlight__header text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="section__label">🌟 Player Spotlight</span>
          <h2 className="section__title">
            Legends of <span className="text-gradient">African Football</span>
          </h2>
          <p className="section__subtitle section__subtitle--center">
            Every week, we celebrate the icons who shaped the beautiful game across the continent.
          </p>
        </motion.div>

        {/* Spotlight card */}
        <motion.div
          className="spotlight__card"
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Player image side */}
          <div className="spotlight__image-wrapper">
            <img
              src={player.imageUrl}
              alt={player.name}
              className="spotlight__image"
              loading="lazy"
            />
            <div className="spotlight__image-overlay" />
            <div className="spotlight__image-badge">
              <span className="spotlight__badge-icon">⭐</span>
              <span>Weekly Spotlight</span>
            </div>
          </div>

          {/* Player info side */}
          <div className="spotlight__info">
            <div className="spotlight__name-block">
              <h3 className="spotlight__name">{player.name}</h3>
              {player.nickname && (
                <span className="spotlight__nickname">"{player.nickname}"</span>
              )}
            </div>

            <div className="spotlight__meta">
              <div className="spotlight__meta-item">
                <span className="spotlight__meta-label">Position</span>
                <span className="spotlight__meta-value">{player.position}</span>
              </div>
              <div className="spotlight__meta-item">
                <span className="spotlight__meta-label">Nationality</span>
                <span className="spotlight__meta-value">{player.nationality}</span>
              </div>
              <div className="spotlight__meta-item">
                <span className="spotlight__meta-label">Era</span>
                <span className="spotlight__meta-value">{player.era}</span>
              </div>
            </div>

            {player.clubs && (
              <div className="spotlight__clubs">
                <span className="spotlight__clubs-label">Notable Clubs</span>
                <p className="spotlight__clubs-list">{player.clubs}</p>
              </div>
            )}

            {player.achievements && (
              <div className="spotlight__achievements">
                <span className="spotlight__achievements-label">🏆 Key Achievements</span>
                <p className="spotlight__achievements-text">{player.achievements}</p>
              </div>
            )}

            {player.bio && (
              <p className="spotlight__bio">{player.bio}</p>
            )}

            {player.quote && (
              <blockquote className="spotlight__quote">
                {player.quote}
              </blockquote>
            )}

            {player.stats && (
              <div className="spotlight__stats">
                <div className="spotlight__stat">
                  <span className="spotlight__stat-value">{player.stats.goals}</span>
                  <span className="spotlight__stat-label">Goals</span>
                </div>
                <div className="spotlight__stat">
                  <span className="spotlight__stat-value">{player.stats.caps}</span>
                  <span className="spotlight__stat-label">Int'l Caps</span>
                </div>
                <div className="spotlight__stat">
                  <span className="spotlight__stat-value">{player.stats.trophies}</span>
                  <span className="spotlight__stat-label">Trophies</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
