import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { SUPPORTED_LANGS } from './index'

export function NavBar({ onNavigate, theme, onToggleTheme }) {
  const { t, i18n } = useTranslation()
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const langMenuRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()

  const pathParts = location.pathname.split('/').filter(Boolean)
  const urlLang = SUPPORTED_LANGS.includes(pathParts[0]) ? pathParts[0] : null
  const pathWithoutLang = '/' + pathParts.slice(urlLang ? 1 : 0).join('/')
  const route = pathWithoutLang === '/' ? '/' : pathWithoutLang

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'de', label: 'Deutsch' }
  ]

  const currentLang = languages.find(l => l.code === (urlLang || i18n.language)) || languages[0]

  const changeLanguage = (lng) => {
    const rest = pathWithoutLang === '/' ? '' : pathWithoutLang
    navigate(`/${lng}${rest}${location.search}`)
    setIsLangMenuOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
        setIsLangMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNavClick = (e, target) => {
    e.preventDefault()
    setIsMobileMenuOpen(false) // Close menu on navigation
    if (target === '/portfolio' || target === '/blog') {
      onNavigate(target)
    } else {
      if (route !== '/') {
        onNavigate('/', target)
      } else {
        const el = document.querySelector(`#${target}`)
        if (!el) return
        if (window.__lenis) {
          window.__lenis.scrollTo(el, { offset: 0, duration: 1.2 })
        } else {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
    }
  }

  const handleLogoClick = (e) => {
    e.preventDefault()
    setIsMobileMenuOpen(false)
    if (route !== '/') {
      onNavigate('/')
    }
  }

  return (
    <nav className="main-nav">
      <div className="nav-content">
        <div className="nav-brand">
          <Link to="/" onClick={handleLogoClick} style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/Coresearchlogo.svg" alt="Coresearch" className="nav-logo-img" />
          </Link>
        </div>

        {/* Hamburger Menu Button for Mobile */}
        <button 
          className={`mobile-menu-btn ${isMobileMenuOpen ? 'open' : ''}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <a
            href="/#about"
            className="nav-link"
            onClick={(e) => handleNavClick(e, 'about')}
          >
            {t('nav.about')}
          </a>
          <a
            href="/portfolio"
            className={`nav-link ${route.startsWith('/portfolio') ? 'nav-link--active' : ''}`}
            onClick={(e) => handleNavClick(e, '/portfolio')}
          >
            {t('nav.portfolio')}
          </a>
          <a
            href="/blog"
            className={`nav-link ${route.startsWith('/blog') ? 'nav-link--active' : ''}`}
            onClick={(e) => handleNavClick(e, '/blog')}
          >
            {t('nav.blog', 'Blog')}
          </a>
          <a
            href="/#contact"
            className="nav-link"
            onClick={(e) => handleNavClick(e, 'contact')}
          >
            {t('nav.contact')}
          </a>

          <div className="lang-dropdown" ref={langMenuRef}>
            <button
              className="lang-toggle"
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              aria-label="Select language"
            >
              <svg className="lang-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span className="lang-code">{currentLang.code.toUpperCase()}</span>
            </button>

            {isLangMenuOpen && (
              <div className="lang-menu">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    className={`lang-option ${i18n.language === lang.code ? 'active' : ''}`}
                    onClick={() => changeLanguage(lang.code)}
                  >
                    <span className="lang-code-option">{lang.code.toUpperCase()}</span>
                    <span className="lang-label">{lang.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="theme-toggle" onClick={onToggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </div>
    </nav>
  )
}
