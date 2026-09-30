import { apercuGroupe } from '@/lib/apercuGroupe'

export const dynamic = 'force-dynamic'

export function GET() {
  return apercuGroupe('facebook')
}
