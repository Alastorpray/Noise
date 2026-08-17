export default {
  name: 'research',
  title: 'Research',
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
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'Needed to give this entry its own page. Leave empty for a PDF/DOI-only record.',
      options: {
        source: 'title',
        isUnique: (slug, context) => {
          const { document, getClient } = context
          const client = getClient({ apiVersion: '2024-01-01' })
          const id = document._id.replace(/^drafts\./, '')
          const params = {
            draft: `drafts.${id}`,
            published: id,
            slug,
            language: document.language,
            type: document._type,
          }
          const query = `!defined(*[_type == $type && !(_id in [$draft, $published]) && slug.current == $slug && language == $language][0]._id)`
          return client.fetch(query, params)
        },
      },
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
      description: 'Short summary shown in the research index.',
    },
    {
      name: 'body',
      title: 'Full text',
      description: 'Read the study on the site itself. Needs a slug. Leave empty if the PDF is the whole record.',
      type: 'array',
      of: [
        // ── Rich text block ───────────────────────────────────────
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H2', value: 'h2' },
            { title: 'H3', value: 'h3' },
            { title: 'H4', value: 'h4' },
            { title: 'Quote', value: 'blockquote' },
          ],
          lists: [
            { title: 'Bullet', value: 'bullet' },
            { title: 'Numbered', value: 'number' },
          ],
          marks: {
            decorators: [
              { title: 'Bold', value: 'strong' },
              { title: 'Italic', value: 'em' },
              { title: 'Underline', value: 'underline' },
              { title: 'Strike', value: 'strike-through' },
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  {
                    name: 'href',
                    type: 'url',
                    title: 'URL',
                    validation: Rule => Rule.uri({ scheme: ['http', 'https', 'mailto'] })
                  },
                  {
                    name: 'blank',
                    title: 'Open in new tab',
                    type: 'boolean',
                    initialValue: true,
                  }
                ]
              }
            ]
          }
        },

        // ── Figure ────────────────────────────────────────────────
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alt text',
            },
            {
              name: 'caption',
              type: 'string',
              title: 'Caption',
            }
          ]
        },

        // ── Uploaded video file ───────────────────────────────────
        {
          type: 'object',
          name: 'videoFile',
          title: 'Video (upload)',
          fields: [
            {
              name: 'file',
              title: 'Video file',
              type: 'file',
              options: { accept: 'video/*' },
              validation: Rule => Rule.required()
            },
            {
              name: 'poster',
              title: 'Poster image',
              type: 'image',
              options: { hotspot: true },
            },
            {
              name: 'caption',
              title: 'Caption',
              type: 'string'
            },
            {
              name: 'loop',
              title: 'Loop silently',
              type: 'boolean',
              initialValue: false
            }
          ],
          preview: {
            select: { caption: 'caption', media: 'poster' },
            prepare({ caption, media }) {
              return { title: caption || 'Video', subtitle: 'Uploaded file', media }
            }
          }
        },

        // ── Video embed (YouTube / Vimeo) ─────────────────────────
        {
          type: 'object',
          name: 'videoEmbed',
          title: 'Video (YouTube / Vimeo)',
          fields: [
            {
              name: 'url',
              title: 'YouTube or Vimeo URL',
              type: 'url',
              validation: Rule => Rule.required()
            },
            {
              name: 'caption',
              title: 'Caption',
              type: 'string'
            }
          ],
          preview: {
            select: { url: 'url', caption: 'caption' },
            prepare({ url, caption }) {
              return { title: caption || 'Video', subtitle: url }
            }
          }
        }
      ]
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
