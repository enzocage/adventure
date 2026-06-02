import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

function getPromptForTrack(track: string): string {
  switch (track.toLowerCase()) {
    case 'drone':
      return 'A dark, ominous synth drone loop with metallic scraping and low fluorescent hums, loopable administrative atmosphere theme, 48kHz, loop';
    case 'piano':
      return 'A slow, mysterious, reverbed minimalist piano melody, Twin Peaks style, dark jazz chords, loopable ambient, 48kHz, loop';
    case 'percussion':
      return 'A slow, tense, ticking clock percussion loop with low rhythmic mechanical heartbeat pulses, loopable suspense ambient, 48kHz, loop';
    case 'city':
      return 'A muffled, low-frequency city traffic noise mixed with electric grid hums and distant metal scraping, loopable drone, 48kHz, loop';
    case 'normal':
    default:
      return 'A low, eerie, industrial drone hum with occasional minimalist deep synth tones, loopable ambient background music for a bureaucratic surreal game, 48kHz, loop';
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const track = searchParams.get('track') || 'normal';

  if (track === 'silent') {
    return new NextResponse(null, { status: 204 });
  }

  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is not configured on the server.' }, { status: 500 });
  }

  const cacheDir = path.join(process.cwd(), 'saves/audio');
  const filename = `${track.toLowerCase()}.mp3`;
  const cachePath = path.join(cacheDir, filename);

  try {
    // 1. Ensure cache directory exists
    await fs.mkdir(cacheDir, { recursive: true });

    // 2. Check if file is cached
    try {
      const fileData = await fs.readFile(cachePath);
      return new NextResponse(new Uint8Array(fileData), {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': fileData.length.toString(),
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch (readErr) {
      // File not cached, proceed to generate
    }

    // 3. Make request to Lyria API
    const prompt = getPromptForTrack(track);
    console.log(`Generating new loop using Lyria 3 for track archetype: "${track}" (prompt: "${prompt}")`);
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/lyria-3-clip-preview:generateContent?key=${apiKey}`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
        },
      }),
    });

    if (response.status !== 200) {
      const errorText = await response.text();
      console.error(`Lyria API returned status ${response.status}:`, errorText);
      return NextResponse.json({ error: `Lyria API returned status ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    
    // Find the inline data part that contains the audio
    const parts = data.candidates?.[0]?.content?.parts;
    let base64Audio = '';
    if (parts && Array.isArray(parts)) {
      const audioPart = parts.find(p => p.inlineData && p.inlineData.data);
      if (audioPart) {
        base64Audio = audioPart.inlineData.data;
      }
    }

    if (!base64Audio) {
      console.error('No audio data was returned in Lyria response:', JSON.stringify(data));
      return NextResponse.json({ error: 'No audio data was returned by the model.' }, { status: 500 });
    }

    // 4. Save to cache
    const audioBuffer = Buffer.from(base64Audio, 'base64');
    await fs.writeFile(cachePath, audioBuffer);

    return new NextResponse(new Uint8Array(audioBuffer), {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Exception in music API route:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
