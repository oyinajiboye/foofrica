import UploadHighlightPage from './pages/UploadHighlightPage'
import { useState, useCallback } from 'react'
import { Navigate, BrowserRouter, Routes, Route } from 'react-router-dom'
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
import RecoveryPage from './pages/onboarding/RecoveryPage'
import DirectoryPage from './pages/DirectoryPage'
import RecruitmentPage from './pages/RecruitmentPage'
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
          <Route path="/admin" element={<ProtectedRoute><Navigate to="/moderation" replace /></ProtectedRoute>} />

          {/* Auth */}
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />

          {['forgot-password','reset-password','auth/callback'].map(path=><Route key={path} path={'/'+path} element={<RecoveryPage key={path}/>}/>)}
          {/* Onboarding flow */}
          <Route path="/onboard/user-type" element={<ProtectedRoute onboarding><OnboardUserType /></ProtectedRoute>} />
          <Route path="/onboard/identity" element={<ProtectedRoute onboarding><OnboardIdentity /></ProtectedRoute>} />
          <Route path="/onboard/interests" element={<ProtectedRoute onboarding><OnboardInterests /></ProtectedRoute>} />
          <Route path="/onboard/complete" element={<ProtectedRoute onboarding><OnboardComplete /></ProtectedRoute>} />

          {['opportunities','applications','verification','compare','cv','analytics','squad','alerts','safety','saved','moderation'].map(path => <Route key={path} path={'/'+path} element={<ProtectedRoute roles={['applications','squad'].includes(path) ? ['player','club'] : path === 'cv' ? ['player'] : undefined}><RecruitmentPage key={path}/></ProtectedRoute>}/>)}
          <Route path='/upload-highlight' element={<ProtectedRoute><UploadHighlightPage/></ProtectedRoute>}/>
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
          <Route path="/clubs" element={<ProtectedRoute><DirectoryPage key="club" role="club" /></ProtectedRoute>} />
          <Route path="/clubs/:id" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/scouts" element={<ProtectedRoute><DirectoryPage key="scout" role="scout" /></ProtectedRoute>} />
          <Route path="/scouts/watchlist" element={<ProtectedRoute roles={['scout']}><ScoutWatchlistPage /></ProtectedRoute>} />
          <Route path="/coaches" element={<ProtectedRoute><DirectoryPage key="coach" role="coach" /></ProtectedRoute>} />
          <Route path="/discover" element={<ProtectedRoute><DiscoverPage /></ProtectedRoute>} />
          <Route path="/players" element={<ProtectedRoute><DirectoryPage key="player" role="player" /></ProtectedRoute>} />
          <Route path="/post/:id" element={<ProtectedRoute><SinglePostPage /></ProtectedRoute>} />
        <Route path="*" element={<div style={{padding: 40}}><h1>Page not found</h1><a href="/feed">Go to your feed</a></div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
