'use client'

import { QRCodeSVG } from 'qrcode.react'
import Link from 'next/link'

export default function GoDesktopPage() {
  return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center px-4">
      <div className="text-center max-w-sm w-full">
        {/* Logo text */}
        <div className="mb-6">
          <span className="text-2xl font-bold tracking-widest text-white" style={{ fontFamily: 'Genos, sans-serif' }}>
            FOREAS
          </span>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Genos, sans-serif' }}>
          Télécharge FOREAS Driver
        </h1>
        <p className="text-gray-400 text-sm mb-8">
          Scanne ce QR code avec ton téléphone
        </p>

        {/* QR Code */}
        <div className="bg-white p-4 rounded-xl inline-block mb-8 shadow-[0_0_40px_rgba(0,212,255,0.15)]">
          <QRCodeSVG
            value="https://foreas.xyz/go"
            size={180}
            level="H"
            includeMargin={false}
            fgColor="#050508"
            bgColor="#ffffff"
          />
        </div>

        <p className="text-gray-500 text-xs mb-5">ou télécharge directement</p>

        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          <Link
            href="https://apps.apple.com/app/foreas-driver/id[APP_ID]"
            className="block w-full py-3 bg-[#00D4FF] text-[#050508] font-bold rounded-xl hover:bg-cyan-300 transition text-sm"
          >
            App Store (iOS)
          </Link>
          <Link
            href="https://play.google.com/store/apps/details?id=com.foreas.driver"
            className="block w-full py-3 bg-[#8C52FF] text-white font-bold rounded-xl hover:bg-purple-600 transition text-sm"
          >
            Google Play (Android)
          </Link>
        </div>

        <p className="text-xs text-gray-700 mt-8">
          © FOREAS Driver — Optimise tes revenus de chauffeur
        </p>
      </div>
    </div>
  )
}
