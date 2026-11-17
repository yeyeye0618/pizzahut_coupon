import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { TagListing, resolveTag, tagMetadata, tagPageParams } from '../listing'

export const revalidate = 3600
export const dynamicParams = true

type PageProps = { params: Promise<{ tag: string; page: string }> }

/** Pages 2..N only: page 1 lives at /tag/[tag] and has no number. */
function pageNumber(segment: string): number | null {
  return /^[1-9]\d*$/.test(segment) && segment !== '1' ? Number(segment) : null
}

export function generateStaticParams() {
  return tagPageParams('rest')
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tag, page } = await params
  const n = pageNumber(page)
  return tagMetadata(n ? await resolveTag(tag, n) : null)
}

export default async function TagNumberedPage({ params }: PageProps) {
  const { tag, page } = await params
  const n = pageNumber(page)
  const data = n ? await resolveTag(tag, n) : null
  if (!data) notFound()
  return <TagListing data={data} />
}
