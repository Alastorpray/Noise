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
          { title: 'XR', value: 'xr' },
          { title: '3D Print', value: 'print3d' },
          { title: 'Educational', value: 'educational' },
          { title: 'Game Asset', value: 'gameAsset' }
        ],
        layout: 'radio'
      },
      validation: Rule => Rule.required()
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
      rows: 4
    },
    {
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' }
    },
    {
      name: 'date',
      title: 'Date',
      type: 'date'
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
      media: 'cover'
    },
    prepare({ title, division, media }) {
      return {
        title,
        subtitle: division?.toUpperCase(),
        media
      }
    }
  }
}
