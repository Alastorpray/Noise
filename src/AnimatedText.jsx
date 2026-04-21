import React from 'react'

export function AnimatedWords({
  text,
  as: Tag = 'h1',
  className = '',
  delay = 0,
  stagger = 60,
  style = {},
}) {
  if (!text) return null
  const words = String(text).split(' ')
  return (
    <Tag className={`animated-words ${className}`} style={style}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="animated-word">
          <span
            className="animated-word__inner"
            style={{ animationDelay: `${delay + i * stagger}ms` }}
          >
            {word}
          </span>
          {i < words.length - 1 ? '\u00A0' : ''}
        </span>
      ))}
    </Tag>
  )
}
