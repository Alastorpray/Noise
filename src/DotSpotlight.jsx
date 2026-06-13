import React, { useEffect, useRef } from 'react'

/**
 * Foco de "lupa": revela una retícula de puntos teñida de acento alrededor
 * del cursor, con inercia. Las coordenadas se calculan relativas al propio
 * elemento, así funciona igual en modo absoluto (scrollea con el contenido,
 * como en la landing) y en modo fijo (cubre el viewport en el resto de páginas).
 */
export function DotSpotlight({ fixed = false }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(hover: none)').matches) return
    let raf = null
    let hasTarget = false
    let tx = 0, ty = 0, cx = 0, cy = 0

    const apply = () => {
      const rect = el.getBoundingClientRect()
      el.style.setProperty('--spot-x', `${cx - rect.left}px`)
      el.style.setProperty('--spot-y', `${cy - rect.top}px`)
    }
    const loop = () => {
      raf = requestAnimationFrame(() => {
        cx += (tx - cx) * 0.16
        cy += (ty - cy) * 0.16
        apply()
        if (Math.abs(tx - cx) > 0.4 || Math.abs(ty - cy) > 0.4) loop()
        else raf = null
      })
    }
    const onMove = (e) => {
      tx = e.clientX
      ty = e.clientY
      if (!hasTarget) {
        hasTarget = true
        cx = tx
        cy = ty
      }
      if (!raf) loop()
    }
    const scroller = el.closest('.page-content')
    const onScroll = () => {
      if (hasTarget) apply()
    }
    window.addEventListener('mousemove', onMove)
    scroller?.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMove)
      scroller?.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      ref={ref}
      className={`dot-spotlight ${fixed ? 'dot-spotlight--fixed' : ''}`}
      aria-hidden="true"
    />
  )
}
