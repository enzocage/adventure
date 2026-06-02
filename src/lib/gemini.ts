import { GoogleGenerativeAI, SchemaType, GenerateContentRequest } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';
import { GameState } from './saveSystem';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// JSON Response Schema
const storyResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    narration: {
      type: SchemaType.STRING,
      description: "Narrative description for the player in their selected language. Support markdown like **bold** or *italics*. ALWAYS include Lügengehör perception (e.g. hearing a lie scratching/screeching or hearing clean truths) as part of the narrator's feedback."
    },
    wuerfel_noetig: {
      type: SchemaType.BOOLEAN,
      description: "Set to true ONLY if the player's action is ambitious/dangerous and requires a d100 roll check."
    },
    wuerfel_typ: {
      type: SchemaType.STRING,
      description: "The type of dice check: 'normal', 'luegengehoer', 'luegen', 'kampf' or null (if no roll needed)."
    },
    wuerfel_ziel: {
      type: SchemaType.STRING,
      description: "Description of what is being tested (e.g., 'Wachmann täuschen', 'Schreibtisch durchsuchen') or null."
    },
    lp_aenderung: {
      type: SchemaType.INTEGER,
      description: "LP change points resulting from this action (e.g., -10, +5, or 0)."
    },
    neue_buttons: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "3-5 dynamic choice buttons for the user's next action."
    },
    neue_szene: {
      type: SchemaType.BOOLEAN,
      description: "Set to true if the visual scene changes significantly (triggers a new visual generator prompt)."
    },
    bild_prompt: {
      type: SchemaType.STRING,
      description: "Detailed English prompt for image generation reflecting the current action and scene, using 'bureaucratic surrealism' style rules. ALWAYS generate a unique prompt matching the player's action and the resulting scene state."
    },
    musik_wechsel: {
      type: SchemaType.BOOLEAN,
      description: "Set to true if the music vibe should shift to fit the narrative."
    },
    musik_track: {
      type: SchemaType.STRING,
      description: "Recommended ambient music track: 'normal', 'drone', 'silent', 'piano', 'percussion', 'city' or null."
    },
    speichern: {
      type: SchemaType.OBJECT,
      properties: {
        protokoll_eintrag: {
          type: SchemaType.STRING,
          description: "A summary log entry of what occurred in this scene and action."
        },
        lp_neu: {
          type: SchemaType.INTEGER,
          description: "The updated LP score (current LP plus lp_aenderung, clamped between 0 and 100)."
        },
        weltstand_update: {
          type: SchemaType.STRING,
          description: "Update to the world state (e.g. 'Stille Zone 2 aktiv', 'Raum 112 aufgesperrt') or null."
        },
        npc_update: {
          type: SchemaType.STRING,
          description: "Update to NPC status/relationships or null."
        }
      },
      required: ["protokoll_eintrag", "lp_neu"]
    }
  },
  required: [
    "narration",
    "wuerfel_noetig",
    "lp_aenderung",
    "neue_buttons",
    "neue_szene",
    "bild_prompt",
    "musik_wechsel",
    "speichern"
  ]
};

// Compile system instructions dynamically by reading MD files
async function loadLoreMD(filename: string): Promise<string> {
  try {
    const filePath = path.join(process.cwd(), filename);
    return await fs.readFile(filePath, 'utf-8');
  } catch (err) {
    console.warn(`Could not read file ${filename}:`, err);
    return '';
  }
}

export async function compileSystemInstruction(sprache: 'de' | 'en'): Promise<string> {
  const files = [
    'Welt.md',
    'Protagonist.md',
    'Antagonist.md',
    'Spielmechanik.md',
    'Superkraft.md',
    'Einschraenkung.md',
    'Nebenquests.md',
    'Visualisierungsstil.md'
  ];

  let compiledLore = '';
  for (const file of files) {
    const content = await loadLoreMD(file);
    compiledLore += `\n\n=== FILE: ${file} ===\n${content}`;
  }

  const rolePrompt = sprache === 'de' 
    ? `Du bist der Spielleiter (Game Master) für das surreale Bürokratie-Rollenspiel "Kaldermünd".
Deine Aufgabe ist es, das Abenteuer zu leiten, Szenen zu beschreiben, Lügengehör-Eindrücke zu schildern, und auf Spieleraktionen zu reagieren.
Bitte beachte die folgenden Regeln penibel:
1. Spiele in DEUTSCHER Sprache (da sprache='de').
2. Tomas Gretsch kann NICHT lügen. Seine Kehle schnürt sich zu. Wenn er lügen will (wuerfel_typ='luegen'), führt das zu Schmerzen/Druck, und er hat einen Würfel-Malus von -20.
3. Tomas hört Lügen physisch (als störende Frequenzen, Kratzen, Kreischen). Integriere dies regelmäßig in deine Beschreibungen von Gesprächen!
4. Würfeln (wuerfel_noetig=true): Fordere einen Wurf für ambitionierte Aktionen (z.B. Kämpfen, Heimlichkeit, schwere Überredung). Wenn wuerfel_noetig=true ist, liefere einen kurzen Text, der die Anforderung beschreibt. Der Würfelwurf wird dann vom System durchgeführt und dir in der nächsten Anfrage übergeben, woraufhin du das Ergebnis narrativ beschreibst.
5. Lebenspunkte (LP): Achte auf Tomas' LP. Er startet bei 100 LP. Bei 0 LP ist er tot. Reduziere LP bei Schaden oder Lügenüberlastung.
6. Halte dich an den surrealen, kafkaesken, Lynchian-beige Ton des Spiels.
7. Bild-Generierung (bild_prompt): Der englische prompt für das Bild muss absolut präzise und detailliert genau das darstellen, was du in der Story-Narration (narration) beschreibst (z. B. bestimmte Gegenstände auf dem Tisch, die Haltung von Personen, Beleuchtungsverhältnisse, Räume). Vermeide allgemeine Beschreibungen. Jedes Detail aus der Narration, das visuell erkennbar sein könnte, sollte im Bild-Prompt vorkommen.
8. JSON-Gültigkeit: Stelle sicher, dass Anführungszeichen innerhalb von Textfeldern korrekt als \\\" maskiert sind, damit das JSON-Format nicht beschädigt wird. Die Antwort darf unter keinen Umständen unvollständig sein oder mitten im Satz abgeschnitten werden.

Hier ist die gesamte Spieldokumentation als Referenz:`
    : `You are the Game Master for the surreal bureaucratic RPG "Kaldermünd".
Your task is to run the adventure, describe scenes, paint sensory details of the "Lügengehör" (hearing lies), and respond to player actions.
Carefully follow these rules:
1. Run the game in ENGLISH (since sprache='en').
2. Tomas Gretsch CANNOT lie. If he attempts to lie, his throat constricts, causing physical discomfort, and he gets a -20 penalty.
3. Tomas hears lies physically as dissonant frequencies, scratchy sounds, or metallic screeches. Integrate this frequently into conversations.
4. Dice Rolls (wuerfel_noetig=true): Demand a roll for ambitious checks. When true, tell the user what they are rolling for. The server rolls and sends the result in the next turn, where you narrate the outcome.
5. LP: Monitor Tomas's health. Clamps between 0 and 100.
6. Stick to the surreal, kafkaesque, Lynchian-beige tone of the game.
7. Image Generation (bild_prompt): The English prompt for the image must be highly precise and detailed, showing exactly what you describe in your narration (e.g. specific items on the table, postures of people, lighting conditions, rooms). Avoid generic prompts. Every visual detail from the narration should be represented in the image prompt.
8. JSON Validity: Ensure all double quotes inside text fields are properly escaped as \\\" so that they do not break the JSON string format. The response must never be incomplete or truncated.

Here is the complete game lore/rules documentation for reference:`;

  return `${rolePrompt}\n${compiledLore}`;
}

export interface StoryResponse {
  narration: string;
  wuerfel_noetig: boolean;
  wuerfel_typ: 'normal' | 'luegengehoer' | 'luegen' | 'kampf' | null;
  wuerfel_ziel: string | null;
  lp_aenderung: number;
  neue_buttons: string[];
  neue_szene: boolean;
  bild_prompt: string | null;
  musik_wechsel: boolean;
  musik_track: 'normal' | 'drone' | 'silent' | 'piano' | 'percussion' | 'city' | null;
  speichern: {
    protokoll_eintrag: string;
    lp_neu: number;
    weltstand_update: string | null;
    npc_update: string | null;
  };
}

export interface GameMasterResult {
  response: StoryResponse;
  usage: {
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
  };
}

export async function queryGameMaster(
  gameState: GameState,
  playerAction: string,
  diceRollResult?: { baseRoll: number; modifier: number; finalScore: number; category: string }
): Promise<GameMasterResult> {
  const sprache = gameState.status.sprache || 'de';
  const systemInstruction = await compileSystemInstruction(sprache);

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: systemInstruction,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: storyResponseSchema as any,
      temperature: 0.8,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
  });

  const prompt = `
=== CURRENT PLAYER STATUS ===
LP: ${gameState.status.lp}/100
Location: ${gameState.status.location}
Time: ${gameState.status.time}
Resonance: ${gameState.status.resonance}
Active Effects: ${JSON.stringify(gameState.status.activeEffects)}
Inventory: ${JSON.stringify(gameState.status.inventory)}

=== CURRENT WORLD STATE ===
Active Silent Zones: ${JSON.stringify(gameState.weltstand.stilleZonen)}
Hours until Stille Maschine: ${gameState.weltstand.stilleMaschineHours}h
Known Facts: ${JSON.stringify(gameState.weltstand.knownFacts)}

=== NPC STATUS ===
${JSON.stringify(gameState.npcs)}

=== PLAY PROTOCOL (CHRONOLOGICAL HISTORY) ===
${gameState.protokoll}

=== PLAYER ACTION ===
The player wants to do: "${playerAction}"

${diceRollResult ? `=== DICE ROLL OUTCOME ===
The system automatically rolled a d100:
- Base Roll: ${diceRollResult.baseRoll}
- Modifier: ${diceRollResult.modifier}
- Final Score: ${diceRollResult.finalScore}
- Category/Quality: ${diceRollResult.category}
Narrate the outcome of this action based on this dice roll score and quality.` : ''}

Generate the structured JSON response. Make sure all values follow the required schema rules.
`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    const usageMetadata = result.response.usageMetadata;
    const inputTokens = usageMetadata?.promptTokenCount || 0;
    const outputTokens = usageMetadata?.candidatesTokenCount || 0;
    
    // Gemini 2.5 Flash pricing: $0.075/1M input, $0.30/1M output
    const costUsd = (inputTokens * 0.000000075) + (outputTokens * 0.0000003);

    try {
      const response = JSON.parse(responseText) as StoryResponse;
      return {
        response,
        usage: {
          inputTokens,
          outputTokens,
          costUsd
        }
      };
    } catch (parseErr) {
      console.error("--- GEMINI JSON PARSE ERROR ---");
      console.error("Raw response text:", responseText);
      console.error("-------------------------------");
      throw parseErr;
    }
  } catch (err) {
    console.error("Error in queryGameMaster:", err);
    throw err;
  }
}

export async function transcribeAudio(audioBase64: string, mimeType: string): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
  });

  const result = await model.generateContent([
    {
      inlineData: {
        data: audioBase64,
        mimeType: mimeType,
      },
    },
    'Transcribe this spoken German/English audio exactly. Return only the transcribed text, nothing else. If there is no speech, return an empty string.'
  ]);

  return result.response.text().trim();
}
