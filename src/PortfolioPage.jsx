import React from 'react'
import { Portfolio } from './Portfolio'
import { Footer } from './Footer'
import './landing.css'

export function PortfolioPage() {
  return (
    <div className="page-content expanded">
      <div style={{ paddingTop: 'var(--space-xl)' }}>
        <Portfolio />
      </div>

      <Footer />
    </div>
  )
}
