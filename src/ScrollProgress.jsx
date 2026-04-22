import React, { useEffect, useState } from 'react'

export function ScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let scroller = null
    let rafId = null

    const compute = () => {
      if (!scroller) return
      const max = scroller.scrollHeight - scroller.clientHeight
      const p = max > 0 ? Math.min(1, Math.max(0, scroller.scrollTop / max)) : 0
      setProgress(p)
    }

    const schedule = () => {
      if (rafId != null) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        compute()
      })
    }

    const attach = () => {
      const el = document.querySelector('.page-content.expanded')
      if (el && el !== scroller) {
        if (scroller) scroller.removeEventListener('scroll', schedule)
        scroller = el
        scroller.addEventListener('scroll', schedule, { passive: true })
        compute()
      }
    }

    attach()
    const observer = new MutationObserver(attach)
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
    window.addEventListener('resize', schedule)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', schedule)
      if (scroller) scroller.removeEventListener('scroll', schedule)
      if (rafId != null) cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <div className="scroll-progress" aria-hidden="true">
      <div className="scroll-progress__bar" style={{ transform: `scaleX(${progress})` }} />
    </div>
  )
}
