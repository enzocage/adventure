import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

function sanitizeFilename(prompt: string): string {
  return prompt
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .substring(0, 120);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const prompt = searchParams.get('prompt') || '';

  if (!prompt) {
    return NextResponse.json({ error: 'Missing prompt parameter' }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is not configured on the server.' }, { status: 500 });
  }

  const cacheDir = path.join(process.cwd(), 'saves/image_cache');
  const filename = `${sanitizeFilename(prompt)}.png`;
  const cachePath = path.join(cacheDir, filename);

  try {
    // 1. Ensure cache directory exists
    await fs.mkdir(cacheDir, { recursive: true });

    // 2. Check if file is cached
    try {
      const fileData = await fs.readFile(cachePath);
      return new NextResponse(new Uint8Array(fileData), {
        headers: {
          'Content-Type': 'image/png',
          'Content-Length': fileData.length.toString(),
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch (readErr) {
      // File not cached, proceed to generate
    }

    // 3. Make request to Imagen 4.0 Fast API
    console.log(`Generating new image using Imagen 4.0 Fast for prompt: "${prompt}"`);
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${apiKey}`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [
          { prompt: prompt },
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: '16:9',
          outputMimeType: 'image/png',
        },
      }),
    });

    if (response.status !== 200) {
      const errorText = await response.text();
      console.error(`Imagen API returned status ${response.status}:`, errorText);
      return NextResponse.json({ error: `Imagen API returned status ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    const base64Encoded = data.predictions?.[0]?.bytesBase64Encoded;

    if (!base64Encoded) {
      console.error('No predictions or image bytes returned in Imagen response:', JSON.stringify(data));
      return NextResponse.json({ error: 'No image predictions were returned by the model.' }, { status: 500 });
    }

    // 4. Save to cache
    const imgBuffer = Buffer.from(base64Encoded, 'base64');
    await fs.writeFile(cachePath, imgBuffer);

    return new NextResponse(new Uint8Array(imgBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': imgBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Exception in image API route:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
