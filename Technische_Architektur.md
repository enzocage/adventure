# Technische Architektur: Die Web-App

---

## Überblick

Das Spiel läuft als **Progressive Web App (PWA)** im Browser. Keine Installation nötig. Vollständig responsiv (Desktop-First, aber auch auf Tablet spielbar).

---

## Tech Stack

| Schicht | Technologie | Zweck |
|---|---|---|
| **Frontend** | Next.js 14 + React | SPA mit Server-Side Rendering |
| **Styling** | Tailwind CSS + CSS Variables | Dark Theme, Bürokratie-Surrealism-Ästhetik |
| **KI-Spielleiter** | Google Gemini API (`gemini-2.5-pro`) | Narration, Weltlogik, Würfeln |
| **Bildgenerierung** | Antigravity 2.0 API | Szenenbilder (Egoperspektive) |
| **Musik** | Web Audio API + generierte MP3s | Atmosphären-Loops bei 10% Volumen |
| **Speicherung** | Lokale Markdown-Dateien via File System Access API | Spielprotokoll, Saves |
| **Speech-to-Text** | Web Speech API (Browser-nativ) | Spracheingabe für Spieleraktionen |
| **State Management** | Zustand (lightweight React state) | Spielerzustand, LP, aktive Szene |

---

## UI-Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                    KALDERMÜND                        [⚙] [🔊]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│               [ SZENEN-BILD ]                                   │
│          (Full-Width, Egoperspektive)                           │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  ♥ LP: 73/100  ░░░░░░░░░░░░░░░░░                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [ SPIELLEITER-TEXT ]                                           │
│  Scrollbarer Erzählbereich, Bürokratie-Monospace-Optik          │
│                                                                 │
│  ─────────────────────────────────────────────────────          │
│  [ Türe öffnen ]  [ Das Licht löschen ]  [ Sprechen ]          │
│  [ Verstecken ]   [ Inventar prüfen  ]   [ Warten   ]          │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Was tust du?                                   [🎤] [→] │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## KI-Integration (Gemini als Spielleiter)

### Modell-Wahl

| Modell | Einsatz | Begründung |
|---|---|---|
| `gemini-2.5-pro` | Narration, komplexe Entscheidungen, Finale | Höchste Reasoning-Qualität, 1M-Token-Kontextfenster |
| `gemini-2.0-flash` | Kurze Reaktionen, Würfelergebnisse, Button-Generierung | Schnell, günstig, ausreichend für einfache Szenen |

Das 1-Millionen-Token-Kontextfenster von Gemini 2.5 Pro ist ein entscheidender Vorteil: **Das gesamte Spielprotokoll** kann im Kontext gehalten werden, ohne Komprimierung oder Zusammenfassung — Konsistenz über alle Szenen garantiert.

### SDK-Integration (Node.js)

```typescript
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-pro",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: spielleiterResponseSchema,  // erzwingt strukturierten Output
    temperature: 0.85,      // kreativ aber konsistent
    topP: 0.95,
    maxOutputTokens: 2048,
  },
  systemInstruction: spielleiterSystemPrompt,
});
```

### System Prompt Struktur

Der Spielleiter erhält bei jeder Anfrage:
1. **Rollen-Prompt:** Wer ist die KI (Spielleiter, Kaldermünd, Mechaniken)
2. **Weltkontext:** Komprimierte Referenz auf Welt.md, Protagonist.md, Antagonist.md
3. **Aktueller Spielstand:** Inhalt von `spieler_status.md`
4. **Vollständiges Protokoll:** Dank 1M-Kontext: das gesamte `protokoll.md` (kein Truncating)
5. **Spieleraktion:** Was der Spieler jetzt tun möchte

### Response-Schema (Gemini Structured Output)

```typescript
const spielleiterResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    narration: {
      type: SchemaType.STRING,
      description: "Erzähltext für den Spieler (Markdown erlaubt)",
    },
    wuerfel_noetig: { type: SchemaType.BOOLEAN },
    wuerfel_ergebnis: { type: SchemaType.INTEGER, nullable: true },
    lp_aenderung: { type: SchemaType.INTEGER },
    neue_buttons: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    neue_szene: { type: SchemaType.BOOLEAN },
    bild_prompt: { type: SchemaType.STRING, nullable: true },
    bild_wiederverwenden: { type: SchemaType.STRING, nullable: true },
    musik_wechsel: { type: SchemaType.BOOLEAN },
    musik_prompt: { type: SchemaType.STRING, nullable: true },
    speichern: {
      type: SchemaType.OBJECT,
      properties: {
        protokoll_eintrag: { type: SchemaType.STRING },
        lp_neu: { type: SchemaType.INTEGER },
        weltstand_update: { type: SchemaType.STRING, nullable: true },
        npc_update: { type: SchemaType.STRING, nullable: true },
      },
      required: ["protokoll_eintrag", "lp_neu"],
    },
  },
  required: ["narration", "wuerfel_noetig", "lp_aenderung",
             "neue_buttons", "neue_szene", "musik_wechsel", "speichern"],
};
```

### Beispiel-Response

```json
{
  "narration": "Du betrittst Raum 4c. Er riecht nach kaltem Kaffee und dem Jahr 1994. An der Wand: ein Schild. Es sagt **»Amt für unklare Verhältnisse«**. Darunter, kleiner: *»Zuständigkeit wird geprüft.«* Der Stempel daneben ist von 1987.",
  "wuerfel_noetig": false,
  "wuerfel_ergebnis": null,
  "lp_aenderung": 0,
  "neue_buttons": ["Schild näher ansehen", "Schreibtisch untersuchen", "Den Raum wieder verlassen"],
  "neue_szene": true,
  "bild_prompt": "First-person POV entering a small municipal office room, cold fluorescent light, a desk with stacked forms, a wall sign reading 'Amt für unklare Verhältnisse', institutional beige walls, 1990s office equipment, uncanny stillness.",
  "bild_wiederverwenden": null,
  "musik_wechsel": true,
  "musik_prompt": "minimal drone, bureaucratic ambience, single piano note, low hum of fluorescent light",
  "speichern": {
    "protokoll_eintrag": "Szene 5: Tomas betritt Raum 4c. Amt für unklare Verhältnisse. Schild bestätigt Zuständigkeit in Prüfung seit unbekanntem Datum.",
    "lp_neu": 73,
    "weltstand_update": "Raum 4c gefunden und betreten.",
    "npc_update": null
  }
}
```

---

## Bildgenerierung: Antigravity 2.0

### Integration

```typescript
import AntigravityClient from "antigravity-sdk";

const ag = new AntigravityClient({
  apiKey: process.env.ANTIGRAVITY_API_KEY!,
  version: "2.0",
});

async function generiereSceneBild(prompt: string): Promise<string> {
  const result = await ag.images.generate({
    prompt: `${prompt}. Style: bureaucratic surrealism, first-person perspective,
             fluorescent office lighting, institutional beige, David Lynch atmosphere,
             hyperreal detail, slight color desaturation, uncanny normality.`,
    negativePrompt: "fantasy elements, bright colors, anime, cartoon, sunlight as primary source",
    width: 1024,
    height: 576,
    format: "webp",
    quality: "standard",
    seed: null,
  });
  return result.imageUrl;
}
```

### Asset-Wiederverwendung

Vor jeder Generierung prüft `antigravity.ts` gegen den lokalen Bilder-Index:

```typescript
async function bildMitCachePrüfung(prompt: string, tags: string[]): Promise<string> {
  const cachedPath = await findeCachedBild(tags);
  if (cachedPath) return cachedPath;

  const url = await generiereSceneBild(prompt);
  await speichereBildLokal(url, tags);
  return url;
}
```

- **Format:** 16:9, 1024×576px, WebP
- **Trigger:** `neue_szene: true` im Gemini-Response
- **Ladezeit:** im Hintergrund, non-blocking (Spinner im Bild-Bereich)
- **Fallback:** Typografisches Placeholder-Bild mit Szenenbeschreibung

---

## Musiksystem

- Bei Szenenwechsel: Neuer Musiktrack wird gestartet (loop, 3-Sek.-Crossfade)
- Lautstärke: 10% (fest, globaler Mute-Button)
- Musikgenerierung: Nur bei neuen Stimmungstypen (8–12 Tracks für das gesamte Spiel)
- Trigger: `musik_wechsel: true` + `musik_prompt` im Gemini-Response

---

## Sprache

Beim ersten Start: Auswahl **Deutsch / English**.
Gemini antwortet nativ in beiden Sprachen — kein separates Übersetzungs-Layer nötig.
Einstellung in `spieler_status.md` gespeichert.

---

## Spielstart-Flow

```
1. Startscreen: "KALDERMÜND" + KVR-Atmosphären-Bild (Antigravity)
2. Sprache wählen: Deutsch / English
3. Neues Spiel / Fortsetzen
4. Bei Neuem Spiel: Kurze Charakter-Einführung (30 Sek. Lesen)
5. Erstes Szenenbild wird generiert (KVR-Wartezimmer, Antigravity)
6. Gemini startet Spielleiter-Narration
7. Erste Buttons erscheinen (generiert von Gemini)
8. Spieler ist aktiv
```

---

## Dateistruktur der App

```
/src
  /app
    page.tsx              ← Hauptspielseite
    layout.tsx
  /components
    GameView.tsx          ← Szene + Text + Buttons
    NarratorText.tsx      ← Erzähltext-Darstellung
    ActionButtons.tsx     ← Dynamische Button-Leiste
    LPBar.tsx             ← Lebensenergie-Anzeige
    SceneImage.tsx        ← Bild mit Loader
    AudioPlayer.tsx       ← Hintergrundmusik
    TextInput.tsx         ← Freitext + Mikrofon
  /lib
    gemini.ts             ← KI-Spielleiter-Calls (Gemini API)
    antigravity.ts        ← Bildgenerierung (Antigravity 2.0)
    saveSystem.ts         ← Speichersystem / Markdown-IO
    diceRoller.ts         ← Würfelmechanik
  /styles
    kaldermünd-theme.css  ← Bürokratie-Farben, Monospace-Schriften
/public
  /assets
    /bilder/
      INDEX.md            ← Tag-basierter Bild-Cache-Index
    /musik/
```

---

## Environment Variables

```env
GEMINI_API_KEY=...           # Google AI Studio oder Vertex AI
ANTIGRAVITY_API_KEY=...      # Antigravity 2.0 Zugangsdaten
```

---

## Performance-Überlegungen

| Komponente | Latenz | Anmerkung |
|---|---|---|
| Gemini 2.5 Pro (Narration) | ~3–6 Sek. | Streaming möglich für schnelleres Erscheinen |
| Gemini 2.0 Flash (Buttons) | ~1–2 Sek. | Für einfache, schnelle Reaktionen |
| Antigravity 2.0 (Bild) | ~8–15 Sek. | Non-blocking, im Hintergrund |
| Musik | sofort | Lokale Assets nach erstem Stream |
| Spielprotokoll speichern | <100ms | File System Access API, synchron |

**Streaming:** Gemini unterstützt `generateContentStream()` — der Erzähltext erscheint Wort für Wort, wie ein Spielleiter, der tippt. Das reduziert die wahrgenommene Latenz drastisch.

```typescript
const stream = await model.generateContentStream(prompt);
for await (const chunk of stream.stream) {
  const text = chunk.text();
  appendToNarrationBox(text);
}
```

**Kontextfenster-Strategie:** Mit 1M Tokens in Gemini 2.5 Pro bleibt das vollständige Spielprotokoll immer im Kontext. Kein Zusammenfassen, kein Vergessen — die Konsistenz der Spielwelt ist strukturell garantiert.
