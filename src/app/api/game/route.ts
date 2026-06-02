import { NextResponse } from 'next/server';
import {
  loadGame,
  saveGame,
  createNewSession,
  listSessions,
  GameState,
  PlayerStatus,
} from '@/lib/saveSystem';
import { queryGameMaster, generateVisualScenePrompt } from '@/lib/gemini';

export async function GET() {
  try {
    const sessions = await listSessions();
    return NextResponse.json({ sessions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, sessionId, playerAction, sprache, diceResult } = body;

    // 1. Create a New Game Session
    if (action === 'new_game') {
      const newSessionId = await createNewSession();
      // Initialize default state with selected language
      const defaultState = await loadGame(newSessionId);
      defaultState.status.sprache = sprache || 'de';
      
      if (sprache === 'en') {
        defaultState.status.location = 'Administrative Center, Waiting Area C, Ground Floor';
        defaultState.status.time = 'Tuesday, 09:14 AM';
        defaultState.status.inventory = ['KVR House Pass (Candle Delivery Contract)'];
      }

      await saveGame(defaultState);
      return NextResponse.json({ sessionId: newSessionId, state: defaultState });
    }

    // 2. Load an existing session
    if (action === 'load_game') {
      if (!sessionId) {
        return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
      }
      const state = await loadGame(sessionId);
      return NextResponse.json({ state });
    }

    // 3. Play action / Dice roll
    if (action === 'play_action' || action === 'dice_roll') {
      if (!sessionId || !playerAction) {
        return NextResponse.json({ error: 'Missing sessionId or playerAction' }, { status: 400 });
      }

      // Load current state from disk
      const gameState = await loadGame(sessionId);

      // Call Game Master via Gemini
      const { response: gmResponse, usage } = await queryGameMaster(gameState, playerAction, diceResult);

      // Call visual scene generator model if a scene shift is flagged
      let scenePromptResult = null;
      if (gmResponse.neue_szene) {
        scenePromptResult = await generateVisualScenePrompt(
          gameState.protokoll,
          gmResponse.speichern.neuer_ort || gameState.status.location,
          gmResponse.narration,
          playerAction
        );
        gmResponse.bild_prompt = scenePromptResult.prompt;
      }

      // If a dice roll is required, save intermediate token statistics and respond to client
      if (gmResponse.wuerfel_noetig) {
        const imageGenerated = !!gmResponse.bild_prompt;
        const imageCost = imageGenerated ? 0.03 : 0;
        
        const sceneGenInput = scenePromptResult ? scenePromptResult.usage.inputTokens : 0;
        const sceneGenOutput = scenePromptResult ? scenePromptResult.usage.outputTokens : 0;
        const sceneGenCost = scenePromptResult ? scenePromptResult.usage.costUsd : 0;

        const intermediateStatus: PlayerStatus = {
          ...gameState.status,
          totalInputTokens: (gameState.status.totalInputTokens || 0) + usage.inputTokens + sceneGenInput,
          totalOutputTokens: (gameState.status.totalOutputTokens || 0) + usage.outputTokens + sceneGenOutput,
          statsSpielleiterInputTokens: (gameState.status.statsSpielleiterInputTokens || 0) + usage.inputTokens,
          statsSpielleiterOutputTokens: (gameState.status.statsSpielleiterOutputTokens || 0) + usage.outputTokens,
          statsSpielleiterCost: (gameState.status.statsSpielleiterCost || 0) + usage.costUsd,
          statsTranskriptionInputTokens: gameState.status.statsTranskriptionInputTokens || 0,
          statsTranskriptionOutputTokens: gameState.status.statsTranskriptionOutputTokens || 0,
          statsTranskriptionCost: gameState.status.statsTranskriptionCost || 0,
          statsSzenenGenInputTokens: (gameState.status.statsSzenenGenInputTokens || 0) + sceneGenInput,
          statsSzenenGenOutputTokens: (gameState.status.statsSzenenGenOutputTokens || 0) + sceneGenOutput,
          statsSzenenGenCost: (gameState.status.statsSzenenGenCost || 0) + sceneGenCost,
          statsBilderCount: (gameState.status.statsBilderCount || 0) + (imageGenerated ? 1 : 0),
          statsBilderCost: (gameState.status.statsBilderCost || 0) + imageCost,
          statsMusikCount: (gameState.status.statsMusikCount || 0) + (gmResponse.musik_wechsel ? 1 : 0),
          statsMusikCost: (gameState.status.statsMusikCost || 0),
          totalCost: (gameState.status.totalCost || 0) + usage.costUsd + sceneGenCost + imageCost,
        };
        const intermediateState: GameState = {
          ...gameState,
          status: intermediateStatus,
        };
        await saveGame(intermediateState);
        return NextResponse.json({ gmResponse, state: intermediateState });
      }

      // Otherwise, update the state files on disk
      const imageGenerated = !!gmResponse.bild_prompt;
      const imageCost = imageGenerated ? 0.03 : 0;
      
      const sceneGenInput = scenePromptResult ? scenePromptResult.usage.inputTokens : 0;
      const sceneGenOutput = scenePromptResult ? scenePromptResult.usage.outputTokens : 0;
      const sceneGenCost = scenePromptResult ? scenePromptResult.usage.costUsd : 0;

      const updatedStatus: PlayerStatus = {
        ...gameState.status,
        lp: Math.max(0, Math.min(100, gmResponse.speichern.lp_neu)),
        location: gmResponse.speichern.neuer_ort || gameState.status.location,
        totalInputTokens: (gameState.status.totalInputTokens || 0) + usage.inputTokens + sceneGenInput,
        totalOutputTokens: (gameState.status.totalOutputTokens || 0) + usage.outputTokens + sceneGenOutput,
        statsSpielleiterInputTokens: (gameState.status.statsSpielleiterInputTokens || 0) + usage.inputTokens,
        statsSpielleiterOutputTokens: (gameState.status.statsSpielleiterOutputTokens || 0) + usage.outputTokens,
        statsSpielleiterCost: (gameState.status.statsSpielleiterCost || 0) + usage.costUsd,
        statsTranskriptionInputTokens: gameState.status.statsTranskriptionInputTokens || 0,
        statsTranskriptionOutputTokens: gameState.status.statsTranskriptionOutputTokens || 0,
        statsTranskriptionCost: gameState.status.statsTranskriptionCost || 0,
        statsSzenenGenInputTokens: (gameState.status.statsSzenenGenInputTokens || 0) + sceneGenInput,
        statsSzenenGenOutputTokens: (gameState.status.statsSzenenGenOutputTokens || 0) + sceneGenOutput,
        statsSzenenGenCost: (gameState.status.statsSzenenGenCost || 0) + sceneGenCost,
        statsBilderCount: (gameState.status.statsBilderCount || 0) + (imageGenerated ? 1 : 0),
        statsBilderCost: (gameState.status.statsBilderCost || 0) + imageCost,
        statsMusikCount: (gameState.status.statsMusikCount || 0) + (gmResponse.musik_wechsel ? 1 : 0),
        statsMusikCost: (gameState.status.statsMusikCost || 0),
        totalCost: (gameState.status.totalCost || 0) + usage.costUsd + sceneGenCost + imageCost,
      };

      // Append narrator text and player action to play protocol
      let currentProtocol = gameState.protokoll;
      const sceneLabel = gmResponse.neue_szene ? `\n\n---\n\n## Szene: ${updatedStatus.location}` : '';
      currentProtocol += `${sceneLabel}\n\n**Spieleraktion:** ${playerAction}\n`;
      if (diceResult) {
        currentProtocol += `**Würfelwurf:** d100=${diceResult.baseRoll} (Modifikatoren=${diceResult.modifier}, Gesamt=${diceResult.finalScore}, Ergebnis=${diceResult.category})\n`;
      }
      currentProtocol += `\n**Spielleiter-Narration:**\n${gmResponse.narration}\n\n`;

      // Update Weltstand active silent zones if specified
      const updatedWeltstand = { ...gameState.weltstand };
      if (gmResponse.speichern.weltstand_update) {
        updatedWeltstand.knownFacts.push(gmResponse.speichern.weltstand_update);
        // Simple heuristic to toggle silent zones in state if mentioned
        if (gmResponse.speichern.weltstand_update.includes('Stille Zone')) {
          const zone = gmResponse.speichern.weltstand_update;
          updatedWeltstand.stilleZonen[zone] = true;
        }
      }

      // Update NPCs if specified
      const updatedNPCs = [...gameState.npcs];
      if (gmResponse.speichern.npc_update) {
        const updateText = gmResponse.speichern.npc_update;
        // Parse update or append notes
        const matchedNpc = updatedNPCs.find(n => updateText.toLowerCase().includes(n.name.toLowerCase()));
        if (matchedNpc) {
          matchedNpc.status = updateText;
        }
      }

      // Assemble updated game state
      const updatedState: GameState = {
        ...gameState,
        status: updatedStatus,
        protokoll: currentProtocol,
        weltstand: updatedWeltstand,
        npcs: updatedNPCs,
      };

      // Save to server local disk
      await saveGame(updatedState);

      return NextResponse.json({ gmResponse, state: updatedState });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in /api/game API route:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
