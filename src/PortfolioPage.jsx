import React from 'react'
import { useTranslation } from 'react-i18next'
import { Portfolio } from './Portfolio'
import './landing.css'

export function PortfolioPage() {
  const { t } = useTranslation()

  return (
    <div className="page-content expanded" style={{ opacity: 1 }}>
      <div style={{ paddingTop: 'var(--space-xl)' }}>
        <Portfolio />
      </div>

      <footer className="footer">
        <div className="footer-content">
          <p className="footer-text">© 2024 Coresearch. {t('footer.rights')}</p>
        </div>
      </footer>
    </div>
  )
}
