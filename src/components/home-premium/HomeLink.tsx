'use client'
import { useEffect, useState, type AnchorHTMLAttributes } from 'react'
import { mesurer } from '@/lib/mesure'

function withAttribution(href: string) {
    const target = new URL(href, window.location.origin)
    const source = new URLSearchParams(window.location.search)
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref', 'partner']) {
      const value = source.get(key)
      if (value && !target.searchParams.has(key)) target.searchParams.set(key, value.slice(0, 120))
    }
    return target.href
}

export default function HomeLink({ children, href, event, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; event?: string }) {
  const [destination, setDestination] = useState(href)
  useEffect(() => {
    const update = () => setDestination(withAttribution(href))
    update()
    window.addEventListener('popstate', update)
    return () => window.removeEventListener('popstate', update)
  }, [href])
  return <a {...props} href={destination} onClick={(e) => {
    e.currentTarget.href = withAttribution(href)
    if (event) mesurer('PrimaryCTAClick', { page: '/', intention: href.includes('partenaire') ? 'partenaire' : 'general', promesse: e.currentTarget.textContent?.trim(), detail: { action: event } })
  }}>{children}</a>
}
