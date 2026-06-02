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
      description: "Narrative description for the player in their selected language. Keep it short and concise (average length should be cut by about 50%, max 3-4 short sentences or 2 small paragraphs). Support markdown like **bold** or *italics*. ALWAYS include Lügengehör perception (e.g. hearing a lie scratching/screeching or hearing clean truths) as part of the narrator's feedback."
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
      description: "Highly detailed and differentiated multi-layered English prompt for image generation reflecting the current action and scene, following the structured 6-layer template defined in Visualisierungsstil.md. It must include: camera & lens (20mm wide-angle), immediate foreground details (hands, desks, documents, objects), surrounding textures and materials (scuffed linoleum, dusty beige walls), specific lighting & atmospheric qualities (overhead flickering cold fluorescent glare, volumetric dust), at least one subtle surreal or anomalous element, and the style tags. ALWAYS generate a unique prompt matching the player's action and the resulting scene state."
    },
    musik_wechsel: {
      type: SchemaType.BOOLEAN,
      description: "Set to true if the music vibe should shift to fit the narrative."
    },
    musik_track: {
      type: SchemaType.STRING,
      description: "Recommended atmospheric ambient loop (strictly without rhythm or percussion): 'normal', 'drone', 'silent', 'piano' or null."
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
        neuer_ort: {
          type: SchemaType.STRING,
          description: "The exact name of the current location of the player after this action (e.g. 'Verwaltungszentrum, Untergeschoss -4, Tiefenarchiv' or 'Verwaltungszentrum, Wartezone C, Erdgeschoss'). Update this on every turn to be precise."
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
      required: ["protokoll_eintrag", "lp_neu", "neuer_ort"]
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
7. Bild-Generierung (bild_prompt): Der englische prompt für das Bild muss hochgradig detailliert, präzise und differenziert genau das darstellen, was du in der Story-Narration (narration) beschreibst. Verwende zwingend die strukturierte 6-schichtige Prompt-Vorlage aus Visualisierungsstil.md (1. Camera & POV (Weitwinkel, First-Person), 2. Subject & Action Details (Mittel-/Vordergrundgegenstände, Posen), 3. Environment & Materiality (Linoleum, Raufaser, vergilbtes Papier), 4. Lighting & Atmosphere (Neonflimmern, bläulich-weiß, Staubpartikel), 5. Uncanny/Surreal Element (surreales/anomales Detail), 6. Style Signature Tags). Vermeide allgemeine oder kurze Prompts. Jedes Detail aus der Narration, das visuell erkennbar sein könnte, sollte im Bild-Prompt vorkommen.
8. JSON-Gültigkeit: Stelle sicher, dass Anführungszeichen innerhalb von Textfeldern korrekt als \\\" maskiert sind, damit das JSON-Format nicht beschädigt wird. Die Antwort darf unter keinen Umständen unvollständig sein oder mitten im Satz abgeschnitten werden.
9. TEXTKÜRZUNG (Sehr wichtig): Halte deine Narration (Feld "narration") extrem kurz und prägnant. Kürze die durchschnittliche Textausgabe um ca. 50% im Vergleich zu früher. Beschreibe Szenen und Reaktionen dicht und atmosphärisch, aber in maximal 3-4 Sätzen bzw. 2 kleinen Absätzen.
10. MUSIK (Sehr wichtig): Verwende AUSSCHLIESSLICH atmosphärische Ambient-Loops OHNE Rhythmus, Trommeln, Takt oder Beats ('normal', 'drone', 'piano', 'silent'). Schlage niemals Tracks mit Rhythmus vor.
11. STANDORT (Sehr wichtig): Aktualisiere bei jeder Antwort das Feld "speichern.neuer_ort" mit dem genauen, aktuellen Aufenthaltsort von Tomas (z. B. 'Verwaltungszentrum, Untergeschoss -4, Tiefenarchiv' oder 'Verwaltungszentrum, Treppenhaus').

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
7. Image Generation (bild_prompt): The English prompt for the image must be highly precise, detailed, and differentiated, following the structured 6-layer template in Visualisierungsstil.md: 1. Camera & POV (wide-angle, first-person), 2. Subject & Action (immediate foreground objects, poses), 3. Environment & Materials (scuffed linoleum, textured beige wallpaper, dusty forms), 4. Lighting & Atmosphere (flickering cold fluorescent glare, blue-white tint, volumetric dust), 5. Uncanny/Surreal Detail (subtle anomaly), 6. Style Signature Tags. Avoid generic prompts. Every visual detail from the narration should be represented in the image prompt.
8. JSON Validity: Ensure all double quotes inside text fields are properly escaped as \\\" so that they do not break the JSON string format. The response must never be incomplete or truncated.
9. TEXT SHORTENING (Very important): Keep your narration (field "narration") extremely short and concise. Shorten the average text output by about 50%. Narrate dynamically and with heavy atmosphere but limit it to a maximum of 3-4 sentences or 2 short paragraphs.
10. MUSIC (Very important): Recommended music track MUST be strictly a rhythm-free, drumless atmospheric ambient loop ('normal', 'drone', 'piano', 'silent'). Never recommend tracks with any beats or rhythm.
11. LOCATION (Very important): Update the "speichern.neuer_ort" field on every turn with the exact current location of Tomas (e.g., 'Verwaltungszentrum, Untergeschoss -4, Tiefenarchiv' or 'Verwaltungszentrum, Stairwell').

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
  musik_track: 'normal' | 'drone' | 'silent' | 'piano' | null;
  speichern: {
    protokoll_eintrag: string;
    lp_neu: number;
    neuer_ort: string;
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

export interface TranscribeResult {
  text: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
  };
}

export async function transcribeAudio(audioBase64: string, mimeType: string): Promise<TranscribeResult> {
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

  const text = result.response.text().trim();
  const usageMetadata = result.response.usageMetadata;
  const inputTokens = usageMetadata?.promptTokenCount || 0;
  const outputTokens = usageMetadata?.candidatesTokenCount || 0;
  // Gemini 2.5 Flash pricing: $0.075/1M input, $0.30/1M output
  const costUsd = (inputTokens * 0.000000075) + (outputTokens * 0.0000003);

  return {
    text,
    usage: {
      inputTokens,
      outputTokens,
      costUsd
    }
  };
}

export interface VisualScenePromptResult {
  prompt: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
  };
}

export async function generateVisualScenePrompt(
  protokoll: string,
  location: string,
  latestNarration: string,
  playerAction: string
): Promise<VisualScenePromptResult> {
  const visualGuide = await loadLoreMD('Visualisierungsstil.md');

  const systemInstruction = `You are the Visual Scene Designer for the surreal bureaucratic RPG "Kaldermünd".
Your task is to generate a highly detailed, evocative, and differentiated English image generation prompt for Google's Imagen 4.0.
You must strictly follow the visual style, materials, lighting, and anomalies described in Visualisierungsstil.md (Bureaucratic Surrealism).

Construct the prompt using this structured 6-layer template:
1. Camera & POV: First-person POV, shot through a wide-angle lens (e.g. 20mm or 24mm) with deep depth of field and slight barrel distortion.
2. Subject & Action Details: Precise foreground and middleground visual elements from the latest narration (e.g., exact documents, telephones, tools, hands, poses, clothing, facial expressions of characters).
3. Environment & Materiality: Details of the surroundings (e.g., scuffed green linoleum, textured beige wallpaper, dusty folders, veneer counters, signs).
4. Lighting & Atmospheric Effects: Specific lighting conditions (e.g., cold blue-white flickering fluorescent tubes, soft green tints, volumetric dust shafts, warm orange candle wax glow).
5. Uncanny / Surreal Element: Incorporate exactly one subtle surreal anomaly (e.g., impossible shadows, doors sideways, geometric distortions, floating objects).
6. Style Signature Tags: Append the exact visual tags: "Style: bureaucratic surrealism, first-person perspective, fluorescent office lighting, institutional beige walls, linoleum floors, David Lynch atmosphere, Kafka mundane horror, contemporary German setting, hyperreal detail, desaturated, uncanny normality, cinematic composition, subtle wrongness."

Rules:
1. The prompt must be in ENGLISH.
2. Differentiate the scene by translating specific narration events (e.g. wet rain spots, a specific stamp on a form, a key in a drawer, a character's expression) into rich visual descriptions. Avoid generic descriptions.
3. Output ONLY the raw English prompt string. Do not wrap it in quotes, markdown code blocks, or HTML tags. Do not add any introductory or concluding text.`;

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: systemInstruction,
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 1000,
    },
  });

  const prompt = `
=== VISUAL STYLE GUIDE ===
${visualGuide}

=== GAME CHRONOLOGICAL PROTOCOL ===
${protokoll}

=== CURRENT STATE ===
Location: ${location}
Latest Action: ${playerAction}
Latest Narration: ${latestNarration}

Generate the detailed visual image prompt for this scene.
`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    const usageMetadata = result.response.usageMetadata;
    const inputTokens = usageMetadata?.promptTokenCount || 0;
    const outputTokens = usageMetadata?.candidatesTokenCount || 0;
    // Gemini 2.5 Flash pricing: $0.075/1M input, $0.30/1M output
    const costUsd = (inputTokens * 0.000000075) + (outputTokens * 0.0000003);

    return {
      prompt: responseText,
      usage: {
        inputTokens,
        outputTokens,
        costUsd
      }
    };
  } catch (err) {
    console.error("Error in generateVisualScenePrompt:", err);
    return {
      prompt: `${location}, first-person perspective. Style: bureaucratic surrealism.`,
      usage: {
        inputTokens: 0,
        outputTokens: 0,
        costUsd: 0
      }
    };
  }
}
