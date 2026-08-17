import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { documentInternationalization } from '@sanity/document-internationalization'
import { schemaTypes } from './schemas'
import { TranslateWithDeepLAction } from './actions/TranslateAction'

const SUPPORTED_LANGUAGES = [
  { id: 'es', title: 'Español' },
  { id: 'en', title: 'English' },
  { id: 'de', title: 'Deutsch' },
]

const TRANSLATED_TYPES = ['post', 'project', 'research']

export default defineConfig({
  name: 'default',
  title: 'Coresearch Studio',
  projectId: '2lf16gxk',
  dataset: 'production',
  plugins: [
    structureTool(),
    visionTool(),
    documentInternationalization({
      supportedLanguages: SUPPORTED_LANGUAGES,
      schemaTypes: TRANSLATED_TYPES,
    }),
  ],
  schema: { types: schemaTypes },
  document: {
    actions: (prev, context) => {
      if (TRANSLATED_TYPES.includes(context.schemaType)) {
        return [...prev, TranslateWithDeepLAction]
      }
      return prev
    },
  },
})
