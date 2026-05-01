import * as THREE from 'three'
import { render, events, extend } from '@react-three/fiber'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate, useParams, Navigate } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import './styles.css'
import App from './App'
import { LandingPage } from './LandingPage'
import { PortfolioPage } from './PortfolioPage'
import { PortfolioPost } from './PortfolioPost'
import { BlogPage } from './BlogPage'
import { BlogPost } from './BlogPost'
import { NavBar } from './NavBar'
import { LenisProvider } from './LenisProvider'
import i18n from './i18n'

export const SUPPORTED_LANGS = ['en', 'es', 'de']
export const DEFAULT_LANG = 'en'

function detectInitialLang() {
  const pathLang = window.location.pathname.split('/').filter(Boolean)[0]
  if (SUPPORTED_LANGS.includes(pathLang)) return pathLang
  const detected = (i18n.language || '').split('-')[0]
  if (SUPPORTED_LANGS.includes(detected)) return detected
  return DEFAULT_LANG
}

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

function LegacyRedirect() {
  const location = useLocation()
  const pathParts = location.pathname.split('/').filter(Boolean)
  const firstPart = pathParts[0]
  if (SUPPORTED_LANGS.includes(firstPart)) {
    return <Navigate to={`/${firstPart}`} replace />
  }
  return <Navigate to={`/${detectInitialLang()}${location.pathname}${location.search}`} replace />
}

function AnimatedRoutes({ theme, onToggleTheme }) {
  const location = useLocation()
  const navigate = useNavigate()

  const pathParts = location.pathname.split('/').filter(Boolean)
  const urlLang = SUPPORTED_LANGS.includes(pathParts[0]) ? pathParts[0] : null

  const [displayLocation, setDisplayLocation] = useState(location)
  const [transition, setTransition] = useState(null) // null | 'covering' | 'revealing'
  const hasMountedRef = useRef(false)
  const transitionIntentRef = useRef(false)

  // Custom navigation state for landing page sections
  const [landingSection, setLandingSection] = useState(null)
  // Home = "/" (pre-redirect) o "/:lang" (post-redirect). Ambos muestran partículas.
  const isHomePath = pathParts.length === 0 || (urlLang && pathParts.length === 1)
  const [landingExpanded, setLandingExpanded] = useState(!isHomePath)

  // We ALWAYS render the NavBar, but we control its visibility via CSS classes.
  const [isNavVisible, setIsNavVisible] = useState(!isHomePath)

  // Sync i18n with the URL language
  useEffect(() => {
    if (urlLang && i18n.language !== urlLang) {
      i18n.changeLanguage(urlLang)
    }
  }, [urlLang])

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      setDisplayLocation(location)
      return
    }
    if (location.pathname !== displayLocation.pathname) {
      // Skip blackout transition when the change is the initial root → /:lang redirect
      // (no real navigation — just resolving the default language).
      if (displayLocation.pathname === '/') {
        setDisplayLocation(location)
        return
      }

      if (!transitionIntentRef.current) {
        setDisplayLocation(location)
        return
      }

      transitionIntentRef.current = false
      setTransition('covering')

      const coverTimer = setTimeout(() => {
        setDisplayLocation(location)
        window.scrollTo(0, 0)

        setTransition('revealing')

        const revealTimer = setTimeout(() => {
          setTransition(null)
        }, REVEAL_DURATION)

        return () => clearTimeout(revealTimer)
      }, COVER_DURATION)

      return () => clearTimeout(coverTimer)
    }
  }, [location, displayLocation.pathname])

  // Navigate helper — auto-prefixes the current language
  const handleNavigate = (path, section = null) => {
    const lang = urlLang || detectInitialLang()
    const prefixedPath = path === '/' ? `/${lang}` : `/${lang}${path}`
    transitionIntentRef.current = true
    if (path === '/') {
      setLandingSection(section)
      setLandingExpanded(!!section)
      if (!section) setIsNavVisible(false)
      navigate(prefixedPath)
    } else {
      setIsNavVisible(true)
      navigate(prefixedPath)
    }
  }

  // Listen for nav events from LandingPage (like the "View Project" button)
  useEffect(() => {
    const onNav = (e) => handleNavigate(e.detail)
    window.addEventListener('navigate', onNav)
    return () => window.removeEventListener('navigate', onNav)
  }, [navigate, urlLang])

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

  // If the URL has no recognized language segment, redirect to default lang + keep path
  if (!urlLang) {
    const target = location.pathname === '/'
      ? `/${detectInitialLang()}`
      : `/${detectInitialLang()}${location.pathname}${location.search}`
    return <Navigate to={target} replace />
  }

  return (
    <div className={`theme-${theme} ${isNavVisible ? 'app-content-visible' : ''}`}>
      <div style={{ opacity: isNavVisible ? 1 : 0, pointerEvents: isNavVisible ? 'auto' : 'none', transition: 'opacity 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)' }}>
        <NavBar
          onNavigate={handleNavigate}
          onBeforeNavigate={() => { transitionIntentRef.current = true }}
          theme={theme}
          onToggleTheme={onToggleTheme}
        />
      </div>

      <Routes location={displayLocation}>
        <Route path="/:lang" element={
          <LandingPage
            key={landingSection || 'home'}
            initialExpanded={landingExpanded}
            initialSection={landingSection}
            theme={theme}
          />
        } />
        <Route path="/:lang/portfolio" element={<PortfolioPage theme={theme} onNavigate={handleNavigate} />} />
        <Route path="/:lang/portfolio/:slug" element={<PortfolioPostWrapper onNavigate={handleNavigate} />} />
        <Route path="/:lang/blog" element={<BlogPage onNavigate={handleNavigate} />} />
        <Route path="/:lang/blog/:slug" element={<BlogPostWrapper onNavigate={handleNavigate} />} />
        <Route path="*" element={<LegacyRedirect />} />
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
    <HelmetProvider>
      <BrowserRouter>
        <LenisProvider>
          <AnimatedRoutes theme={theme} onToggleTheme={toggleTheme} />
        </LenisProvider>
      </BrowserRouter>
    </HelmetProvider>
  )
}

const landingRoot = document.createElement('div')
landingRoot.id = 'landing-root'
document.body.appendChild(landingRoot)
createRoot(landingRoot).render(<MainApp />)
