import type { Metadata } from 'next'
import WhatsAppVerificationForm from '@/components/WhatsAppVerificationForm'

export const metadata: Metadata = {
  title: 'Vérification WhatsApp · FOREAS',
  robots: { index: false, follow: false },
}

export default function WhatsAppVerificationPage() {
  return (
    <main className="min-h-screen bg-[#07070B] px-5 py-12 text-white">
      <div className="mx-auto w-full max-w-md">
        <p className="mb-8 text-sm font-semibold tracking-[0.24em] text-white/70">FOREAS/</p>
        <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#8BE9FD]">Dernière étape</p>
          <h1 className="text-3xl font-semibold leading-tight">Prouve que ce numéro est bien le tien.</h1>
          <p className="mt-3 text-base leading-6 text-white/65">
            Entre le code reçu par SMS. Ensuite Ajnaya reprend sur WhatsApp, sans code caché dans ton message.
          </p>
          <WhatsAppVerificationForm />
        </section>
      </div>
    </main>
  )
}
