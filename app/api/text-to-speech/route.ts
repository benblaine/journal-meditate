import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { text } = await req.json()

  const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY
  const VOICE_ID = 'LcfcDJNUP1GQjkzn1xUU' // Example voice ID, you can change this

  if (!ELEVEN_LABS_API_KEY) {
    return NextResponse.json({ error: 'ElevenLabs API key is not set' }, { status: 500 })
  }

  const options = {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVEN_LABS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5,
      },
    }),
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, options)

    if (!response.ok) {
      throw new Error(`ElevenLabs API responded with ${response.status}`)
    }

    const audioBuffer = await response.arrayBuffer()
    
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error('Error calling ElevenLabs API:', error)
    return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 })
  }
}