import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemas'

export default defineConfig({
  name: 'coresearch',
  title: 'Coresearch Studio',
  projectId: '2lf16gxk',
  dataset: 'production',
  plugins: [structureTool(), visionTool()],
  schema: { types: schemaTypes }
})
