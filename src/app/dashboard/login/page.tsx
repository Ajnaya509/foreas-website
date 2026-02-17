'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardLogin() {
  const router = useRouter()
  const [role, setRole] = useState<'driver' | 'partner'>('driver')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // TODO: Supabase auth — pour l'instant on redirige directement
    setTimeout(() => {
      router.push(role === 'driver' ? '/dashboard/driver' : '/dashboard/partner')
    }, 800)
  }

  return (
    <main className="min-h-screen bg-[#050508] flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-accent-purple/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[300px] h-[300px] bg-accent-cyan/[0.03] rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-purple to-accent-cyan mb-4">
            <span className="text-white font-bold text-2xl font-title">F</span>
          </div>
          <h1 className="font-title text-3xl text-white mb-2">Dashboard FOREAS</h1>
          <p className="text-white/40 text-sm">Connectez-vous pour accéder à votre espace</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#0a0a12] border border-white/[0.08] rounded-2xl p-8">
          {/* Role Toggle */}
          <div className="flex gap-2 p-1 bg-white/[0.04] rounded-xl mb-8">
            <button
              onClick={() => setRole('driver')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                role === 'driver'
                  ? 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/20'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              Chauffeur
            </button>
            <button
              onClick={() => setRole('partner')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                role === 'partner'
                  ? 'bg-accent-purple/15 text-accent-purple border border-accent-purple/20'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              Partenaire
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-white/50 text-xs font-medium mb-2 uppercase tracking-wider">
                {role === 'driver' ? 'Email ou téléphone' : 'Email professionnel'}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={role === 'driver' ? 'votre@email.com' : 'contact@votreflotte.com'}
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-accent-cyan/40 focus:ring-1 focus:ring-accent-cyan/20 transition-all text-sm"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-white/50 text-xs font-medium mb-2 uppercase tracking-wider">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-accent-cyan/40 focus:ring-1 focus:ring-accent-cyan/20 transition-all text-sm"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all duration-300 ${
                role === 'driver'
                  ? 'bg-gradient-to-r from-accent-cyan to-accent-cyan/80 hover:shadow-lg hover:shadow-accent-cyan/20'
                  : 'bg-gradient-to-r from-accent-purple to-accent-purple/80 hover:shadow-lg hover:shadow-accent-purple/20'
              } ${loading ? 'opacity-60 cursor-wait' : 'hover:scale-[1.01] active:scale-[0.99]'}`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                  </svg>
                  Connexion...
                </span>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-white/20 text-xs">ou</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* OTP Login for drivers */}
          {role === 'driver' && (
            <button className="w-full py-3 rounded-xl border border-white/[0.08] text-white/50 hover:text-white/70 hover:border-white/[0.15] transition-all text-sm font-medium">
              Connexion par SMS (OTP)
            </button>
          )}

          {role === 'partner' && (
            <p className="text-center text-white/30 text-xs">
              Pas encore partenaire ?{' '}
              <a href="/509#contact" className="text-accent-purple hover:text-accent-purple/80 transition-colors">
                Contactez-nous
              </a>
            </p>
          )}
        </div>

        {/* Back to site */}
        <p className="text-center mt-6">
          <a href="/509" className="text-white/20 hover:text-white/40 text-xs transition-colors">
            ← Retour au site
          </a>
        </p>
      </motion.div>
    </main>
  )
}
