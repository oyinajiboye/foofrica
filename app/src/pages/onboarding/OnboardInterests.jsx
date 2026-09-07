import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StepBar } from './OnboardUserType'
import '../../styles/auth.css'

const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const INTERESTS = [
  'Grassroots football',
  'Nigerian football',
  'African talent',
  'European football',
  'Tactical analysis',
  'Match debates',
  'Trials and opportunities',
  'Player highlights',
  'Club updates',
  'Scouting reports',
  'Transfer news',
  'Youth development',
]

export default function OnboardInterestsPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(['Grassroots football'])

  const toggle = (interest) => {
    setSelected(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    )
  }

  const handleContinue = () => {
    if (selected.length === 0) return
    sessionStorage.setItem('ff_onboard_interests', JSON.stringify(selected))
    navigate('/onboard/complete')
  }

  return (
    <div className="auth-layout">
      <div className="auth-topbar">
        <button className="auth-back-btn" onClick={() => navigate('/onboard/identity')} id="interests-back">
          <BackIcon /> Back
        </button>
      </div>

      <div className="auth-form-screen">
        <div className="auth-form-card">
          <StepBar current={3} total={5} />

          <h1 className="auth-form-title">
            What kind of football do you want to see?
          </h1>
          <p className="auth-form-subtitle">
            Pick a few topics to shape your feed.
          </p>

          <div className="interests-grid">
            {INTERESTS.map(interest => (
              <button
                key={interest}
                type="button"
                className={`interest-pill ${selected.includes(interest) ? 'selected' : ''}`}
                onClick={() => toggle(interest)}
                id={`interest-${interest.replace(/\s+/g, '-').toLowerCase()}`}
              >
                {selected.includes(interest) && <CheckIcon />}
                {interest}
              </button>
            ))}
          </div>

          <button
            className="btn btn-primary"
            disabled={selected.length === 0}
            onClick={handleContinue}
            id="interests-continue"
          >
            Continue
          </button>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => navigate('/onboard/complete')}
              style={{ fontSize: 14 }}
              id="interests-skip"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
