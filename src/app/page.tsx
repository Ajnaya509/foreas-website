import type { Metadata } from 'next'
import Home from '@/components/home-premium/Home'
import MesureVue from '@/components/mesure/MesureVue'
import { metadonneesPage, URL_SITE } from '@/lib/site'

export const metadata: Metadata = metadonneesPage('/', 'FOREAS — Un prix ne fait pas une bonne course.', 'Découvre FOREAS Driver : estime tes courses, suis ton activité et garde le lien avec tes clients. L’application des chauffeurs VTC, sur iPhone et Android.')

export default function AccueilPage() {
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({'@context':'https://schema.org','@type':'WebSite',name:'FOREAS',url:URL_SITE,inLanguage:'fr-FR'})}}/>
    <MesureVue page="/" intention="general" audience="chauffeur" variante="accueil-marque"/>
    <Home/>
  </>
}
