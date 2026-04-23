import { defineCliConfig } from 'sanity/cli'
import { loadEnv } from 'vite'

export default defineCliConfig({
  api: {
    projectId: '2lf16gxk',
    dataset: 'production'
  },
  vite: (config) => {
    const mode = process.env.NODE_ENV || 'development'
    const env = loadEnv(mode, process.cwd(), '')
    const apiKey = env.DEEPL_API_KEY
    const target = apiKey && apiKey.endsWith(':fx')
      ? 'https://api-free.deepl.com'
      : 'https://api.deepl.com'

    config.server = config.server || {}
    config.server.proxy = {
      ...(config.server.proxy || {}),
      '/api/deepl': {
        target,
        changeOrigin: true,
        rewrite: () => '/v2/translate',
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            if (apiKey) {
              proxyReq.setHeader('Authorization', `DeepL-Auth-Key ${apiKey}`)
            }
          })
        },
      },
    }
    return config
  },
})
