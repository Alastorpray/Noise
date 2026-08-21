export default {
  name: 'project',
  title: 'Project',
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
      name: 'division',
      title: 'Division',
      type: 'string',
      options: {
        list: [
          { title: 'Spatial Computing', value: 'spatial' },
          { title: '3D Print', value: 'print3d' },
          { title: 'Educational', value: 'educational' },
          { title: 'Game Asset', value: 'gameAsset' }
        ],
        layout: 'radio'
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      description: 'In progress projects are grouped at the top of the listing and lead with their log',
      options: {
        list: [
          { title: 'In progress', value: 'in-progress' },
          { title: 'Delivered', value: 'delivered' }
        ],
        layout: 'radio'
      },
      initialValue: 'delivered'
    },
    {
      name: 'cover',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true },
      validation: Rule => Rule.required()
    },
    {
      name: 'mediaType',
      title: 'Media Type',
      type: 'string',
      options: {
        list: [
          { title: 'Images', value: 'images' },
          { title: 'Video', value: 'video' }
        ],
        layout: 'radio'
      }
    },
    {
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
      hidden: ({ document }) => document?.mediaType !== 'images'
    },
    {
      name: 'video',
      title: 'Video File',
      type: 'file',
      options: { accept: 'video/*' },
      hidden: ({ document }) => document?.mediaType !== 'video'
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      description: 'Excerpt for the portfolio listing and the SEO meta description — not shown on the project page itself'
    },
    {
      name: 'client',
      title: 'Client',
      type: 'string',
      description: 'Leave empty if the client is confidential — the sector is shown instead'
    },
    {
      name: 'sector',
      title: 'Sector',
      type: 'string',
      description: 'Shown in place of the client name when there is none, e.g. "Museum" or "Medical devices"'
    },
    {
      name: 'role',
      title: 'Role',
      type: 'string',
      description: 'What Coresearch did on this project, e.g. "Design and development"'
    },
    {
      name: 'body',
      title: 'Case Study',
      description: 'Long-form content: mix text, images and videos in any order',
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
              description: 'Frame shown before playback starts'
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
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' }
    },
    {
      name: 'startedAt',
      title: 'Started',
      type: 'date',
      description: 'Start of the project — also drives the order of the listing'
    },
    {
      name: 'deliveredAt',
      title: 'Delivered',
      type: 'date',
      hidden: ({ document }) => document?.status === 'in-progress'
    },
    {
      name: 'date',
      title: 'Date (legacy)',
      type: 'date',
      description: 'Superseded by Started. Kept so older projects keep their date — fill in Started instead.'
    },
    {
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      description: 'Show this project highlighted at the top'
    }
  ],
  preview: {
    select: {
      title: 'title',
      division: 'division',
      status: 'status',
      media: 'cover'
    },
    prepare({ title, division, status, media }) {
      const wip = status === 'in-progress'
      return {
        title: wip ? `${title} — in progress` : title,
        subtitle: division?.toUpperCase(),
        media
      }
    }
  }
}
