const API_VERSION = '2024-01-01'

// A log entry belongs to a project, so it is created from inside that project
// rather than from a loose list where you would have to remember the slug.
// Opening a project gives you its fields plus its own entries.
export const structure = (S, context) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Projects')
        .child(
          S.documentTypeList('project')
            .title('Projects')
            .child(async (projectId) => {
              const client = context.getClient({ apiVersion: API_VERSION })
              const published = projectId.replace(/^drafts\./, '')
              const project = await client.fetch(
                `*[_id in [$published, $draft]] | order(_updatedAt desc)[0]{
                  "slug": slug.current, title
                }`,
                { published, draft: `drafts.${published}` }
              )
              const slug = project?.slug

              return S.list()
                .title(project?.title || 'Project')
                .items([
                  S.listItem()
                    .title('Project details')
                    .child(
                      S.document()
                        .documentId(projectId)
                        .schemaType('project')
                        .title(project?.title || 'Project')
                    ),
                  S.listItem()
                    .title('Log entries')
                    .child(
                      S.documentList()
                        .title('Log entries')
                        .schemaType('post')
                        .filter('_type == "post" && projectKey == $slug')
                        // Without a slug there is nothing to tie entries to yet;
                        // an unmatchable value keeps the list empty rather than
                        // showing every entry in the dataset.
                        .params({ slug: slug || '\u0000' })
                        .defaultOrdering([{ field: 'publishedAt', direction: 'desc' }])
                        // "Create" here prefills projectKey with this project's slug
                        .initialValueTemplates(
                          slug
                            ? [S.initialValueTemplateItem('log-entry-by-project', { projectKey: slug })]
                            : []
                        )
                        .canHandleIntent(
                          (intentName, params) =>
                            intentName !== 'create' || params.template === 'log-entry-by-project'
                        )
                    ),
                ])
            })
        ),

      S.listItem()
        .title('Research')
        .child(S.documentTypeList('research').title('Research')),

      S.divider(),

      S.listItem()
        .title('All log entries')
        .child(
          S.documentTypeList('post')
            .title('All log entries')
            .defaultOrdering([{ field: 'publishedAt', direction: 'desc' }])
        ),

      S.divider(),

      S.listItem()
        .title('Authors')
        .child(S.documentTypeList('author').title('Authors')),
      S.listItem()
        .title('Categories')
        .child(S.documentTypeList('category').title('Categories')),
    ])
