import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const client = createClient({
  projectId: '2lf16gxk',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2025-04-02'
})

const builder = imageUrlBuilder(client)

export function urlFor(source) {
  return builder.image(source)
}
