import { NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/gemini';
import { loadGame, saveGame, PlayerStatus } from '@/lib/saveSystem';

export async function POST(request: Request) {
  try {
    const { audio, mimeType, sessionId } = await request.json();

    if (!audio || !mimeType) {
      return NextResponse.json({ error: 'Missing audio or mimeType' }, { status: 400 });
    }

    // Call transcription using Gemini
    const result = await transcribeAudio(audio, mimeType);

    let state = null;
    if (sessionId) {
      const gameState = await loadGame(sessionId);
      const updatedStatus: PlayerStatus = {
        ...gameState.status,
        totalInputTokens: (gameState.status.totalInputTokens || 0) + result.usage.inputTokens,
        totalOutputTokens: (gameState.status.totalOutputTokens || 0) + result.usage.outputTokens,
        totalCost: (gameState.status.totalCost || 0) + result.usage.costUsd,
        statsTranskriptionInputTokens: (gameState.status.statsTranskriptionInputTokens || 0) + result.usage.inputTokens,
        statsTranskriptionOutputTokens: (gameState.status.statsTranskriptionOutputTokens || 0) + result.usage.outputTokens,
        statsTranskriptionCost: (gameState.status.statsTranskriptionCost || 0) + result.usage.costUsd,
      };
      
      const updatedState = {
        ...gameState,
        status: updatedStatus,
      };
      
      await saveGame(updatedState);
      state = updatedState;
    }

    return NextResponse.json({ text: result.text, state });
  } catch (error: any) {
    console.error('Error in /api/transcribe route:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
