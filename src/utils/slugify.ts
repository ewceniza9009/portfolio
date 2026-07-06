/**
 * Shared heading-slug generator for the blog.
 *
 * Used by both `parseMarkdown` (to attach `id` attributes to rendered headings)
 * and `BlogPostPage`'s TOC generator (to produce anchor links that match those
 * IDs). Both call sites must use the same algorithm or TOC links will point at
 * the wrong anchor when duplicate heading text exists in one article.
 *
 * De-duplication: the first occurrence of a base slug keeps the bare slug;
 * subsequent occurrences get `-2`, `-3`, ... appended (counter starts at 2 so
 * the first duplicate is unambiguously distinguishable from the original).
 */
export function slugifyHeading(
  text: string,
  counter: Map<string, number>,
): string {
  const stripped = text.replace(/[*_`~\[\]\(\)#]/g, '').trim()
  const base =
    stripped
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'section'

  const seen = counter.get(base) ?? 0
  counter.set(base, seen + 1)
  return seen === 0 ? base : `${base}-${seen + 1}`
}
