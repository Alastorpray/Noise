import * as THREE from 'three'
import { render, events, extend } from '@react-three/fiber'
import { createRoot } from 'react-dom/client'
import { useState, useEffect, useCallback, useRef } from 'react'
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

function LandingRouter() {
  const [route, setRoute] = useState(window.location.pathname)
  const [displayRoute, setDisplayRoute] = useState(window.location.pathname)
  const [landingSection, setLandingSection] = useState(null)
  
  // Automatically show the navigation bar if the initial URL is not the root ('/')
  const [landingExpanded, setLandingExpanded] = useState(window.location.pathname !== '/')
  const [showNav, setShowNav] = useState(window.location.pathname !== '/')
  
  const [theme, setTheme] = useState('dark')
  const [transition, setTransition] = useState(null) // null | 'covering' | 'revealing'
  const pendingNav = useRef(null)

  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))

  const navigate = useCallback((path) => {
    // If already on the same route, skip transition
    if (path === window.location.pathname) return

    window.history.pushState({}, '', path)
    setRoute(path)
    pendingNav.current = path

    // Phase 1: overlay slides in and covers the screen
    setTransition('covering')

    setTimeout(() => {
      // Phase 2: swap the rendered page while screen is covered
      setDisplayRoute(path)
      window.scrollTo(0, 0)

      // Phase 3: overlay slides out to reveal the new page
      setTransition('revealing')

      setTimeout(() => {
        setTransition(null)
      }, REVEAL_DURATION)
    }, COVER_DURATION)
  }, [])

  const handleNavigate = useCallback((path, section) => {
    if (path.startsWith('/portfolio') || path.startsWith('/blog')) {
      navigate(path)
      setShowNav(true)
    } else {
      setLandingSection(section || null)
      setLandingExpanded(!!section)
      navigate('/')
      if (!section) setShowNav(false)
    }
  }, [navigate])

  // Listen for nav events from LandingPage (portfolio link)
  useEffect(() => {
    const onNav = (e) => handleNavigate(e.detail)
    window.addEventListener('navigate', onNav)
    return () => window.removeEventListener('navigate', onNav)
  }, [handleNavigate])

  // Browser back/forward
  useEffect(() => {
    const onPop = () => {
      const path = window.location.pathname
      setRoute(path)
      setDisplayRoute(path)
      if (path === '/') {
        setLandingSection(null)
        setLandingExpanded(false)
        setShowNav(false)
      } else if (path.startsWith('/portfolio') || path.startsWith('/blog')) {
        setShowNav(true)
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // Show nav when LandingPage expands
  useEffect(() => {
    const onExpand = () => setShowNav(true)
    const onCollapse = () => setShowNav(false)
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
          route={route}
          onNavigate={handleNavigate}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {displayRoute === '/portfolio' ? (
        <PortfolioPage theme={theme} />
      ) : displayRoute === '/blog' ? (
        <BlogPage onNavigate={navigate} />
      ) : displayRoute.startsWith('/blog/') ? (
        <BlogPost slug={displayRoute.split('/blog/')[1]} onNavigate={navigate} />
      ) : (
        <LandingPage
          key={landingSection || 'home'}
          initialExpanded={landingExpanded}
          initialSection={landingSection}
          theme={theme}
        />
      )}

      {transition && (
        <div className={`page-blackout page-blackout--${transition}`} />
      )}
    </div>
  )
}


const landingRoot = document.createElement('div')
landingRoot.id = 'landing-root'
document.body.appendChild(landingRoot)
createRoot(landingRoot).render(<LandingRouter />)
