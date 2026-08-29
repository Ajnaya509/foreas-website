/**
 * LA MATÉRIALISATION — port Canvas du shader SkSL de l'app.
 *
 * Source : FOREAS-SHARED/DEMO_MODALE_AJNAYA/demo-modale-ajnaya.html, fonction
 * `materialiser()`, écrite par le fil Pieuvre d'après `MaterializingBlock.tsx`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE C'EST, ET CE QUE CE N'EST PAS
 *
 * Ce n'est **ni** un fondu lettre par lettre, **ni** des particules ajoutées :
 * c'est une PHOTO du bloc, découpée en cellules carrées, chaque cellule
 * devenant UN disque qui dérive puis revient à sa place, pendant que le vrai
 * texte monte en fondu dessous.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ LES TROIS PIÈGES, TOUS PAYÉS AVANT NOUS
 *
 * 1. LA TOILE EST POSITIONNÉE EN LIGNE, JAMAIS PAR UNE CLASSE.
 *    Le bug qui a coûté trois allers-retours au fil Pieuvre : la feuille de
 *    style visait `.aj-mater canvas`, mais le script ne posait jamais cette
 *    classe. La toile restait en flux normal, ajoutée SOUS le texte — un
 *    rectangle transparent invisible qui écartait la bulle sans rien montrer.
 *
 * 2. LE TEXTE A SON PROPRE CALQUE, ET LA TOILE EST SA SŒUR.
 *    Si la toile est un ENFANT de l'élément dont on anime l'opacité, elle
 *    hérite de 0 pendant toute la phase de poussière et ne se voit jamais.
 *
 * 3. JAMAIS `globalCompositeOperation = 'lighter'`.
 *    Le shader d'origine fait « le plus proche gagne », il n'accumule pas.
 *    `lighter` ferait briller les recouvrements. On dessine donc sur une
 *    couche intermédiaire à alpha plein, puis on compose la couche entière
 *    une seule fois.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ UNE SEULE DIFFÉRENCE AVEC LA DÉMO, ET ELLE EST UNE CORRECTION
 *
 * La démo peignait la photo avec `'400 15px Inter, system-ui'`, en dur. Sur ce
 * site la police est chargée par `next/font`, qui HACHE le nom de la famille :
 * « Inter » n'existe pas sous ce nom, et on photographierait donc une police
 * de repli tout en affichant l'autre — les grains ne colleraient pas aux
 * lettres. On lit la police RÉELLEMENT calculée sur l'élément. C'est même le
 * fond de la règle : on photographie ce qu'on affiche.
 */

/** Marge autour du bloc, pour que la dérive ne soit pas coupée. */
const PAD = 18

/**
 * ⚠️ LIBERTÉ ASSUMÉE, DIFFÉRENTE DE L'APP — et le fil Pieuvre la nomme.
 * L'app utilise `cellPx` 2,476 et une dérive de ±5/±6 px : à la taille réelle
 * d'un téléphone c'est juste. Ici l'écran est réduit d'un quart et regardé de
 * loin ; à ces valeurs les grains se voyaient à peine et l'effet lisait comme
 * un simple fondu. On resserre la grille et on allonge la dérive.
 * Les DURÉES de l'app, elles, sont gardées telles quelles.
 */
const CELL = 1.9
const DERIVE_X = 15
const DERIVE_Y = 18

/** Les durées de l'app, multipliées par 1,7 — voir `K` plus bas. */
const K = 1.7

function frac(x: number): number {
  return x - Math.floor(x)
}

export function mouvementReduit(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * Fait apparaître le contenu de `hote` en poussière.
 * Rend une fonction d'arrêt : à appeler au démontage, sinon une animation
 * continue de tourner sur un élément que React a déjà retiré.
 */
export function materialiser(hote: HTMLElement, index: number): () => void {
  if (mouvementReduit()) return () => {}

  const texte = (hote.textContent || '').replace(/\s+/g, ' ').trim()
  const W = hote.offsetWidth
  const H = hote.offsetHeight
  if (!W || !H || !texte) return () => {}

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const cw = W + PAD * 2
  const ch = H + PAD * 2

  // 1 — LA PHOTO du bloc, redessinée à la main.
  const photo = document.createElement('canvas')
  photo.width = cw * dpr
  photo.height = ch * dpr
  const pc = photo.getContext('2d')
  if (!pc) return () => {}
  pc.scale(dpr, dpr)
  pc.fillStyle = 'rgba(248,250,252,0.92)'
  /* La police RÉELLEMENT affichée, pas un nom écrit en dur : avec next/font le
     nom de famille est haché. Voir l'en-tête de ce fichier. */
  const calc = window.getComputedStyle(hote)
  pc.font = `${calc.fontWeight} ${calc.fontSize} ${calc.fontFamily}`
  pc.textBaseline = 'top'

  const mots = texte.split(' ')
  let lig = ''
  let y = PAD + 2
  for (const mot of mots) {
    const essai = lig ? `${lig} ${mot}` : mot
    if (pc.measureText(essai).width > W && lig) {
      pc.fillText(lig, PAD, y)
      y += 22
      lig = mot
    } else {
      lig = essai
    }
  }
  if (lig) pc.fillText(lig, PAD, y)

  // 2 — LA GRILLE, lue une seule fois.
  let img: Uint8ClampedArray
  try {
    img = pc.getImageData(0, 0, photo.width, photo.height).data
  } catch {
    /* Toile souillée ou contexte indisponible : on renonce sans bruit, le
       texte reste lisible. Une poussière absente ne casse rien. */
    return () => {}
  }

  const seed = ((7 + index * 9) % 97) + 1
  const nx = Math.ceil(cw / CELL)
  const ny = Math.ceil(ch / CELL)
  const cells: { x: number; y: number; r: number; g: number; b: number; a: number; ox: number; oy: number }[] = []

  for (let cy = 0; cy < ny; cy++) {
    for (let cx = 0; cx < nx; cx++) {
      const px2 = (cx + 0.5) * CELL
      const py2 = (cy + 0.5) * CELL
      const ix = (Math.floor(py2 * dpr) * photo.width + Math.floor(px2 * dpr)) * 4
      const a = img[ix + 3] / 255
      if (a <= 0.02) continue
      cells.push({
        x: px2,
        y: py2,
        r: img[ix],
        g: img[ix + 1],
        b: img[ix + 2],
        a,
        ox: frac(Math.sin(cx * 127.1 + cy * 311.7 + seed) * 43758.5453) - 0.5,
        oy: frac(Math.sin(cx * 269.5 + cy * 183.3 + seed) * 43758.5453) - 0.5,
      })
    }
  }
  if (!cells.length) return () => {}

  // 3 — LA TOILE. ⚠️ TOUT EN LIGNE, JAMAIS EN CSS (piège n°1).
  const toile = document.createElement('canvas')
  toile.width = cw * dpr
  toile.height = ch * dpr
  const st = toile.style
  st.position = 'absolute'
  st.left = `${-PAD}px`
  st.top = `${-PAD}px`
  st.width = `${cw}px`
  st.height = `${ch}px`
  st.pointerEvents = 'none'
  st.zIndex = '3'
  const ctx = toile.getContext('2d')
  if (!ctx) return () => {}
  ctx.scale(dpr, dpr)

  const couche = document.createElement('canvas')
  couche.width = cw * dpr
  couche.height = ch * dpr
  const lc = couche.getContext('2d')
  if (!lc) return () => {}
  lc.scale(dpr, dpr)

  /* Le texte reçoit son propre calque : l'opacité s'applique à LUI, la toile
     est sa SŒUR et garde son opacité pleine (piège n°2). */
  let calque = hote.querySelector<HTMLElement>(':scope > .aj-txt')
  if (!calque) {
    calque = document.createElement('span')
    calque.className = 'aj-txt'
    calque.style.display = 'block'
    while (hote.firstChild) calque.appendChild(hote.firstChild)
    hote.appendChild(calque)
  }
  hote.style.position = 'relative'
  hote.appendChild(toile)

  // 4 — LES TROIS PISTES. Tout en Easing.linear dans l'app : aucune bézier ici.
  const t0 = performance.now()
  let vivant = true
  let trame = 0

  const frame = () => {
    if (!vivant) return
    const t = (performance.now() - t0) / K
    const amp =
      t < 33 ? 1 : t < 371 ? 1 - (0.706 * (t - 33)) / 338 : t < 670 ? 0.294 * (1 - (t - 371) / 299) : 0
    const dust =
      t < 98 ? 0.35 + (0.6 * t) / 98 : t < 553 ? 0.95 : t < 793 ? 0.95 * (1 - (t - 553) / 240) : 0
    const txt =
      t < 468 ? 0 : t < 767 ? (0.82 * (t - 468)) / 299 : t < 1092 ? 0.82 + (0.18 * (t - 767)) / 325 : 1
    calque.style.opacity = String(txt)

    ctx.clearRect(0, 0, cw, ch)
    if (dust > 0) {
      lc.clearRect(0, 0, cw, ch)
      if (amp < 0.015) {
        lc.drawImage(photo, 0, 0, cw, ch)
      } else {
        const r = 0.42 + 1.25 * (1 - amp)
        for (const c of cells) {
          const X = c.x + c.ox * DERIVE_X * amp
          const Y = c.y + c.oy * DERIVE_Y * amp
          const g = lc.createRadialGradient(X, Y, r, X, Y, r + 0.55)
          g.addColorStop(0, `rgba(${c.r},${c.g},${c.b},${c.a})`)
          g.addColorStop(1, `rgba(${c.r},${c.g},${c.b},0)`)
          lc.fillStyle = g
          lc.beginPath()
          lc.arc(X, Y, r + 0.55, 0, 6.2832)
          lc.fill()
        }
      }
      ctx.globalAlpha = dust
      ctx.drawImage(couche, 0, 0, cw, ch)
      ctx.globalAlpha = 1
    }

    if (t < 1312) trame = requestAnimationFrame(frame)
    else {
      toile.remove()
      calque.style.opacity = '1'
    }
  }
  trame = requestAnimationFrame(frame)

  /* ⚠️ L'ARRÊT N'EST PAS DÉCORATIF. React démonte les bulles quand la zone
     change ; sans ça, une boucle continuerait de peindre sur un élément retiré
     du document, et le calque resterait à une opacité intermédiaire. */
  return () => {
    vivant = false
    cancelAnimationFrame(trame)
    toile.remove()
    if (calque) calque.style.opacity = '1'
  }
}
