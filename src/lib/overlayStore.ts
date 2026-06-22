'use client'

/**
 * overlayStore — petit store global (compteur) pour savoir si un overlay/modal
 * plein écran est ouvert sur le site. Équivalent SITE du compteur OverlayVisibility
 * du fil App (même principe, repo séparé — on ne mélange pas).
 *
 * Pourquoi un COMPTEUR et pas un booléen : plusieurs overlays peuvent se chevaucher
 * (ex. modal Ajnaya + menu mobile). On n'affiche le widget que quand le compteur = 0.
 *
 * Pas de Provider : useSyncExternalStore lit un store module-level, donc ça marche
 * pour des composants situés à des endroits différents de l'arbre (widget dans le
 * layout, modals dans les pages) sans plomberie de Context.
 *
 * SSR-safe : getServerSnapshot renvoie 0 (aucun overlay ouvert au 1er rendu serveur).
 */
import { useEffect } from 'react'
import { useSyncExternalStore } from 'react'

let openCount = 0
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

export function openOverlay() {
  openCount += 1
  emit()
}

export function closeOverlay() {
  openCount = Math.max(0, openCount - 1)
  emit()
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function getSnapshot() {
  return openCount
}

function getServerSnapshot() {
  return 0
}

/** Le widget flottant lit ceci : true dès qu'au moins un overlay plein écran est ouvert. */
export function useAnyOverlayOpen(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) > 0
}

/**
 * Hook à appeler dans un modal : tant que `active` est true, l'overlay est compté
 * comme ouvert (incrémente au montage / passage à true, décrémente au démontage / false).
 * Le widget "A" se fade automatiquement.
 */
export function useOverlayLock(active: boolean): void {
  useEffect(() => {
    if (!active) return
    openOverlay()
    return () => closeOverlay()
  }, [active])
}
