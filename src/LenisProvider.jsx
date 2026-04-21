import React, { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

function isIOS() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

function isAndroid() {
  if (typeof navigator === 'undefined') return false
  return /Android/.test(navigator.userAgent)
}

export function LenisProvider({ children }) {
  const lenisRef = useRef(null)
  const scrollerRef = useRef(null)

  useEffect(() => {
    if (isIOS()) return undefined

    const allowTouch = isAndroid()

    const ensure = () => {
      const scroller = document.querySelector('.page-content.expanded')
      if (!scroller) return

      if (scrollerRef.current === scroller && lenisRef.current) return

      if (lenisRef.current) {
        lenisRef.current.destroy()
        lenisRef.current = null
      }

      scrollerRef.current = scroller

      lenisRef.current = new Lenis({
        wrapper: scroller,
        content: scroller,
        autoRaf: true,
        smoothWheel: true,
        syncTouch: allowTouch,
        syncTouchLerp: 0.12,
        lerp: 0.08,
      })
    }

    ensure()

    const observer = new MutationObserver(() => ensure())
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })

    const onResize = () => ensure()
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      observer.disconnect()
      if (lenisRef.current) {
        lenisRef.current.destroy()
        lenisRef.current = null
      }
    }
  }, [])

  return children
}
