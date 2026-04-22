import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

// ⚠️ REPLACE with your Google Apps Script Web App URL
const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE'

export default function Waitlist() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!name.trim() || !email.trim() || !role) {
      setError('Please fill in all fields.')
      return
    }
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          role,
          timestamp: new Date().toISOString(),
        }),
      })
      setSuccess(true)
    } catch (err) {
      console.error('Waitlist error:', err)
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const handleButtonRipple = (e) => {
    const btn = e.currentTarget
    const ripple = document.createElement('span')
    const rect = btn.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    ripple.style.width = ripple.style.height = size + 'px'
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px'
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px'
    ripple.className = 'btn-ripple'
    btn.appendChild(ripple)
    setTimeout(() => ripple.remove(), 600)
  }

  return (
    <section className="section section--alt" id="waitlist" ref={ref}>
      <div className="waitlist__bg">
        <img
          src="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1800&q=80&fit=crop"
          alt="Football stadium aerial view"
          className="waitlist__bg-image"
          loading="lazy"
        />
        <div className="waitlist__bg-overlay" />
      </div>

      <div className="container">
        <div className="waitlist__content">
          <motion.div
            className="section__label"
            style={{ justifyContent: 'center' }}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            Be First In
          </motion.div>

          <motion.h2
            className="waitlist__title"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Ready to Change<br /><span className="text-gradient">African Football?</span>
          </motion.h2>

          <motion.p
            className="waitlist__subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Join the waitlist and be the first to access Footfrica when we launch. Whether you're a player, scout, club, coach, or fan — your spot matters.
          </motion.p>

          {!success ? (
            <motion.form
              className="waitlist__form"
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.6,
                delay: 0.3,
                type: 'spring',
                stiffness: 100,
                damping: 15,
              }}
            >
              <motion.div
                className="form-group"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <input
                  type="text"
                  className="form-group__input"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </motion.div>

              <motion.div
                className="form-group"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                <input
                  type="email"
                  className="form-group__input"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </motion.div>

              <motion.div
                className="form-group"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.6 }}
              >
                <select
                  className="form-group__select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                >
                  <option value="" disabled>I am a...</option>
                  <option value="Player">⚡ Player</option>
                  <option value="Club / Academy">🏟️ Club / Academy</option>
                  <option value="Scout / Agent">🔎 Scout / Agent</option>
                  <option value="Coach">📋 Coach</option>
                  <option value="Fan">🔥 Fan</option>
                </select>
              </motion.div>

              <motion.button
                type="submit"
                className={`btn btn--primary waitlist__btn ${loading ? 'loading' : ''}`}
                disabled={loading}
                onClick={handleButtonRipple}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.7 }}
              >
                <span className="btn-text">Join the Waitlist →</span>
                <span className="btn-loader"><span className="spinner" /></span>
              </motion.button>

              {error && (
                <motion.div
                  className="waitlist__error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {error}
                </motion.div>
              )}
            </motion.form>
          ) : (
            <motion.div
              className="waitlist__success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <motion.span
                className="waitlist__success-icon"
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                🎉
              </motion.span>
              <h3 className="waitlist__success-title">You're on the list!</h3>
              <p className="waitlist__success-text">We'll notify you as soon as Footfrica launches. Get ready to change the game.</p>
            </motion.div>
          )}

          <motion.p
            className="waitlist__count"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            Join <strong>early supporters</strong> already on the waitlist
          </motion.p>
        </div>
      </div>
    </section>
  )
}
