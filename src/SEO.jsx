import React from 'react'
import { Helmet } from 'react-helmet-async'
import { useLocation } from 'react-router-dom'
import { SUPPORTED_LANGS, DEFAULT_LANG } from './index'

const SITE_NAME = 'Coresearch'
export const SITE_ORIGIN = 'https://coresearch.studio'
const DEFAULT_DESCRIPTION = 'Coresearch is an independent research studio. We conduct and evaluate rigorous investigations across an expanding range of fields, archiving every study as a permanent asset.'
const DEFAULT_IMAGE = `${SITE_ORIGIN}/og-image.png`

export function SEO({
  title,
  description,
  image,
  url,
  type = 'website',
  publishedTime,
}) {
  const location = useLocation()
  const parts = location.pathname.split('/').filter(Boolean)
  const currentLang = SUPPORTED_LANGS.includes(parts[0]) ? parts[0] : DEFAULT_LANG
  const tail = parts.slice(SUPPORTED_LANGS.includes(parts[0]) ? 1 : 0).join('/')
  const tailWithSlash = tail ? `/${tail}` : ''

  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Connecting worlds`
  const desc = description || DEFAULT_DESCRIPTION
  const canonical = url || `${SITE_ORIGIN}/${currentLang}${tailWithSlash}`
  const imageUrl = image || DEFAULT_IMAGE
  const cardType = 'summary_large_image'

  return (
    <Helmet>
      <html lang={currentLang} />
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonical} />

      {SUPPORTED_LANGS.map(l => (
        <link
          key={l}
          rel="alternate"
          hrefLang={l}
          href={`${SITE_ORIGIN}/${l}${tailWithSlash}`}
        />
      ))}
      <link
        rel="alternate"
        hrefLang="x-default"
        href={`${SITE_ORIGIN}/${DEFAULT_LANG}${tailWithSlash}`}
      />

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:locale" content={currentLang} />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}

      <meta name="twitter:card" content={cardType} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={imageUrl} />
    </Helmet>
  )
}
