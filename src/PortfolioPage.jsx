import React from 'react'
import { Portfolio } from './Portfolio'
import { Footer } from './Footer'
import { DotSpotlight } from './DotSpotlight'
import './landing.css'

export function PortfolioPage({ onNavigate }) {
  return (
    <div className="page-content expanded">
      <DotSpotlight fixed />
      <Portfolio onNavigate={onNavigate} />
      <Footer />
    </div>
  )
}
