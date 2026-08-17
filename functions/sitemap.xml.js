const SITE = 'https://coresearch.studio'
const LANGS = ['en', 'es', 'de']
const DEFAULT_LANG = 'en'
const PROJECT_ID = '2lf16gxk'
const DATASET = 'production'
const API_VERSION = 'v2025-04-02'

// Keep in sync with BLOG_ENABLED in src/config.js
const BLOG_ENABLED = false

const GROQ = `{
  "posts": *[_type == "post" && defined(slug.current)] {
    "slug": slug.current,
    language,
    "lastmod": coalesce(_updatedAt, publishedAt)
  },
  "projects": *[_type == "project" && defined(slug.current)] {
    "slug": slug.current,
    language,
    "lastmod": coalesce(_updatedAt, date)
  },
  "research": *[_type == "research" && defined(slug.current) && count(body) > 0] {
    "slug": slug.current,
    language,
    "lastmod": coalesce(_updatedAt, publishedAt)
  }
}`

export async function onRequestGet() {
  const url = `https://${PROJECT_ID}.apicdn.sanity.io/${API_VERSION}/data/query/${DATASET}?query=${encodeURIComponent(GROQ)}`

  const res = await fetch(url, { cf: { cacheTtl: 300, cacheEverything: true } })
  if (!res.ok) {
    return new Response('Failed to fetch content', { status: 502 })
  }
  const { result } = await res.json()

  const xml = buildSitemap(result || { posts: [], projects: [], research: [] })

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=600',
    },
  })
}

function buildSitemap({ posts, projects, research }) {
  const entries = []

  const sections = ['', '/research', '/portfolio']
  if (BLOG_ENABLED) sections.push('/blog')

  for (const path of sections) {
    for (const lang of LANGS) {
      entries.push(urlEntry(lang, path, LANGS, null))
    }
  }

  if (BLOG_ENABLED) {
    for (const [slug, { langs, lastmod }] of groupBySlug(posts)) {
      for (const lang of langs) {
        entries.push(urlEntry(lang, `/blog/${slug}`, langs, lastmod))
      }
    }
  }

  for (const [slug, { langs, lastmod }] of groupBySlug(projects)) {
    for (const lang of langs) {
      entries.push(urlEntry(lang, `/portfolio/${slug}`, langs, lastmod))
    }
  }

  for (const [slug, { langs, lastmod }] of groupBySlug(research)) {
    for (const lang of langs) {
      entries.push(urlEntry(lang, `/research/${slug}`, langs, lastmod))
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`
}

function groupBySlug(items) {
  const map = new Map()
  for (const item of items) {
    if (!item.slug || !item.language) continue
    if (!map.has(item.slug)) map.set(item.slug, { langs: [], lastmod: null })
    const g = map.get(item.slug)
    if (!g.langs.includes(item.language)) g.langs.push(item.language)
    if (item.lastmod && (!g.lastmod || item.lastmod > g.lastmod)) g.lastmod = item.lastmod
  }
  return map
}

function urlEntry(lang, pathSuffix, availableLangs, lastmod) {
  const loc = `${SITE}/${lang}${pathSuffix}`
  const lastmodTag = lastmod ? `    <lastmod>${lastmod.slice(0, 10)}</lastmod>\n` : ''
  const alternates = availableLangs
    .map(l => `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE}/${l}${pathSuffix}"/>`)
    .join('\n')
  const xDefaultLang = availableLangs.includes(DEFAULT_LANG) ? DEFAULT_LANG : availableLangs[0]
  const xDefault = `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/${xDefaultLang}${pathSuffix}"/>`
  return `  <url>
    <loc>${loc}</loc>
${lastmodTag}${alternates}
${xDefault}
  </url>`
}
