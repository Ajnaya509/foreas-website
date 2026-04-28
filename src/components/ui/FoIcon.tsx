'use client'

import React from 'react'
import {
  Home,
  Users,
  MessageCircle,
  BarChart3,
  User,
  Play,
  Pause,
  RefreshCw,
  Share2,
  Settings,
  Check,
  AlertTriangle,
  AlertCircle,
  Info,
  Sparkles,
  Car,
  MapPin,
  Eye,
  Mic,
  Calculator,
  TrendingUp,
  Network,
  Globe,
  Search,
  type LucideIcon,
} from 'lucide-react'

/**
 * FOREAS FoIcon v2 — Site Vitrine
 *
 * Mirror du système d'icônes propriétaire FOREAS Driver (skill §9).
 * Wrapper unifié sur lucide-react avec les 24 noms canoniques exposés
 * comme dans l'app (cohérence cross-canal).
 *
 * - Jamais d'Ionicons côté user (skill §9)
 * - 24 noms canoniques uniquement
 * - Props : name, size (default 24), color (default currentColor), strokeWidth (default 2)
 *
 * Usage :
 *   <FoIcon name="ajnaya-eye" size={24} className="text-accent-cyan" />
 *   <FoIcon name="check" color="#10B981" />
 */

export type FoIconName =
  | 'home'
  | 'clients'
  | 'community'
  | 'reports'
  | 'profile'
  | 'play'
  | 'pause'
  | 'refresh'
  | 'share'
  | 'settings'
  | 'check'
  | 'warning'
  | 'alert'
  | 'info'
  | 'sparkle'
  | 'car'
  | 'map-pin'
  | 'ajnaya-eye'
  | 'voice'
  | 'calculator'
  | 'chart-line'
  | 'network'
  | 'globe'
  | 'search'

export interface FoIconProps {
  name: FoIconName
  size?: number
  color?: string
  strokeWidth?: number
  className?: string
  rtlMirror?: boolean   // skill §12 — flip auto en RTL
}

// Mapping noms canoniques → composants Lucide
const ICON_MAP: Record<FoIconName, LucideIcon> = {
  home: Home,
  clients: Users,
  community: MessageCircle,
  reports: BarChart3,
  profile: User,
  play: Play,
  pause: Pause,
  refresh: RefreshCw,
  share: Share2,
  settings: Settings,
  check: Check,
  warning: AlertTriangle,
  alert: AlertCircle,
  info: Info,
  sparkle: Sparkles,
  car: Car,
  'map-pin': MapPin,
  'ajnaya-eye': Eye,        // œil = signature Ajnaya
  voice: Mic,
  calculator: Calculator,
  'chart-line': TrendingUp,
  network: Network,
  globe: Globe,
  search: Search,
}

export function FoIcon({
  name,
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  className = '',
  rtlMirror = false,
}: FoIconProps) {
  const IconComponent = ICON_MAP[name]

  if (!IconComponent) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[FoIcon] Unknown icon name: "${name}"`)
    }
    return null
  }

  const classes = [
    rtlMirror ? 'rtl:scale-x-[-1]' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <IconComponent
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={classes}
      aria-hidden="true"
    />
  )
}

export default FoIcon
