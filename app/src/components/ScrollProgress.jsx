import { motion } from 'framer-motion'
import { useScrollProgress } from '../hooks/useScrollProgress'

const sections = [
  { id: 'hero', label: 'Hero' },
  { id: 'problem', label: 'Problem' },
  { id: 'solution', label: 'Solution' },
  { id: 'users', label: 'Users' },
  { id: 'features', label: 'Features' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'market', label: 'Market' },
  { id: 'waitlist', label: 'Waitlist' },
]

export default function ScrollProgress() {
  const progress = useScrollProgress()

  const handleDotClick = (sectionId) => {
    const el = document.getElementById(sectionId)
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  return (
    <>
      {/* Top progress bar */}
      <div className="scroll-progress">
        <motion.div
          className="scroll-progress__bar"
          style={{ scaleX: progress }}
        />
      </div>

      {/* Side dots */}
      <nav className="scroll-dots" aria-label="Section navigation">
        {sections.map((section, i) => {
          const sectionStart = i / sections.length
          const sectionEnd = (i + 1) / sections.length
          const isActive = progress >= sectionStart && progress < sectionEnd
          return (
            <button
              key={section.id}
              className={`scroll-dot ${isActive ? 'active' : ''}`}
              title={section.label}
              onClick={() => handleDotClick(section.id)}
              aria-label={`Navigate to ${section.label}`}
            />
          )
        })}
      </nav>
    </>
  )
}
