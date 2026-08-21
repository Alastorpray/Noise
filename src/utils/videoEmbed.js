// Turns a URL a person would paste into one an <iframe> can actually load.
// Anything that cannot be framed returns null, so the caller renders nothing
// instead of an empty box that looks broken.
export function getVideoEmbedUrl(url) {
  if (!url) return null
  const clean = String(url).trim()

  // Already an embed URL — leave it alone
  if (/(?:youtube(?:-nocookie)?\.com\/embed\/|player\.vimeo\.com\/video\/)/.test(clean)) {
    return clean
  }

  // watch, youtu.be, shorts and live all carry the same 11-character id
  const yt = clean.match(
    /(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|shorts\/|live\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`

  // Vimeo ids can sit behind channel or album segments, and private links add a hash
  const vimeo = clean.match(/vimeo\.com\/(?:[\w-]+\/)*(\d{6,})/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`

  return null
}
