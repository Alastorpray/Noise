import { useState } from 'react'
import { useClient } from 'sanity'
import { translateDocument, TRANSLATABLE_TYPES } from '../lib/translate'

export function TranslateWithDeepLAction(props) {
  const { id, type, draft, published, onComplete } = props
  const [isRunning, setIsRunning] = useState(false)
  const client = useClient({ apiVersion: '2024-01-01' })

  const doc = draft || published

  if (!doc) return null
  if (!TRANSLATABLE_TYPES.includes(type)) return null

  return {
    label: isRunning ? 'Translating…' : '🌐 Translate with DeepL',
    disabled: isRunning || !doc.language,
    onHandle: async () => {
      if (!doc.language) {
        alert('Set the language on this document before translating.')
        return
      }
      setIsRunning(true)
      try {
        const created = await translateDocument(client, doc)
        const langs = created.map(c => c.lang.toUpperCase()).join(', ')
        alert(`Translated to ${langs}. New drafts saved — open them from the Documents panel to review and publish.`)
      } catch (err) {
        console.error(err)
        alert(`Translation failed: ${err.message}`)
      } finally {
        setIsRunning(false)
        onComplete?.()
      }
    },
  }
}
