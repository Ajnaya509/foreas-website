import { notFound } from 'next/navigation'
import ApercuAbonnement from './ApercuAbonnement'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Aperçu de mon abonnement · FOREAS', robots: { index: false, follow: false } }
export default async function Page({ searchParams }: { searchParams: Promise<{ etat?: string }> }) {
  if (process.env.NODE_ENV === 'production') notFound()
  const { etat } = await searchParams
  return <ApercuAbonnement statut={etat === 'actif' ? 'active' : 'trialing'} date={new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString()} />
}
