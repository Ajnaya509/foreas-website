import { Metadata } from 'next'
import HandoffBounce from './HandoffBounce'

export const metadata: Metadata = {
  title: 'FOREAS',
  robots: { index: false, follow: false },
}

/**
 * /h/[token] — page REBOND (mail → ouvre l'app FOREAS).
 * Brief : FOREAS-SHARED/briefs/AJNAYA_PAGE_REBOND_HANDOFF_SITE.md
 * Token opaque minté par le backend Pieuvre (/api/pieuvre/handoff/mint). La page ne fait que rebondir.
 */
export default async function HandoffPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <HandoffBounce token={token} />
}
