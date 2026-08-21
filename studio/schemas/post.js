// Kept as `post` so existing documents and the disabled /blog route stay valid.
// In practice these are the dated log entries shown inside a project page.
export default {
  name: 'post',
  title: 'Log entry',
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
      options: {
        source: 'title',
        maxLength: 96,
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
      validation: Rule => Rule.required()
    },
    {
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: { type: 'author' },
    },
    {
      name: 'mainImage',
      title: 'Main image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        {
          name: 'alt',
          title: 'Alt text',
          type: 'string',
        }
      ]
    },
    {
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{ type: 'reference', to: { type: 'category' } }],
    },
    {
      name: 'projectKey',
      title: 'Project',
      type: 'string',
      description: 'Slug of the project this entry belongs to, e.g. "kiosk-museo". Deliberately a plain slug and not a reference: the slug is shared across EN/ES/DE, so it survives auto-translation. Leave empty for a standalone entry.',
      validation: Rule => Rule.regex(/^[a-z0-9-]+$/, { name: 'slug' }).warning('Should look like a slug: lowercase, numbers and hyphens')
    },
    {
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
    },
    {
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      description: 'Short summary shown in blog listing cards.',
    },
    {
      name: 'body',
      title: 'Body',
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
              { title: 'Code', value: 'code' },
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
              },
              {
                name: 'highlight',
                type: 'object',
                title: 'Highlight',
                fields: [
                  {
                    name: 'color',
                    title: 'Color',
                    type: 'string',
                    options: {
                      list: [
                        { title: 'Orange', value: 'orange' },
                        { title: 'Cyan', value: 'cyan' },
                        { title: 'Green', value: 'green' },
                      ],
                      layout: 'radio'
                    },
                    initialValue: 'orange'
                  }
                ]
              }
            ]
          }
        },

        // ── Image with caption ────────────────────────────────────
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

        // ── Code block ────────────────────────────────────────────
        {
          type: 'object',
          name: 'codeBlock',
          title: 'Code Block',
          fields: [
            {
              name: 'language',
              title: 'Language',
              type: 'string',
              options: {
                list: [
                  { title: 'JavaScript', value: 'javascript' },
                  { title: 'TypeScript', value: 'typescript' },
                  { title: 'Python', value: 'python' },
                  { title: 'Bash / Shell', value: 'bash' },
                  { title: 'CSS', value: 'css' },
                  { title: 'HTML', value: 'html' },
                  { title: 'JSON', value: 'json' },
                  { title: 'GLSL', value: 'glsl' },
                  { title: 'Plain Text', value: 'text' },
                ],
                layout: 'dropdown'
              },
              initialValue: 'javascript'
            },
            {
              name: 'filename',
              title: 'Filename (optional)',
              type: 'string',
            },
            {
              name: 'code',
              title: 'Code',
              type: 'text',
              rows: 12,
            },
          ],
          preview: {
            select: { language: 'language', filename: 'filename', code: 'code' },
            prepare({ language, filename, code }) {
              return {
                title: filename || `Code — ${language || 'text'}`,
                subtitle: code?.slice(0, 60)
              }
            }
          }
        },

        // ── Callout / Note ────────────────────────────────────────
        {
          type: 'object',
          name: 'callout',
          title: 'Callout',
          fields: [
            {
              name: 'type',
              title: 'Type',
              type: 'string',
              options: {
                list: [
                  { title: '💡 Tip', value: 'tip' },
                  { title: 'ℹ️ Info', value: 'info' },
                  { title: '⚠️ Warning', value: 'warning' },
                  { title: '🚨 Danger', value: 'danger' },
                ],
                layout: 'radio'
              },
              initialValue: 'info'
            },
            {
              name: 'text',
              title: 'Text',
              type: 'text',
              rows: 3,
            }
          ],
          preview: {
            select: { type: 'type', text: 'text' },
            prepare({ type, text }) {
              const icons = { tip: '💡', info: 'ℹ️', warning: '⚠️', danger: '🚨' }
              return {
                title: `${icons[type] || 'ℹ️'} Callout`,
                subtitle: text?.slice(0, 60)
              }
            }
          }
        },

        // ── Video: uploaded file or YouTube / Vimeo link ──────────
        {
          type: 'object',
          name: 'video',
          title: 'Video',
          fields: [
            {
              name: 'source',
              title: 'Source',
              type: 'string',
              options: {
                list: [
                  { title: 'Upload a file', value: 'upload' },
                  { title: 'YouTube / Vimeo link', value: 'embed' }
                ],
                layout: 'radio'
              },
              initialValue: 'upload',
              validation: Rule => Rule.required()
            },
            {
              name: 'file',
              title: 'Video file',
              type: 'file',
              options: { accept: 'video/*' },
              hidden: ({ parent }) => parent?.source !== 'upload',
              validation: Rule => Rule.custom((file, context) =>
                context.parent?.source === 'upload' && !file?.asset
                  ? 'Upload a video file'
                  : true
              )
            },
            {
              name: 'url',
              title: 'YouTube or Vimeo URL',
              type: 'url',
              hidden: ({ parent }) => parent?.source !== 'embed',
              validation: Rule => Rule
                .uri({ scheme: ['http', 'https'] })
                .custom((url, context) =>
                  context.parent?.source === 'embed' && !url
                    ? 'Paste the video URL'
                    : true
                )
            },
            {
              name: 'poster',
              title: 'Poster image',
              type: 'image',
              options: { hotspot: true },
              description: 'Frame shown before playback starts',
              // YouTube and Vimeo bring their own thumbnail
              hidden: ({ parent }) => parent?.source !== 'upload'
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
              description: 'Autoplay muted on repeat, for short clips',
              initialValue: false,
              hidden: ({ parent }) => parent?.source !== 'upload'
            }
          ],
          preview: {
            select: { source: 'source', caption: 'caption', url: 'url', media: 'poster' },
            prepare({ source, caption, url, media }) {
              return {
                title: caption || 'Video',
                subtitle: source === 'embed' ? (url || 'Link') : 'Uploaded file',
                media
              }
            }
          }
        },

        // ── Divider ───────────────────────────────────────────────
        {
          type: 'object',
          name: 'divider',
          title: 'Divider',
          fields: [
            {
              name: 'style',
              title: 'Style',
              type: 'string',
              options: {
                list: [
                  { title: '— Line', value: 'line' },
                  { title: '· · · Dots', value: 'dots' },
                  { title: 'Space only', value: 'space' },
                ],
                layout: 'radio'
              },
              initialValue: 'line'
            }
          ],
          preview: {
            select: { style: 'style' },
            prepare({ style }) {
              const labels = { line: '— Line divider', dots: '· · · Dots divider', space: 'Space' }
              return { title: labels[style] || 'Divider' }
            }
          }
        },
      ]
    },
  ],

  preview: {
    select: {
      title: 'title',
      projectKey: 'projectKey',
      publishedAt: 'publishedAt',
      language: 'language',
      media: 'mainImage',
    },
    prepare({ title, projectKey, publishedAt, language, media }) {
      const parts = [
        language?.toUpperCase(),
        publishedAt ? publishedAt.slice(0, 10) : 'undated',
        projectKey || 'standalone',
      ].filter(Boolean)
      return { title, subtitle: parts.join(' · '), media }
    },
  },
}
