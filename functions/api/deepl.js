const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS_HEADERS })
}

export async function onRequestPost(context) {
  const { request, env } = context
  const apiKey = env.DEEPL_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'DEEPL_API_KEY not configured' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  const endpoint = apiKey.endsWith(':fx')
    ? 'https://api-free.deepl.com/v2/translate'
    : 'https://api.deepl.com/v2/translate'

  const body = await request.text()
  const contentType = request.headers.get('Content-Type') || 'application/x-www-form-urlencoded'

  const upstream = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `DeepL-Auth-Key ${apiKey}`,
      'Content-Type': contentType,
    },
    body,
  })

  const text = await upstream.text()
  return new Response(text, {
    status: upstream.status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
    },
  })
}
