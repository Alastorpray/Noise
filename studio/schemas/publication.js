export default {
  name: 'publication',
  title: 'Publication',
  type: 'document',
  fields: [
    {
      name: 'language',
      type: 'string',
      readOnly: true,
    },
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'refCode',
      title: 'Reference code',
      type: 'string',
      description: 'Archive reference, e.g. CRS-2026-001. Shared across translations.',
    },
    {
      name: 'fieldOfStudy',
      title: 'Field of study',
      type: 'string',
      description: 'E.g. Ornithology, Additive Manufacturing, Archaeology…',
    },
    {
      name: 'origin',
      title: 'Origin (internal record)',
      type: 'string',
      description: 'Internal only — never displayed on the public website.',
      options: {
        list: [
          { title: 'In-house', value: 'inHouse' },
          { title: 'Commissioned (external specialist)', value: 'commissioned' },
        ],
        layout: 'radio'
      },
      initialValue: 'inHouse'
    },
    {
      name: 'researcher',
      title: 'External researcher (internal record)',
      type: 'string',
      description: 'Internal only — never displayed on the public website.',
      hidden: ({ document }) => document?.origin !== 'commissioned',
    },
    {
      name: 'abstract',
      title: 'Abstract',
      type: 'text',
      rows: 5,
      description: 'Short summary shown in the publications index.',
    },
    {
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
    },
    {
      name: 'pdfFile',
      title: 'PDF',
      type: 'file',
      options: { accept: 'application/pdf' },
    },
    {
      name: 'doi',
      title: 'DOI / external link',
      type: 'url',
      validation: Rule => Rule.uri({ scheme: ['http', 'https'] })
    },
  ],

  preview: {
    select: {
      title: 'title',
      refCode: 'refCode',
      fieldOfStudy: 'fieldOfStudy',
      language: 'language',
    },
    prepare({ title, refCode, fieldOfStudy, language }) {
      return {
        title,
        subtitle: [refCode, fieldOfStudy, language?.toUpperCase()].filter(Boolean).join(' · '),
      }
    },
  },
}
