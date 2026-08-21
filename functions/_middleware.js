const SITE_ORIGIN = 'https://coresearch.studio'
const SITE_NAME = 'Coresearch'
const PROJECT_ID = '2lf16gxk'
const DATASET = 'production'
const API_VERSION = 'v2025-04-02'

// Keep in sync with BLOG_ENABLED in src/config.js
const BLOG_ENABLED = false

const POST_PATTERN = BLOG_ENABLED
  ? /^\/(en|es)\/(blog|projects|research)\/([^/]+)\/?$/
  : /^\/(en|es)\/(projects|research)\/([^/]+)\/?$/

const TYPE_BY_SECTION = { blog: 'post', projects: 'project', research: 'research' }

// Log entries hang off the project they belong to: /:lang/projects/:project/log/:entry
const LOG_PATTERN = /^\/(en|es)\/projects\/([^/]+)\/log\/([^/]+)\/?$/

// Sections that were renamed — keep old links and indexed URLs alive
const RENAMED_SECTIONS = { publications: 'research', portfolio: 'projects' }
const RENAMED_PATTERN = /^\/(en|es)\/(publications|portfolio)(\/[^/]+)?\/?$/

// German was dropped — those readers get the English site
const GERMAN_PATTERN = /^\/de(\/.*)?$/

export async function onRequest(context) {
  const { request, next } = context
  const url = new URL(request.url)

  // Normalise first, redirect once: a German URL of a renamed section should
  // not cost the visitor two hops.
  let pathname = url.pathname
  let moved = false

  const german = pathname.match(GERMAN_PATTERN)
  if (german) {
    pathname = `/en${german[1] || ''}`
    moved = true
  }

  const renamed = pathname.match(RENAMED_PATTERN)
  if (renamed) {
    const [, lang, section, tail] = renamed
    const slug = tail ? tail.replace(/\/$/, '') : ''
    pathname = `/${lang}/${RENAMED_SECTIONS[section]}${slug}`
    moved = true
  }

  if (moved) {
    return Response.redirect(`${SITE_ORIGIN}${pathname}${url.search}`, 301)
  }

  const logMatch = url.pathname.match(LOG_PATTERN)
  const match = logMatch || url.pathname.match(POST_PATTERN)
  if (!match) return next()

  const lang = match[1]
  const slug = match[3]
  const type = logMatch ? 'post' : TYPE_BY_SECTION[match[2]]
  const sectionPath = logMatch ? `projects/${match[2]}/log` : match[2]

  const data = await fetchContent(type, slug, lang)
  if (!data) return next()

  const response = await next()
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('text/html')) return response

  const title = `${data.title} — ${SITE_NAME}`
  const description = data.excerpt || ''
  const canonical = `${SITE_ORIGIN}/${data.language}/${sectionPath}/${slug}`
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

const EXCERPT_FIELD = {
  post: 'excerpt',
  project: '"excerpt": description',
  research: '"excerpt": abstract',
}

async function fetchContent(type, slug, lang) {
  const groq = `*[_type == "${type}" && slug.current == $slug]
     | order((language == $lang) desc, (language == "en") desc)[0] {
       title, ${EXCERPT_FIELD[type]}, language
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
