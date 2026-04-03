import * as THREE from 'three'
import { render, events, extend } from '@react-three/fiber'
import { createRoot } from 'react-dom/client'
import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import './styles.css'
import App from './App'
import { LandingPage } from './LandingPage'
import { PortfolioPage } from './PortfolioPage'
import { BlogPage } from './BlogPage'
import { BlogPost } from './BlogPost'
import { NavBar } from './NavBar'
import './i18n'

extend(THREE)

window.addEventListener('resize', () =>
  render(<App />, document.querySelector('canvas'), {
    events,
    linear: true,
    dpr: Math.min(window.devicePixelRatio, 2),
    camera: { fov: 25, position: [0, 0, 6] },
    gl: (canvas) => new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    })
  })
)

window.dispatchEvent(new Event('resize'))

const COVER_DURATION = 480   // ms — overlay slides in (covers screen)
const REVEAL_DURATION = 700  // ms — overlay slides out (reveals new page)

function AnimatedRoutes({ theme }) {
  const location = useLocation()
  const navigate = useNavigate()
  
  const [displayLocation, setDisplayLocation] = useState(location)
  const [transition, setTransition] = useState(null) // null | 'covering' | 'revealing'
  
  // Custom navigation state for landing page sections
  const [landingSection, setLandingSection] = useState(null)
  const [landingExpanded, setLandingExpanded] = useState(location.pathname !== '/')
  const [isLandingManuallyExpanded, setIsLandingManuallyExpanded] = useState(false)
  
  // To avoid any flicker during route transitions, the NavBar should always be visible
  // UNLESS we are explicitly on the unexpanded home page ('/') and not transitioning.
  const showNav = location.pathname !== '/' || displayLocation.pathname !== '/' || isLandingManuallyExpanded || transition !== null

  useEffect(() => {
    // If the path changed, trigger the transition
    if (location.pathname !== displayLocation.pathname) {
      // Phase 1: overlay slides in
      setTransition('covering')

      const coverTimer = setTimeout(() => {
        // Phase 2: swap the rendered page while screen is covered
        setDisplayLocation(location)
        window.scrollTo(0, 0)
        
        // Phase 3: overlay slides out
        setTransition('revealing')

        const revealTimer = setTimeout(() => {
          setTransition(null)
        }, REVEAL_DURATION)
        
        return () => clearTimeout(revealTimer)
      }, COVER_DURATION)
      
      return () => clearTimeout(coverTimer)
    }
  }, [location, displayLocation.pathname])

  // Expose a custom navigation function to NavBar and LandingPage
  // that can handle hash sections (like /#about)
  const handleNavigate = (path, section = null) => {
    if (path === '/') {
      setLandingSection(section)
      setLandingExpanded(!!section)
      if (section) setIsLandingManuallyExpanded(true)
      navigate('/')
    } else {
      setIsLandingManuallyExpanded(false)
      navigate(path)
    }
  }

  // Listen for nav events from LandingPage (like the "View Project" button)
  useEffect(() => {
    const onNav = (e) => handleNavigate(e.detail)
    window.addEventListener('navigate', onNav)
    return () => window.removeEventListener('navigate', onNav)
  }, [navigate])

  // Show nav when LandingPage expands from clicking the logo
  useEffect(() => {
    const onExpand = () => setIsLandingManuallyExpanded(true)
    const onCollapse = () => setIsLandingManuallyExpanded(false)
    window.addEventListener('landing-expanded', onExpand)
    window.addEventListener('landing-collapsed', onCollapse)
    return () => {
      window.removeEventListener('landing-expanded', onExpand)
      window.removeEventListener('landing-collapsed', onCollapse)
    }
  }, [])

  return (
    <div className={`theme-${theme} ${showNav ? 'app-content-visible' : ''}`}>
      {showNav && (
        <NavBar
          onNavigate={handleNavigate}
          theme={theme}
        />
      )}

      <Routes location={displayLocation}>
        <Route path="/" element={
          <LandingPage
            key={landingSection || 'home'}
            initialExpanded={landingExpanded}
            initialSection={landingSection}
            theme={theme}
          />
        } />
        <Route path="/portfolio" element={<PortfolioPage theme={theme} />} />
        <Route path="/blog" element={<BlogPage onNavigate={handleNavigate} />} />
        <Route path="/blog/:slug" element={<BlogPostWrapper onNavigate={handleNavigate} />} />
      </Routes>

      {transition && (
        <div className={`page-blackout page-blackout--${transition}`} />
      )}
    </div>
  )
}

// Wrapper for BlogPost to extract params from React Router
import { useParams } from 'react-router-dom'
function BlogPostWrapper({ onNavigate }) {
  const { slug } = useParams()
  return <BlogPost slug={slug} onNavigate={onNavigate} />
}

function MainApp() {
  const [theme, setTheme] = useState('dark')
  
  // Toggle theme listener for NavBar
  useEffect(() => {
    const onToggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
    window.addEventListener('toggleTheme', onToggleTheme)
    return () => window.removeEventListener('toggleTheme', onToggleTheme)
  }, [])

  return (
    <BrowserRouter>
      <AnimatedRoutes theme={theme} />
    </BrowserRouter>
  )
}

const landingRoot = document.createElement('div')
landingRoot.id = 'landing-root'
document.body.appendChild(landingRoot)
createRoot(landingRoot).render(<MainApp />)
