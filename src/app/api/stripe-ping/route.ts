import { NextResponse } from 'next/server'
import https from 'https'

export async function GET() {
  return new Promise<NextResponse>((resolve) => {
    const key = process.env.STRIPE_SECRET_KEY || ''
    const start = Date.now()
    const priceId = process.env.STRIPE_PRICE_WEEKLY || 'price_1RvOx5K89oTss0SbHKIgcUoO'

    const req = https.request({
      hostname: 'api.stripe.com',
      port: 443,
      path: `/v1/prices/${priceId}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${key}`,
        'Stripe-Version': '2025-02-24.acacia',
      },
      timeout: 7000,
    }, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        const elapsed = Date.now() - start
        try {
          const json = JSON.parse(data)
          resolve(NextResponse.json({
            httpStatus: res.statusCode,
            elapsed_ms: elapsed,
            keyPrefix: key.substring(0, 14),
            priceId: json.id || null,
            stripeError: json.error || null,
          }))
        } catch {
          resolve(NextResponse.json({ httpStatus: res.statusCode, elapsed_ms: elapsed, raw: data.substring(0, 300) }))
        }
      })
    })

    req.on('error', (err: NodeJS.ErrnoException) => {
      resolve(NextResponse.json({
        networkError: err.message,
        code: err.code,
        elapsed_ms: Date.now() - start,
        keyPrefix: key.substring(0, 14),
      }, { status: 500 }))
    })

    req.on('timeout', () => {
      req.destroy()
      resolve(NextResponse.json({ networkError: 'TIMEOUT_7s', elapsed_ms: Date.now() - start }, { status: 500 }))
    })

    req.end()
  })
}
