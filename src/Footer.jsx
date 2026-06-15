import React from 'react'
import { useTranslation } from 'react-i18next'
import './landing.css'

export function Footer() {
  const { t } = useTranslation()
  
  return (
    <footer className="footer">
      <div className="footer-content">
        <p className="footer-text">© {new Date().getFullYear()} Coresearch. {t('footer.rights')}</p>
      </div>
    </footer>
  )
}
