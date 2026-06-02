import { NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const { audio, mimeType } = await request.json();

    if (!audio || !mimeType) {
      return NextResponse.json({ error: 'Missing audio or mimeType' }, { status: 400 });
    }

    // Call transcription using Gemini
    const text = await transcribeAudio(audio, mimeType);

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error('Error in /api/transcribe route:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
