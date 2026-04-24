import { ImageResponse } from 'workers-og'

const PROJECT_ID = '2lf16gxk'
const DATASET = 'production'
const API_VERSION = 'v2025-04-02'

export async function onRequestGet({ params, request }) {
  const type = params.type
  const slug = params.slug
  const url = new URL(request.url)
  const lang = url.searchParams.get('lang') || 'en'

  if (type !== 'post' && type !== 'project') {
    return new Response('Invalid type', { status: 400 })
  }

  const groq = type === 'post'
    ? `*[_type == "post" && slug.current == $slug]
       | order((language == $lang) desc, (language == "en") desc)[0] {
         title, "category": categories[0]->title
       }`
    : `*[_type == "project" && slug.current == $slug]
       | order((language == $lang) desc, (language == "en") desc)[0] {
         title, "category": division
       }`

  const sanityUrl = new URL(`https://${PROJECT_ID}.apicdn.sanity.io/${API_VERSION}/data/query/${DATASET}`)
  sanityUrl.searchParams.set('query', groq)
  sanityUrl.searchParams.set('$slug', JSON.stringify(slug))
  sanityUrl.searchParams.set('$lang', JSON.stringify(lang))

  const res = await fetch(sanityUrl.toString(), { cf: { cacheTtl: 300, cacheEverything: true } })
  if (!res.ok) {
    return new Response('Upstream error', { status: 502 })
  }
  const { result } = await res.json()

  const title = result?.title || 'Coresearch'
  const category = result?.category || (type === 'post' ? 'Blog' : 'Portfolio')

  const html = `
    <div style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:80px;background:linear-gradient(135deg,#0a0a0a 0%,#1a1a1a 100%);color:#E8E8E8;font-family:system-ui,sans-serif;">
      <div style="font-size:28px;color:#ff6600;text-transform:uppercase;letter-spacing:6px;display:flex;">
        ${escapeHtml(category)}
      </div>
      <div style="font-size:76px;font-weight:700;line-height:1.1;display:flex;flex-wrap:wrap;max-width:100%;">
        ${escapeHtml(title)}
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:26px;color:#888;">
        <div style="display:flex;">coresearch.studio</div>
        <div style="display:flex;color:#ff6600;">●</div>
      </div>
    </div>
  `

  return new ImageResponse(html, {
    width: 1200,
    height: 630,
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  })
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}
