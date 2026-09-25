import { createHmac } from 'node:crypto'
import { isIP } from 'node:net'

/** Only the hosting proxy may supply the address. Never store the raw address. */
export function partnerRateKey(headers: Headers, env: NodeJS.ProcessEnv = process.env): string | null {
  const secret = env.PARTNER_RATE_LIMIT_SECRET || env.PASSAGE_HMAC_SECRET
  if (!secret || secret.length < 32) return null
  const address = env.VERCEL === '1'
    ? headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()
    : env.NODE_ENV !== 'production' ? '127.0.0.1' : null
  if (!address || !isIP(address)) return null
  return createHmac('sha256', secret).update('partner-application.v1|' + address).digest('hex')
}
