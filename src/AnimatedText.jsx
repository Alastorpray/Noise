import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

export function AnimatedWords({
  text,
  as: Tag = 'h1',
  className = '',
  delay = 0,
  stagger = 60,
  style = {},
}) {
  const reduceMotion = useReducedMotion()
  if (!text) return null
  const words = String(text).split(' ')

  if (reduceMotion) {
    return (
      <Tag className={`animated-words ${className}`} style={style}>
        {words.map((word, i) => (
          <span key={`${word}-${i}`}>
            {word}
            {i < words.length - 1 ? '\u00A0' : ''}
          </span>
        ))}
      </Tag>
    )
  }

  const MotionTag = typeof Tag === 'string' ? motion[Tag] : motion(Tag)

  const container = {
    hidden: {},
    visible: {
      transition: {
        delayChildren: delay / 1000,
        staggerChildren: stagger / 1000,
      },
    },
  }

  const wordVariant = {
    hidden: { y: 40, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'tween', duration: 0.95, ease: [0.22, 1, 0.36, 1] },
    },
  }

  return (
    <MotionTag
      className={`animated-words ${className}`}
      style={style}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="animated-word">
          <motion.span className="animated-word__inner" variants={wordVariant} style={{ willChange: 'transform, opacity' }}>
            {word}
          </motion.span>
          {i < words.length - 1 ? '\u00A0' : ''}
        </span>
      ))}
    </MotionTag>
  )
}
