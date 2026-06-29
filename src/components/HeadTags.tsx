import { useEffect } from 'react'

interface HeadTagsProps {
  title?: string
  description?: string
  url?: string
  image?: string
  type?: 'website' | 'article'
  imageWidth?: number
  imageHeight?: number
  imageAlt?: string
}

const SITE_URL = 'https://erwinwilsonceniza.qzz.io'

const DEFAULT_OG_IMAGE = `${SITE_URL}/img/og-image.jpg`
const DEFAULT_TITLE = 'Erwin Wilson Ceniza — Full Stack Developer'
const DEFAULT_DESCRIPTION = '10+ years building enterprise ERP, LOB & AI applications. .NET, React, Angular, Node.js.'
const SITE_NAME = 'Erwin Wilson Ceniza Portfolio'

export const OG_DEFAULT_IMAGE = DEFAULT_OG_IMAGE
export const OG_SITE_NAME = SITE_NAME
export const OG_SITE_URL = SITE_URL

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  if (typeof document === 'undefined') return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setLink(rel: string, href: string) {
  if (typeof document === 'undefined') return
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function setTitle(value: string) {
  if (typeof document !== 'undefined') document.title = value
}

export default function HeadTags({
  title,
  description,
  url,
  image,
  type = 'website',
  imageWidth,
  imageHeight,
  imageAlt
}: HeadTagsProps) {
  const finalTitle = title ? `${title} — Erwin Wilson Ceniza` : DEFAULT_TITLE
  const finalDescription = description || DEFAULT_DESCRIPTION
  const finalUrl = url ? `${SITE_URL}${url.startsWith('/') ? url : `/${url}`}` : SITE_URL
  const finalImage = image || DEFAULT_OG_IMAGE

  useEffect(() => {
    setTitle(finalTitle)

    setMeta('name', 'description', finalDescription)

    setMeta('property', 'og:title', finalTitle)
    setMeta('property', 'og:description', finalDescription)
    setMeta('property', 'og:url', finalUrl)
    setMeta('property', 'og:image', finalImage)
    setMeta('property', 'og:type', type)
    setMeta('property', 'og:site_name', SITE_NAME)
    setMeta('property', 'og:locale', 'en_US')
    if (imageWidth) setMeta('property', 'og:image:width', String(imageWidth))
    if (imageHeight) setMeta('property', 'og:image:height', String(imageHeight))
    if (imageAlt) setMeta('property', 'og:image:alt', imageAlt)

    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', finalTitle)
    setMeta('name', 'twitter:description', finalDescription)
    setMeta('name', 'twitter:image', finalImage)
    if (imageAlt) setMeta('name', 'twitter:image:alt', imageAlt)

    setLink('canonical', finalUrl)
  }, [finalTitle, finalDescription, finalUrl, finalImage, type, imageWidth, imageHeight, imageAlt])

  useEffect(() => {
    return () => {
      if (!title) setMeta('property', 'og:title', DEFAULT_TITLE)
      if (!description) setMeta('property', 'og:description', DEFAULT_DESCRIPTION)
    }
  }, [title, description])

  return null
}
