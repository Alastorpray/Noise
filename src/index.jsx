import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate, useParams, Navigate } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import './styles.css'
import { LandingPage } from './LandingPage'
import { ResearchPage } from './ResearchPage'
import { ResearchPost } from './ResearchPost'
import { PortfolioPage } from './PortfolioPage'
import { PortfolioPost } from './PortfolioPost'
import { BlogPage } from './BlogPage'
import { BlogPost } from './BlogPost'
import { NavBar } from './NavBar'
import { LenisProvider } from './LenisProvider'
import { BLOG_ENABLED } from './config'
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

  // Home = "/" (pre-redirect) o "/:lang" (post-redirect). La home usa su propio
  // fondo oscuro de hero, así que el fondo opaco solo se aplica fuera de home.
  const displayParts = displayLocation.pathname.split('/').filter(Boolean)
  const displayLang = SUPPORTED_LANGS.includes(displayParts[0]) ? displayParts[0] : null
  const isHomeDisplayed = displayParts.length === 0 || (displayLang && displayParts.length === 1)

  // Sync i18n with the DISPLAYED location's language (not the URL's).
  // displayLocation only updates mid-blackout, so the text swaps while the
  // screen is covered: fade out → switch language → fade in already translated.
  useEffect(() => {
    if (displayLang && i18n.language !== displayLang) {
      i18n.changeLanguage(displayLang)
    }
  }, [displayLang])

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
    }
    navigate(prefixedPath)
  }

  // Listen for nav events from LandingPage (like the "View Project" button)
  useEffect(() => {
    const onNav = (e) => handleNavigate(e.detail)
    window.addEventListener('navigate', onNav)
    return () => window.removeEventListener('navigate', onNav)
  }, [navigate, urlLang])

  // If the URL has no recognized language segment, redirect to default lang + keep path
  if (!urlLang) {
    const target = location.pathname === '/'
      ? `/${detectInitialLang()}`
      : `/${detectInitialLang()}${location.pathname}${location.search}`
    return <Navigate to={target} replace />
  }

  return (
    <div className={`theme-${theme} ${isHomeDisplayed ? '' : 'app-content-visible'}`}>
      <NavBar
        onNavigate={handleNavigate}
        onBeforeNavigate={() => { transitionIntentRef.current = true }}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      <Routes location={displayLocation}>
        <Route path="/:lang" element={
          <LandingPage
            key={landingSection || 'home'}
            initialSection={landingSection}
            theme={theme}
          />
        } />
        <Route path="/:lang/research" element={<ResearchPage onNavigate={handleNavigate} />} />
        <Route path="/:lang/research/:slug" element={<ResearchPostWrapper onNavigate={handleNavigate} />} />
        <Route path="/:lang/portfolio" element={<PortfolioPage theme={theme} onNavigate={handleNavigate} />} />
        <Route path="/:lang/portfolio/:slug" element={<PortfolioPostWrapper onNavigate={handleNavigate} />} />
        {BLOG_ENABLED && (
          <Route path="/:lang/blog" element={<BlogPage onNavigate={handleNavigate} />} />
        )}
        {BLOG_ENABLED && (
          <Route path="/:lang/blog/:slug" element={<BlogPostWrapper onNavigate={handleNavigate} />} />
        )}
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

// Wrapper for ResearchPost
function ResearchPostWrapper({ onNavigate }) {
  const { slug } = useParams()
  return <ResearchPost slug={slug} onNavigate={onNavigate} />
}

// Wrapper for PortfolioPost
function PortfolioPostWrapper({ onNavigate }) {
  const { slug } = useParams()
  return <PortfolioPost slug={slug} onNavigate={onNavigate} />
}

function MainApp() {
  const [theme, setTheme] = useState('dark')

  // El body queda fuera del wrapper con la clase de tema — sincronizar su fondo
  // para que la franja de la nav y el overscroll no se vean oscuros en modo claro.
  useEffect(() => {
    document.body.style.backgroundColor = theme === 'dark' ? '#0E0E11' : '#EBEBEB'
  }, [theme])

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
