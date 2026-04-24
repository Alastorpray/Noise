const SITE_ORIGIN = 'https://coresearch.studio'
const SITE_NAME = 'Coresearch'
const PROJECT_ID = '2lf16gxk'
const DATASET = 'production'
const API_VERSION = 'v2025-04-02'

const POST_PATTERN = /^\/(en|es|de)\/(blog|portfolio)\/([^/]+)\/?$/

export async function onRequest(context) {
  const { request, next } = context
  const url = new URL(request.url)

  const match = url.pathname.match(POST_PATTERN)
  if (!match) return next()

  const [, lang, section, slug] = match
  const type = section === 'blog' ? 'post' : 'project'

  const data = await fetchContent(type, slug, lang)
  if (!data) return next()

  const response = await next()
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('text/html')) return response

  const title = `${data.title} — ${SITE_NAME}`
  const description = data.excerpt || ''
  const canonical = `${SITE_ORIGIN}/${data.language}/${section}/${slug}`
  const ogImage = `${SITE_ORIGIN}/og/${type}/${slug}?lang=${data.language}`

  const setAttr = (name, value) => ({ element(el) { el.setAttribute(name, value) } })
  const setContent = (value) => setAttr('content', value)

  const rewriter = new HTMLRewriter()
    .on('html', setAttr('lang', data.language))
    .on('title', { element(el) { el.setInnerContent(title) } })
    .on('meta[name="description"]', setContent(description))
    .on('link[rel="canonical"]', setAttr('href', canonical))
    .on('meta[property="og:type"]', setContent('article'))
    .on('meta[property="og:url"]', setContent(canonical))
    .on('meta[property="og:title"]', setContent(title))
    .on('meta[property="og:description"]', setContent(description))
    .on('meta[property="og:image"]', setContent(ogImage))
    .on('meta[property="og:image:width"]', setContent('1200'))
    .on('meta[property="og:image:height"]', setContent('630'))
    .on('meta[property="og:image:alt"]', setContent(data.title))
    .on('meta[name="twitter:url"]', setContent(canonical))
    .on('meta[name="twitter:title"]', setContent(title))
    .on('meta[name="twitter:description"]', setContent(description))
    .on('meta[name="twitter:image"]', setContent(ogImage))

  return rewriter.transform(response)
}

async function fetchContent(type, slug, lang) {
  const groq = type === 'post'
    ? `*[_type == "post" && slug.current == $slug]
       | order((language == $lang) desc, (language == "en") desc)[0] {
         title, excerpt, language
       }`
    : `*[_type == "project" && slug.current == $slug]
       | order((language == $lang) desc, (language == "en") desc)[0] {
         title, "excerpt": description, language
       }`

  const sanityUrl = new URL(`https://${PROJECT_ID}.apicdn.sanity.io/${API_VERSION}/data/query/${DATASET}`)
  sanityUrl.searchParams.set('query', groq)
  sanityUrl.searchParams.set('$slug', JSON.stringify(slug))
  sanityUrl.searchParams.set('$lang', JSON.stringify(lang))

  try {
    const res = await fetch(sanityUrl.toString(), { cf: { cacheTtl: 300, cacheEverything: true } })
    if (!res.ok) return null
    const { result } = await res.json()
    return result
  } catch {
    return null
  }
}
