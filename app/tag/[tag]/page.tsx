import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { TagListing, resolveTag, tagMetadata, NO_PRERENDER } from './listing'

// Rendered on first request (see listing.tsx), cached, and refreshed with the
// `coupons` cache tag.
export const revalidate = 3600
export const dynamicParams = true

type PageProps = { params: Promise<{ tag: string }> }

export function generateStaticParams() {
  return NO_PRERENDER
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tag } = await params
  return tagMetadata(await resolveTag(tag, 1))
}

export default async function TagFirstPage({ params }: PageProps) {
  const { tag } = await params
  const data = await resolveTag(tag, 1)
  if (!data) notFound()
  return <TagListing data={data} />
}
