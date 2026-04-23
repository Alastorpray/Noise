function parseAllowedOrigins(env) {
  return (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

function corsHeaders(request, env) {
  const allowed = parseAllowedOrigins(env)
  const origin = request.headers.get('Origin') || ''
  const allowOrigin = allowed.includes(origin) ? origin : allowed[0] || ''
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Proxy-Token',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  }
}

function originAllowed(request, env) {
  const allowed = parseAllowedOrigins(env)
  if (!allowed.length) return true
  const origin = request.headers.get('Origin') || ''
  return allowed.includes(origin)
}

export async function onRequestOptions({ request, env }) {
  return new Response(null, { headers: corsHeaders(request, env) })
}

export async function onRequestPost({ request, env }) {
  const headers = corsHeaders(request, env)

  if (!originAllowed(request, env)) {
    return new Response(JSON.stringify({ error: 'origin not allowed' }), {
      status: 403,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }

  const expectedToken = env.DEEPL_PROXY_TOKEN
  if (expectedToken) {
    const gotToken = request.headers.get('X-Proxy-Token')
    if (gotToken !== expectedToken) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
      })
    }
  }

  const apiKey = env.DEEPL_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'DEEPL_API_KEY not configured' }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
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
      ...headers,
      'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
    },
  })
}
