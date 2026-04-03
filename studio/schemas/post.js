export default {
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
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
      options: { source: 'title', maxLength: 96 },
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

        // ── Video embed (YouTube / Vimeo) ─────────────────────────
        {
          type: 'object',
          name: 'videoEmbed',
          title: 'Video',
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
      author: 'author.name',
      media: 'mainImage',
    },
    prepare({ title, author, media }) {
      return {
        title,
        subtitle: author ? `by ${author}` : 'No author',
        media,
      }
    },
  },
}
