import dynamic from 'next/dynamic'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import Stats from '@/components/Stats'
import GradientLine from '@/components/GradientLine'

// Lazy load below-fold components — reduces initial JS bundle on mobile
const ScrollMapAnimation = dynamic(() => import('@/components/ScrollMapAnimation'))
const Features = dynamic(() => import('@/components/Features'))
const AjnayaChatScroll = dynamic(() => import('@/components/AjnayaChatScroll'))
const AppDemo = dynamic(() => import('@/components/AppDemo'))
const RevenueSimulator = dynamic(() => import('@/components/RevenueSimulator'))
const Testimonials = dynamic(() => import('@/components/Testimonials'))
const DownloadSection = dynamic(() => import('@/components/DownloadSection'))
const CTA = dynamic(() => import('@/components/CTA'))
const Footer = dynamic(() => import('@/components/Footer'))

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <Stats />
      <GradientLine className="py-8" />

      {/* Apple-style scroll animation */}
      <ScrollMapAnimation />

      <Features />
      <GradientLine className="py-8" />

      {/* Ajnaya chat conversation scroll */}
      <AjnayaChatScroll />

      <GradientLine className="py-8" />

      {/* Interactive app demo */}
      <AppDemo />

      {/* Revenue simulator */}
      <RevenueSimulator />

      <GradientLine className="py-8" />

      {/* Testimonials */}
      <Testimonials />

      {/* Download section with store buttons */}
      <DownloadSection />

      <CTA />
      <Footer />
    </main>
  )
}
