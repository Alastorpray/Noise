import * as THREE from 'three'
import { render, events, extend } from '@react-three/fiber'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom'
import './styles.css'
import App from './App'
import { LandingPage } from './LandingPage'
import { PortfolioPage } from './PortfolioPage'
import { PortfolioPost } from './PortfolioPost'
import { BlogPage } from './BlogPage'
import { BlogPost } from './BlogPost'
import { NavBar } from './NavBar'
import { LenisProvider } from './LenisProvider'
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

const COVER_DURATION = 500   // ms — overlay fades in (covers screen)
const REVEAL_DURATION = 500  // ms — overlay fades out (reveals new page)

function AnimatedRoutes({ theme, onToggleTheme }) {
  const location = useLocation()
  const navigate = useNavigate()
  
  const [displayLocation, setDisplayLocation] = useState(location)
  const [transition, setTransition] = useState(null) // null | 'covering' | 'revealing'
  
  // Custom navigation state for landing page sections
  const [landingSection, setLandingSection] = useState(null)
  const [landingExpanded, setLandingExpanded] = useState(location.pathname !== '/')
  
  // We ALWAYS render the NavBar, but we control its visibility via CSS classes.
  // This completely eliminates any React unmounting flicker during route transitions.
  const [isNavVisible, setIsNavVisible] = useState(location.pathname !== '/')

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
      if (!section) setIsNavVisible(false) // Hide only if going to pure home
      navigate('/')
    } else {
      setIsNavVisible(true) // Always show nav when going to other pages
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
    const onExpand = () => setIsNavVisible(true)
    const onCollapse = () => setIsNavVisible(false)
    window.addEventListener('landing-expanded', onExpand)
    window.addEventListener('landing-collapsed', onCollapse)
    return () => {
      window.removeEventListener('landing-expanded', onExpand)
      window.removeEventListener('landing-collapsed', onCollapse)
    }
  }, [])

  return (
    <div className={`theme-${theme} ${isNavVisible ? 'app-content-visible' : ''}`}>
      {/* We always render NavBar, visibility is handled by CSS to prevent unmounting flicker */}
      <div style={{ opacity: isNavVisible ? 1 : 0, pointerEvents: isNavVisible ? 'auto' : 'none', transition: 'opacity 0.3s ease' }}>
        <NavBar
          onNavigate={handleNavigate}
          theme={theme}
          onToggleTheme={onToggleTheme}
        />
      </div>

      <Routes location={displayLocation}>
        <Route path="/" element={
          <LandingPage
            key={landingSection || 'home'}
            initialExpanded={landingExpanded}
            initialSection={landingSection}
            theme={theme}
          />
        } />
        <Route path="/portfolio" element={<PortfolioPage theme={theme} onNavigate={handleNavigate} />} />
        <Route path="/portfolio/:slug" element={<PortfolioPostWrapper onNavigate={handleNavigate} />} />
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
function BlogPostWrapper({ onNavigate }) {
  const { slug } = useParams()
  return <BlogPost slug={slug} onNavigate={onNavigate} />
}

// Wrapper for PortfolioPost
function PortfolioPostWrapper({ onNavigate }) {
  const { slug } = useParams()
  return <PortfolioPost slug={slug} onNavigate={onNavigate} />
}

function MainApp() {
  const [theme, setTheme] = useState('dark')
  
  const toggleTheme = () => {
    if (!document.startViewTransition) {
      setTheme(prev => prev === 'dark' ? 'light' : 'dark')
      return
    }
    document.startViewTransition(() => {
      flushSync(() => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark')
      })
    })
  }

  return (
    <BrowserRouter>
      <LenisProvider>
        <AnimatedRoutes theme={theme} onToggleTheme={toggleTheme} />
      </LenisProvider>
    </BrowserRouter>
  )
}

const landingRoot = document.createElement('div')
landingRoot.id = 'landing-root'
document.body.appendChild(landingRoot)
createRoot(landingRoot).render(<MainApp />)
