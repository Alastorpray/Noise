import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

export function Reveal({ as: Tag = 'div', className = '', delay = 0, children, style }) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    const Cmp = Tag
    return (
      <Cmp className={className} style={style}>
        {children}
      </Cmp>
    )
  }

  const MotionTag = typeof Tag === 'string' ? motion[Tag] : motion(Tag)

  return (
    <MotionTag
      className={className}
      style={{ ...style, willChange: 'transform, opacity', backfaceVisibility: 'hidden' }}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ type: 'tween', duration: 0.95, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </MotionTag>
  )
}
