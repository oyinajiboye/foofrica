import { useState, useCallback } from 'react'
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
import MarketStats from './components/MarketStats'
import Waitlist from './components/Waitlist'
import Footer from './components/Footer'

export default function App() {
  const [loaded, setLoaded] = useState(false)

  const handleLoadComplete = useCallback(() => {
    setLoaded(true)
  }, [])

  return (
    <>
      {/* Page load sequence */}
      {!loaded && <PageLoader onComplete={handleLoadComplete} />}

      {/* Custom football cursor (desktop only) */}
      <CustomCursor />

      {/* Scroll progress bar + side dots */}
      <ScrollProgress />

      {/* Scrolling football that bounces down the page */}
      <ScrollingBall />

      {/* Navigation */}
      <Navbar />

      {/* Page sections */}
      <main>
        <Hero />
        <Problem />
        <Solution />
        <UserGroups />
        <Features />
        <HowItWorks />
        <MarketStats />
        <Waitlist />
      </main>

      <Footer />
    </>
  )
}
