const SUPPORTED_TARGETS = {
  en: 'EN-US',
  de: 'DE',
  es: 'ES',
}

const TARGETS_PER_SOURCE = {
  es: ['en', 'de'],
  en: ['es', 'de'],
  de: ['es', 'en'],
}

function getProxyUrl() {
  const url = import.meta.env.SANITY_STUDIO_DEEPL_PROXY_URL
  if (!url) {
    if (import.meta.env.DEV) return '/api/deepl'
    throw new Error('Missing SANITY_STUDIO_DEEPL_PROXY_URL in studio/.env')
  }
  return url
}

async function translateStrings(strings, sourceLang, targetLang) {
  const nonEmpty = strings.map(s => (typeof s === 'string' && s.trim() ? s : null))
  const toTranslate = nonEmpty.filter(Boolean)
  if (toTranslate.length === 0) return strings

  const endpoint = getProxyUrl()

  const params = new URLSearchParams()
  params.append('source_lang', sourceLang.toUpperCase())
  params.append('target_lang', SUPPORTED_TARGETS[targetLang])
  toTranslate.forEach(text => params.append('text', text))

  const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }
  const token = import.meta.env.SANITY_STUDIO_DEEPL_PROXY_TOKEN
  if (token) headers['X-Proxy-Token'] = token

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: params.toString(),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`DeepL proxy error ${res.status}: ${text || res.statusText}`)
  }

  const data = await res.json()
  const translations = data.translations || []

  let idx = 0
  return nonEmpty.map(original => (original ? translations[idx++]?.text ?? original : original))
}

function collectBlockSpans(blocks) {
  const refs = []
  if (!Array.isArray(blocks)) return refs
  blocks.forEach(block => {
    if (block._type === 'block' && Array.isArray(block.children)) {
      block.children.forEach(child => {
        if (child._type === 'span' && typeof child.text === 'string') {
          refs.push({ block, child })
        }
      })
    }
  })
  return refs
}

function translateBlocks(blocks, spanTexts) {
  if (!Array.isArray(blocks)) return blocks
  let idx = 0
  return blocks.map(block => {
    if (block._type !== 'block' || !Array.isArray(block.children)) return block
    return {
      ...block,
      children: block.children.map(child => {
        if (child._type !== 'span' || typeof child.text !== 'string') return child
        const newText = spanTexts[idx++]
        return { ...child, text: newText }
      })
    }
  })
}

async function translateDocForLang(sourceDoc, sourceLang, targetLang) {
  const stringBatch = []
  const pushString = value => {
    stringBatch.push(value)
    return stringBatch.length - 1
  }

  const titleIdx = typeof sourceDoc.title === 'string' ? pushString(sourceDoc.title) : -1
  const excerptIdx = typeof sourceDoc.excerpt === 'string' ? pushString(sourceDoc.excerpt) : -1
  const descriptionIdx = typeof sourceDoc.description === 'string' ? pushString(sourceDoc.description) : -1
  const mainImageAltIdx = typeof sourceDoc.mainImage?.alt === 'string' ? pushString(sourceDoc.mainImage.alt) : -1

  const bodySpanRefs = collectBlockSpans(sourceDoc.body)
  const bodySpanStart = stringBatch.length
  bodySpanRefs.forEach(ref => pushString(ref.child.text))

  const inlineUpdates = []
  if (Array.isArray(sourceDoc.body)) {
    sourceDoc.body.forEach((entry, i) => {
      if (entry?._type === 'callout' && typeof entry.text === 'string') {
        inlineUpdates.push({ i, idx: pushString(entry.text) })
      }
      if (entry?._type === 'image' && typeof entry.caption === 'string') {
        inlineUpdates.push({ i, idx: pushString(entry.caption), field: 'caption' })
      }
      if (entry?._type === 'image' && typeof entry.alt === 'string') {
        inlineUpdates.push({ i, idx: pushString(entry.alt), field: 'alt' })
      }
      if (entry?._type === 'videoEmbed' && typeof entry.caption === 'string') {
        inlineUpdates.push({ i, idx: pushString(entry.caption), field: 'caption' })
      }
      if (entry?._type === 'videoFile' && typeof entry.caption === 'string') {
        inlineUpdates.push({ i, idx: pushString(entry.caption), field: 'caption' })
      }
    })
  }

  const tagsStart = stringBatch.length
  const tags = Array.isArray(sourceDoc.tags) ? sourceDoc.tags : []
  tags.forEach(tag => typeof tag === 'string' && pushString(tag))

  const translated = await translateStrings(stringBatch, sourceLang, targetLang)

  const result = { ...sourceDoc }
  if (titleIdx >= 0) result.title = translated[titleIdx]
  if (excerptIdx >= 0) result.excerpt = translated[excerptIdx]
  if (descriptionIdx >= 0) result.description = translated[descriptionIdx]
  if (mainImageAltIdx >= 0) {
    result.mainImage = { ...sourceDoc.mainImage, alt: translated[mainImageAltIdx] }
  }

  if (bodySpanRefs.length) {
    const translatedSpans = translated.slice(bodySpanStart, bodySpanStart + bodySpanRefs.length)
    result.body = translateBlocks(sourceDoc.body, translatedSpans)
  }

  if (inlineUpdates.length && Array.isArray(result.body)) {
    result.body = result.body.map((entry, i) => {
      const updates = inlineUpdates.filter(c => c.i === i)
      if (!updates.length) return entry
      const next = { ...entry }
      updates.forEach(({ idx, field }) => {
        if (field === 'caption') next.caption = translated[idx]
        else if (field === 'alt') next.alt = translated[idx]
        else next.text = translated[idx]
      })
      return next
    })
  }

  if (tags.length) {
    result.tags = tags.map((_, i) => translated[tagsStart + i])
  }

  return result
}

export async function translateDocument(client, sourceDoc) {
  const sourceLang = sourceDoc.language || 'es'
  const targets = TARGETS_PER_SOURCE[sourceLang] || []
  if (!targets.length) throw new Error(`Unsupported source language: ${sourceLang}`)

  const sourceSlug = sourceDoc.slug?.current
  if (!sourceSlug) throw new Error('Source document is missing slug.current — set the slug before translating.')

  const created = []

  for (const targetLang of targets) {
    const translated = await translateDocForLang(sourceDoc, sourceLang, targetLang)

    const { _id, _rev, _createdAt, _updatedAt, ...rest } = translated

    const newDoc = {
      ...rest,
      _type: sourceDoc._type,
      language: targetLang,
      slug: { _type: 'slug', current: sourceSlug },
    }

    const id = `${sourceDoc._id.replace(/^drafts\./, '')}__${targetLang}`
    const draftId = `drafts.${id}`

    await client.createOrReplace({ _id: draftId, ...newDoc })
    created.push({ lang: targetLang, draftId })
  }

  return created
}
