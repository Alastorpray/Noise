import React from 'react'
import { urlFor } from './sanityClient'
import { VideoPlayer } from './VideoPlayer'
import { getVideoEmbedUrl } from './utils/videoEmbed'

// Shared renderer for the `body` field of projects and research entries.
// The blog keeps its own set — it adds callouts, code blocks and dividers.
export const ptComponents = {
  types: {
    image: ({ value }) => {
      if (!value?.asset?._ref) return null
      return (
        <figure className="blog-figure">
          <img
            alt={value.alt || ' '}
            loading="lazy"
            src={urlFor(value).width(1000).fit('max').auto('format').url()}
            className="blog-post-img"
          />
          {value.caption && <figcaption className="blog-img-caption">{value.caption}</figcaption>}
        </figure>
      )
    },

    videoFile: ({ value }) => {
      if (!value?.url) return null
      return (
        <figure className="blog-figure">
          <VideoPlayer
            src={value.url}
            poster={value.poster ? urlFor(value.poster).width(1200).auto('format').url() : undefined}
            autoPlay={Boolean(value.loop)}
            loop={Boolean(value.loop)}
            label={value.caption}
          />
          {value.caption && <figcaption className="blog-img-caption">{value.caption}</figcaption>}
        </figure>
      )
    },

    videoEmbed: ({ value }) => {
      const embedUrl = getVideoEmbedUrl(value.url)
      if (!embedUrl) return null
      return (
        <figure className="blog-video-embed">
          <div className="blog-video-embed-wrapper">
            <iframe
              src={embedUrl}
              title={value.caption || 'Video'}
              allowFullScreen
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
          {value.caption && <figcaption className="blog-img-caption">{value.caption}</figcaption>}
        </figure>
      )
    },
  },

  block: {
    h2: ({ children }) => <h2 className="blog-post-h2">{children}</h2>,
    h3: ({ children }) => <h3 className="blog-post-h3">{children}</h3>,
    h4: ({ children }) => <h4 className="blog-post-h4">{children}</h4>,
    normal: ({ children }) => <p className="blog-post-p">{children}</p>,
    blockquote: ({ children }) => <blockquote className="blog-post-blockquote">{children}</blockquote>,
  },

  list: {
    bullet: ({ children }) => <ul className="blog-post-ul">{children}</ul>,
    number: ({ children }) => <ol className="blog-post-ol">{children}</ol>,
  },

  marks: {
    link: ({ value, children }) => (
      <a
        href={value.href}
        target={value.blank ? '_blank' : '_self'}
        rel={value.blank ? 'noopener noreferrer' : undefined}
        className="blog-link"
      >
        {children}
      </a>
    ),
    strong: ({ children }) => <strong>{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    underline: ({ children }) => <span style={{ textDecoration: 'underline' }}>{children}</span>,
    'strike-through': ({ children }) => <s>{children}</s>,
  },
}

// GROQ projection that resolves uploaded video assets inside a `body` field.
export const BODY_PROJECTION = `body[]{
  ...,
  _type == "videoFile" => { ..., "url": file.asset->url }
}`
