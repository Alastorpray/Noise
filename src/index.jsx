import * as THREE from 'three'
import { render, events, extend } from '@react-three/fiber'
import { createRoot } from 'react-dom/client'
import { useState, useEffect, useCallback } from 'react'
import './styles.css'
import App from './App'
import { LandingPage } from './LandingPage'
import { PortfolioPage } from './PortfolioPage'
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

function LandingRouter() {
  const [route, setRoute] = useState(window.location.pathname)
  const [landingSection, setLandingSection] = useState(null)
  const [landingExpanded, setLandingExpanded] = useState(false)
  const [theme, setTheme] = useState('dark')
  const [showNav, setShowNav] = useState(false)

  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))

  const navigate = useCallback((path) => {
    window.history.pushState({}, '', path)
    setRoute(path)
    window.scrollTo(0, 0)
  }, [])

  const handleNavigate = useCallback((path, section) => {
    if (path === '/portfolio') {
      navigate('/portfolio')
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
      if (path === '/') {
        setLandingSection(null)
        setLandingExpanded(false)
        setShowNav(false)
      } else if (path === '/portfolio') {
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

      {route === '/portfolio' ? (
        <PortfolioPage theme={theme} />
      ) : (
        <LandingPage
          key={landingSection || 'home'}
          initialExpanded={landingExpanded}
          initialSection={landingSection}
          theme={theme}
        />
      )}
    </div>
  )
}

const landingRoot = document.createElement('div')
landingRoot.id = 'landing-root'
document.body.appendChild(landingRoot)
createRoot(landingRoot).render(<LandingRouter />)
