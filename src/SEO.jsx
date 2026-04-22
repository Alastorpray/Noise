import React from 'react'
import { Helmet } from 'react-helmet-async'

const SITE_NAME = 'Coresearch'
const DEFAULT_DESCRIPTION = 'Multidisciplinary studio specialized in XR, 3D printing and applied research.'
const DEFAULT_URL = 'https://coresearch.studio'

export function SEO({
  title,
  description,
  image,
  url,
  type = 'website',
  publishedTime,
}) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME
  const desc = description || DEFAULT_DESCRIPTION
  const canonical = url || (typeof window !== 'undefined' ? window.location.href : DEFAULT_URL)
  const cardType = image ? 'summary_large_image' : 'summary'

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
      {image && <meta property="og:image" content={image} />}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}

      <meta name="twitter:card" content={cardType} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {image && <meta name="twitter:image" content={image} />}
    </Helmet>
  )
}
