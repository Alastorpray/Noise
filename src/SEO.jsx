import React from 'react'
import { Helmet } from 'react-helmet-async'

const SITE_NAME = 'Coresearch'
const DEFAULT_DESCRIPTION = 'We transform ideas into innovative digital experiences that connect people, technologies and new possibilities.'
const DEFAULT_URL = 'https://coresearch.studio'
const DEFAULT_IMAGE = 'https://coresearch.studio/og-image.png'

export function SEO({
  title,
  description,
  image,
  url,
  type = 'website',
  publishedTime,
}) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Connecting worlds`
  const desc = description || DEFAULT_DESCRIPTION
  const canonical = url || (typeof window !== 'undefined' ? window.location.href : DEFAULT_URL)
  const imageUrl = image || DEFAULT_IMAGE
  const cardType = 'summary_large_image'

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonical} />

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={imageUrl} />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}

      <meta name="twitter:card" content={cardType} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={imageUrl} />
    </Helmet>
  )
}
