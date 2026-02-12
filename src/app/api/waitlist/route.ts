import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory storage for demo
// En prod: utiliser une base de données (Supabase, PlanetScale, etc.)
// ou un service d'email marketing (Resend, ConvertKit, Mailchimp)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 }
      )
    }

    // TODO: Remplacer par ton service d'email
    // Exemples d'intégration:

    // Option 1: Resend
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // await resend.contacts.create({
    //   email,
    //   audienceId: process.env.RESEND_AUDIENCE_ID
    // })

    // Option 2: Supabase
    // const { error } = await supabase
    //   .from('waitlist')
    //   .insert({ email, created_at: new Date().toISOString() })

    // Option 3: Notion Database
    // await notion.pages.create({
    //   parent: { database_id: process.env.NOTION_WAITLIST_DB },
    //   properties: { Email: { email: { email } } }
    // })

    console.log(`[Waitlist] New signup: ${email}`)

    return NextResponse.json({
      success: true,
      message: 'Email enregistré'
    })
  } catch (error) {
    console.error('Waitlist error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
