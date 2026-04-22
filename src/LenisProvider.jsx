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
  const contentROref = useRef(null)
  const imgLoadHandlerRef = useRef(null)

  useEffect(() => {
    if (isIOS()) return undefined

    const allowTouch = isAndroid()

    const attachGrowthWatchers = (scroller) => {
      if (contentROref.current) {
        contentROref.current.disconnect()
        contentROref.current = null
      }
      if (imgLoadHandlerRef.current) {
        scrollerRef.current?.removeEventListener('load', imgLoadHandlerRef.current, true)
        imgLoadHandlerRef.current = null
      }

      const ro = new ResizeObserver(() => lenisRef.current?.resize())
      Array.from(scroller.children).forEach((child) => ro.observe(child))
      contentROref.current = ro

      const onLoad = (e) => {
        if (e.target?.tagName === 'IMG') lenisRef.current?.resize()
      }
      scroller.addEventListener('load', onLoad, true)
      imgLoadHandlerRef.current = onLoad
    }

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
      window.__lenis = lenisRef.current

      attachGrowthWatchers(scroller)
    }

    ensure()

    const observer = new MutationObserver(() => ensure())
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })

    const onResize = () => ensure()
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      observer.disconnect()
      if (contentROref.current) {
        contentROref.current.disconnect()
        contentROref.current = null
      }
      if (imgLoadHandlerRef.current && scrollerRef.current) {
        scrollerRef.current.removeEventListener('load', imgLoadHandlerRef.current, true)
        imgLoadHandlerRef.current = null
      }
      if (lenisRef.current) {
        lenisRef.current.destroy()
        lenisRef.current = null
      }
      if (window.__lenis) window.__lenis = null
    }
  }, [])

  return children
}
