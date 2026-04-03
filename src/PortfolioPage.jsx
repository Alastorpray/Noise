import React from 'react'
import { Portfolio } from './Portfolio'
import { Footer } from './Footer'
import './landing.css'

export function PortfolioPage({ onNavigate }) {
  return (
    <div className="page-content expanded">
      <div style={{ paddingTop: 'var(--space-xl)' }}>
        <Portfolio onNavigate={onNavigate} />
      </div>

      <Footer />
    </div>
  )
}
