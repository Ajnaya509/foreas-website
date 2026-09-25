import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { PALETTE } from '@/design/tokens'

export const runtime = 'nodejs'
export const alt = 'Programme partenaire FOREAS Driver. 10 € par mensualité admissible payée, après deux mois consécutifs payés, ou 50 € au premier paiement annuel admissible.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function PartnerShareImage() {
  const [genos, body] = await Promise.all([
    readFile(join(process.cwd(), 'public/fonts/Genos-og.ttf')),
    readFile(join(process.cwd(), 'public/fonts/Montserrat-Medium.ttf')),
  ])
  return new ImageResponse(<div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',justifyContent:'space-between',padding:'56px 64px',background:PALETTE.obsidian,color:PALETTE.textHero,fontFamily:'Montserrat'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{fontFamily:'Genos',fontSize:42,fontWeight:700,letterSpacing:5}}>FOREAS</span><span style={{fontSize:18,color:PALETTE.textSecondary}}>PROGRAMME PARTENAIRE</span></div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:50}}>
      <div style={{display:'flex',flexDirection:'column',fontFamily:'Genos',fontSize:76,fontWeight:700,lineHeight:1}}><span>Votre réseau mérite</span><span style={{color:PALETTE.cyanIce}}>plus qu’un merci.</span></div>
      <div style={{display:'flex',flexDirection:'column',gap:24,width:380,borderLeft:`2px solid ${PALETTE.glassBorderHigh}`,paddingLeft:40}}><div style={{display:'flex',flexDirection:'column'}}><span style={{fontFamily:'Genos',fontSize:76,fontWeight:700}}>10 €</span><span style={{fontSize:18,lineHeight:1.4}}>par mois payé, après deux mois consécutifs payés</span></div><div style={{display:'flex',flexDirection:'column'}}><span style={{fontFamily:'Genos',fontSize:76,fontWeight:700}}>50 €</span><span style={{fontSize:18,lineHeight:1.4}}>au premier paiement annuel admissible</span></div></div>
    </div>
    <div style={{display:'flex',justifyContent:'space-between',fontSize:16,color:PALETTE.textSecondary}}><span>Recommandez FOREAS Driver. Présentez votre activité.</span><span>foreas.xyz/partenariat</span></div>
  </div>, {...size, fonts:[{name:'Genos',data:genos,style:'normal',weight:700},{name:'Montserrat',data:body,style:'normal',weight:500}]})
}
