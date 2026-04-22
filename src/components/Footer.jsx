export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__info" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <a href="#" className="footer__logo" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
            <span>⚽</span>
            <span>Footfrica</span>
          </a>
          <span className="footer__tagline">Democratizing football opportunity in Africa</span>
        </div>

        <span className="footer__copy">© 2026 Footfrica. All rights reserved.</span>

        <div className="footer__socials">
          <a href="#" className="footer__social-link" aria-label="Twitter" title="Twitter">𝕏</a>
          <a href="#" className="footer__social-link" aria-label="Instagram" title="Instagram">📷</a>
          <a href="#" className="footer__social-link" aria-label="LinkedIn" title="LinkedIn">in</a>
        </div>
      </div>
    </footer>
  )
}
