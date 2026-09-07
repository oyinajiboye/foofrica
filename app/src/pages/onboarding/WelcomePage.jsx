import { useNavigate } from 'react-router-dom'
import '../../styles/auth.css'

// ─── SVG Icons ───────────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
)

// ─── Preview Cards (right side of landing) ───────────────────────────────────
function PreviewCards() {
  return (
    <div className="welcome-right">
      <div className="preview-card" style={{ transform: 'rotate(-3deg)' }}>
        <div className="preview-card-image">
          <img
            src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&q=80"
            alt="Player highlight"
            onError={e => { e.target.style.background = '#2D9E48' }}
          />
        </div>
        <div className="preview-card-footer">
          <div className="preview-card-name">Tunde Adebayo</div>
          <div className="preview-card-role">Winger · Lagos</div>
        </div>
      </div>

      <div className="preview-card-small" style={{ transform: 'rotate(-2deg)', marginTop: '-12px', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: '#1A7A2E', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: 'white', fontSize: 16, flexShrink: 0
          }}>⚽</div>
          <div style={{ flex: 1 }}>
            <div className="preview-card-title">Player Highlight Reel</div>
            <div className="preview-card-meta">2.5k views · 128 likes</div>
            <div className="preview-card-bar">
              <div className="preview-card-bar-fill" />
            </div>
          </div>
        </div>
      </div>

      <div className="preview-post-card" style={{ transform: 'rotate(-1deg)', marginTop: '-8px', zIndex: 2 }}>
        <div className="preview-post-text">
          <span>@CoachMusa</span>: Nigeria's U20 talent pool is incredible this season!
          These young players are the future.
        </div>
        <div className="preview-post-stats">
          <span>24 likes</span>
          <span>12 comments</span>
          <span>5 reposts</span>
        </div>
      </div>
    </div>
  )
}

// ─── FootfricaLogo ────────────────────────────────────────────────────────────
export function FootfricaLogo({ size = 40 }) {
  return (
    <img src="/logo-landscape-color.png" alt="Footfrica" style={{ height: size, objectFit: 'contain' }} />
  )
}

// ─── Welcome / Landing Screen ─────────────────────────────────────────────────
export default function WelcomePage() {
  const navigate = useNavigate()

  return (
    <div className="auth-layout">
      <div className="welcome-screen">
        {/* ── Left column ── */}
        <div className="welcome-left">
          <div className="welcome-logo">
            <FootfricaLogo size={44} />
          </div>

          <h1 className="welcome-headline">
            Africa's football network starts here.
          </h1>

          <p className="welcome-subtext">
            Build your football identity, discover talent, and join the
            conversation around the game.
          </p>

          <div className="welcome-actions">
            <button
              className="btn btn-primary"
              onClick={() => navigate('/register')}
              id="welcome-create-account"
            >
              Create account
            </button>
            <button
              className="btn btn-outline-green"
              onClick={() => navigate('/login')}
              id="welcome-login"
            >
              Log in
            </button>
          </div>

          <div className="welcome-divider">or continue with</div>

          <div className="welcome-social">
            <button
              className="btn btn-outline btn-social"
              id="welcome-google"
              onClick={() => alert('Google OAuth — coming soon')}
            >
              <GoogleIcon />
              Google
            </button>
            <button
              className="btn btn-dark btn-social"
              id="welcome-apple"
              onClick={() => alert('Apple OAuth — coming soon')}
            >
              <AppleIcon />
              Apple
            </button>
          </div>
        </div>

        {/* ── Right column — preview cards ── */}
        <PreviewCards />
      </div>
    </div>
  )
}
