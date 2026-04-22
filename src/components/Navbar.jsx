import { useState, useEffect } from 'react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollTo = (id) => {
    setMobileOpen(false)
    const el = document.getElementById(id)
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} id="navbar">
      <div className="container navbar__inner">
        <a href="#" className="navbar__logo" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
          <span>⚽</span>
          <span>Footfrica</span>
        </a>

        <ul className={`navbar__links ${mobileOpen ? 'open' : ''}`} id="nav-links">
          <li><a href="#problem" className="navbar__link" onClick={(e) => { e.preventDefault(); scrollTo('problem') }}>Problem</a></li>
          <li><a href="#solution" className="navbar__link" onClick={(e) => { e.preventDefault(); scrollTo('solution') }}>Solution</a></li>
          <li><a href="#features" className="navbar__link" onClick={(e) => { e.preventDefault(); scrollTo('features') }}>Features</a></li>
          <li><a href="#how-it-works" className="navbar__link" onClick={(e) => { e.preventDefault(); scrollTo('how-it-works') }}>How It Works</a></li>
          <li><a href="#waitlist" className="navbar__cta" onClick={(e) => { e.preventDefault(); scrollTo('waitlist') }}>Join Waitlist →</a></li>
        </ul>

        <button
          className={`navbar__mobile-toggle ${mobileOpen ? 'active' : ''}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </div>
    </nav>
  )
}
