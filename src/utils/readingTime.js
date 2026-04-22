const WORDS_PER_MINUTE = 220

export function getReadingTimeMinutes(blocks) {
  if (!Array.isArray(blocks)) return 1
  let words = 0
  for (const block of blocks) {
    if (block?._type === 'block' && Array.isArray(block.children)) {
      for (const child of block.children) {
        if (typeof child?.text === 'string') {
          words += countWords(child.text)
        }
      }
    } else if (block?._type === 'codeBlock' && typeof block.code === 'string') {
      words += countWords(block.code)
    } else if (block?._type === 'callout' && typeof block.text === 'string') {
      words += countWords(block.text)
    }
  }
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE))
}

function countWords(str) {
  return str.trim().split(/\s+/).filter(Boolean).length
}
