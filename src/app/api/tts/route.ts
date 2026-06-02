import { NextResponse } from 'next/server';

function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/_/g, '')
    .replace(/^>\s+/gm, '') // Strip blockquotes
    .trim();
}

async function handleTtsRequest(text: string, lang: string) {
  const apiKey = process.env.XAI_API_KEY || '';
  const voice = process.env.XAI_TTS_VOICE || 'Eve';
  
  if (!apiKey) {
    return NextResponse.json({ error: 'XAI_API_KEY is not configured on the server.' }, { status: 500 });
  }

  const cleanText = cleanMarkdown(text);
  if (!cleanText) {
    return NextResponse.json({ error: 'Text to speak is empty.' }, { status: 400 });
  }

  // Determine BCP-47 language code for Grok
  // Grok accepts 'de', 'en', 'auto', etc.
  const languageCode = lang === 'en' ? 'en' : (lang === 'de' ? 'de' : 'auto');

  try {
    console.log(`Calling Grok TTS API for text: "${cleanText.substring(0, 60)}..." (voice: "${voice}", lang: "${languageCode}")`);
    const response = await fetch('https://api.x.ai/v1/tts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-voice-latest',
        text: cleanText,
        voice: voice.toLowerCase(),
        language: languageCode,
        output_format: {
          codec: 'mp3',
          sample_rate: 24000,
        },
      }),
    });

    if (response.status !== 200) {
      const errorText = await response.text();
      console.error(`Grok TTS API returned status ${response.status}:`, errorText);
      return NextResponse.json({ error: `Grok TTS API returned status ${response.status}` }, { status: response.status });
    }

    // Stream the audio response body directly to the client for minimum latency
    if (response.body) {
      return new NextResponse(response.body as any, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(new Uint8Array(audioBuffer), {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error: any) {
    console.error('Exception in Grok TTS API route:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text') || '';
  const lang = searchParams.get('lang') || 'de';

  return handleTtsRequest(text, lang);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = body.text || '';
    const lang = body.lang || 'de';

    return handleTtsRequest(text, lang);
  } catch (err: any) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}
