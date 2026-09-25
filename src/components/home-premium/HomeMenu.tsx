'use client'
import { useEffect, useRef, useState } from 'react'
import { Menu, X, ArrowUpRight } from 'lucide-react'
import HomeLink from './HomeLink'
import s from './home.module.css'

export default function HomeMenu({ login }: { login: string }) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); root.current?.querySelector('button')?.focus() } }
    const outside = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('keydown', close)
    document.addEventListener('pointerdown', outside)
    return () => { document.removeEventListener('keydown', close); document.removeEventListener('pointerdown', outside) }
  }, [open])
  return <div ref={root} className={s.mobileMenu}>
    <button className={s.menuButton} aria-expanded={open} aria-controls="home-navigation-mobile" aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'} onClick={() => setOpen(!open)}>{open ? <X size={22}/> : <Menu size={22}/>}</button>
    {open && <nav className={s.menuPanel} id="home-navigation-mobile" aria-label="Navigation sur téléphone" onClick={() => setOpen(false)}>
      <HomeLink href="/chauffeur">Découvrir l’application <ArrowUpRight size={18}/></HomeLink>
      <HomeLink href="/partenaire">Devenir partenaire <ArrowUpRight size={18}/></HomeLink>
      <a href="#questions">Tes questions <ArrowUpRight size={18}/></a>
      <a href={login}>Mon espace <ArrowUpRight size={18}/></a>
    </nav>}
  </div>
}
