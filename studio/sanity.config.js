import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { documentInternationalization } from '@sanity/document-internationalization'
import { schemaTypes } from './schemas'
import { TranslateWithDeepLAction } from './actions/TranslateAction'
import { TRANSLATABLE_TYPES } from './lib/translate'
import { structure } from './structure'

const SUPPORTED_LANGUAGES = [
  { id: 'es', title: 'Español' },
  { id: 'en', title: 'English' },
]

const TRANSLATED_TYPES = TRANSLATABLE_TYPES

export default defineConfig({
  name: 'default',
  title: 'Coresearch Studio',
  projectId: '2lf16gxk',
  dataset: 'production',
  plugins: [
    structureTool({ structure }),
    visionTool(),
    documentInternationalization({
      supportedLanguages: SUPPORTED_LANGUAGES,
      schemaTypes: TRANSLATED_TYPES,
    }),
  ],
  schema: {
    types: schemaTypes,
    // Lets a project's "Log entries" list create entries already tied to it
    templates: (prev) => [
      ...prev,
      {
        id: 'log-entry-by-project',
        title: 'Log entry for project',
        schemaType: 'post',
        parameters: [{ name: 'projectKey', type: 'string' }],
        value: ({ projectKey }) => ({ projectKey }),
      },
    ],
  },
  document: {
    actions: (prev, context) => {
      if (TRANSLATED_TYPES.includes(context.schemaType)) {
        return [...prev, TranslateWithDeepLAction]
      }
      return prev
    },
  },
})
