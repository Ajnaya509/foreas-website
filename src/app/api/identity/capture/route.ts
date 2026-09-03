import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * Fermée par P55.
 *
 * Cette ancienne porte recevait un numéro simplement tapé, puis écrivait déjà
 * mémoire, prospect, origine et Lead Meta sur l'identité de ce numéro. Elle ne
 * rendait plus l'UUID au navigateur, mais la mauvaise attribution se produisait
 * encore à l'écriture. Cacher la réponse ne prouve pas la possession.
 *
 * Le seul chemin autorisé est maintenant :
 *   issue-handoff -> Twilio Verify -> bind_verified_whatsapp_handoff ->
 *   premier message WhatsApp signé.
 */
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: 'phone_must_be_verified',
      message: 'Le numéro doit être vérifié par SMS avant tout rattachement.',
    },
    { status: 410 },
  )
}
