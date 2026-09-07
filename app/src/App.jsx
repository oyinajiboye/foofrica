import { useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Existing landing page components
import Navbar from './components/Navbar'
import CustomCursor from './components/CustomCursor'
import ScrollingBall from './components/ScrollingBall'
import ScrollProgress from './components/ScrollProgress'
import PageLoader from './components/PageLoader'
import Hero from './components/Hero'
import Problem from './components/Problem'
import Solution from './components/Solution'
import UserGroups from './components/UserGroups'
import Features from './components/Features'
import HowItWorks from './components/HowItWorks'
import Spotlight from './components/Spotlight'
import MarketStats from './components/MarketStats'
import Waitlist from './components/Waitlist'
import Footer from './components/Footer'
import Admin from './pages/Admin'

// Onboarding pages
import WelcomePage from './pages/onboarding/WelcomePage'
import RegisterPage from './pages/onboarding/RegisterPage'
import LoginPage from './pages/onboarding/LoginPage'
import OnboardUserType from './pages/onboarding/OnboardUserType'
import OnboardIdentity from './pages/onboarding/OnboardIdentity'
import OnboardInterests from './pages/onboarding/OnboardInterests'
import OnboardComplete from './pages/onboarding/OnboardComplete'

// Main App Pages
import FeedPage from './pages/FeedPage'
import HighlightsPage from './pages/HighlightsPage'
import MessagesPage from './pages/MessagesPage'
import NotificationsPage from './pages/NotificationsPage'
import ProfilePage from './pages/ProfilePage'
import SearchPage from './pages/SearchPage'
import SettingsPage from './pages/SettingsPage'

// Newly Designed & Built Dedicated Pages
import ClubPage from './pages/ClubPage'
import ScoutWatchlistPage from './pages/ScoutWatchlistPage'
import DiscoverPage from './pages/DiscoverPage'
import SinglePostPage from './pages/SinglePostPage'

function LandingPage() {
  const [loaded, setLoaded] = useState(false)

  const handleLoadComplete = useCallback(() => {
    setLoaded(true)
  }, [])

  return (
    <>
      {!loaded && <PageLoader onComplete={handleLoadComplete} />}
      <CustomCursor />
      <ScrollProgress />
      <ScrollingBall />
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <UserGroups />
        <Features />
        <HowItWorks />
        <Spotlight />
        <MarketStats />
        <Waitlist />
      </main>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Marketing landing page */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin" element={<Admin />} />

          {/* Auth */}
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Onboarding flow */}
          <Route path="/onboard/user-type" element={<OnboardUserType />} />
          <Route path="/onboard/identity" element={<OnboardIdentity />} />
          <Route path="/onboard/interests" element={<OnboardInterests />} />
          <Route path="/onboard/complete" element={<OnboardComplete />} />

          {/* Main App Routes */}
          <Route path="/feed" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
          <Route path="/highlights" element={<ProtectedRoute><HighlightsPage /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/profile/:username" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

          {/* Newly Added Dedicated Views */}
          <Route path="/clubs" element={<ProtectedRoute><ClubPage /></ProtectedRoute>} />
          <Route path="/clubs/:id" element={<ProtectedRoute><ClubPage /></ProtectedRoute>} />
          <Route path="/scouts" element={<ProtectedRoute><ScoutWatchlistPage /></ProtectedRoute>} />
          <Route path="/scouts/watchlist" element={<ProtectedRoute><ScoutWatchlistPage /></ProtectedRoute>} />
          <Route path="/discover" element={<ProtectedRoute><DiscoverPage /></ProtectedRoute>} />
          <Route path="/players" element={<ProtectedRoute><DiscoverPage /></ProtectedRoute>} />
          <Route path="/post/:id" element={<ProtectedRoute><SinglePostPage /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
