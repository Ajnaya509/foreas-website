import Header from '@/components/Header'
import Hero from '@/components/Hero'
import Stats from '@/components/Stats'
import Features from '@/components/Features'
import CTA from '@/components/CTA'
import Footer from '@/components/Footer'
import GradientLine from '@/components/GradientLine'
import ScrollMapAnimation from '@/components/ScrollMapAnimation'
import RevenueSimulator from '@/components/RevenueSimulator'
import Testimonials from '@/components/Testimonials'
import AppDemo from '@/components/AppDemo'
import DownloadSection from '@/components/DownloadSection'

export default function Home() {
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
