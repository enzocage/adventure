# Technische Architektur: Die Web-App

---

## Überblick

Das Spiel läuft als **Progressive Web App (PWA)** im Browser. Keine Installation nötig. Vollständig responsiv (Desktop-First, aber auch auf Tablet spielbar).

---

## Tech Stack

| Schicht | Technologie | Zweck |
|---|---|---|
| **Frontend** | Next.js 14 + React | SPA mit Server-Side Rendering |
| **Styling** | Tailwind CSS + CSS Variables | Dark Theme, Kupferstich-Ästhetik |
| **KI-Spielleiter** | Claude API (claude-sonnet-4-6) | Narration, Weltlogik, Würfeln |
| **Bildgenerierung** | Nanobanana API | Szenenbilder (Egoperspektive) |
| **Musik** | Web Audio API + generierte MP3s | Atmosphären-Loops bei 10% Volumen |
| **Speicherung** | Lokale Markdown-Dateien via File System Access API | Spielprotokoll, Saves |
| **Speech-to-Text** | Web Speech API (Browser-nativ) | Spracheingabe für Spieleraktionen |
| **State Management** | Zustand (lightweight React state) | Spielerzustand, LP, aktive Szene |

---

## UI-Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                     VELUNDRA                         [⚙] [🔊]  │
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
│  Scrollbarer Erzählbereich, Schrift in Kupferstich-Optik        │
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

## KI-Integration (Claude als Spielleiter)

### System Prompt Struktur

Der Spielleiter erhält bei jeder Anfrage:
1. **Rollen-Prompt:** Wer ist die KI (Spielleiter, Velundra, Mechaniken)
2. **Weltkontext:** Komprimierte Referenz auf Welt.md, Protagonist.md, Antagonist.md
3. **Aktueller Spielstand:** Inhalt von spieler_status.md
4. **Letzten N Szenen:** Die letzten 3 Szenen aus protokoll.md (für Konsistenz)
5. **Spieleraktion:** Was der Spieler jetzt tun möchte

### Response-Format der KI

Die KI antwortet immer in strukturiertem JSON:

```json
{
  "narration": "Erzähltext für den Spieler (HTML erlaubt für Kursiv/Fett)",
  "wuerfel_noetig": true,
  "wuerfel_ergebnis": 67,
  "lp_aenderung": -5,
  "neue_buttons": [
    "Fluss schwimmen",
    "Ans Ufer greifen",
    "Um Hilfe rufen"
  ],
  "neue_szene": false,
  "bild_prompt": "Man's POV looking at rushing river, stone bank, dark forest...",
  "bild_wiederverwenden": null,
  "musik_wechsel": false,
  "musik_prompt": null,
  "speichern": {
    "protokoll_eintrag": "...",
    "lp_neu": 68,
    "weltstand_update": null,
    "npc_update": null
  }
}
```

---

## Bildgenerierung

- Trigger: `neue_szene: true` im KI-Response
- Vor Generierung: Vergleich mit Bilder-Index (Tag-basiert)
- Generierungszeit: im Hintergrund, Spinner im Bild-Bereich
- Format: 16:9, 1024×576px, WebP
- Fallback: Typografisches Placeholder-Bild mit Szenenbeschreibung

---

## Musiksystem

- Bei Szenenwechsel: Neuer Musiktrack wird gestartet (loop)
- Lautstärke: 10% (fest, nur globaler Mute-Button)
- Übergang: 3-Sekunden-Crossfade
- Musikgenerierung: Nur bei neuen Stimmungstypen (Stadtambience, Gefahr, Stille, etc.)
- Katalog aufbauen: Im Verlauf des Spiels entsteht eine Bibliothek von 8–12 Tracks

---

## Sprache

Beim ersten Start: Auswahl **Deutsch / English**. Beeinflusst:
- Spielleiter-Prompts (KI antwortet in gewählter Sprache)
- UI-Texte
- Button-Labels
- Alle generierten Inhalte

Einstellung in `spieler_status.md` gespeichert. Jederzeit änderbar in den Settings.

---

## Spielstart-Flow

```
1. Startscreen mit Titel "Velundra" und Atmosphären-Bild
2. Sprache wählen
3. Neues Spiel / Fortsetzen
4. Bei Neuem Spiel: Kurze Charakter-Einführung (30 Sekunden Lesen)
5. Erstes Szenenbild wird generiert (Marktszene)
6. Spielleiter-Text beginnt
7. Erste Buttons erscheinen
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
    claude.ts             ← KI-Spielleiter-Calls
    nanobanana.ts         ← Bildgenerierung
    saveSystem.ts         ← Speichersystem / Markdown-IO
    diceRoller.ts         ← Würfelmechanik
  /styles
    velundra-theme.css    ← Kupferstich-Farben, Schriften
/public
  /assets
    /bilder/
    /musik/
```

---

## Performance-Überlegungen

- Spielleiter-Antwort: ~2–4 Sekunden (Claude API)
- Bildgenerierung: ~8–15 Sekunden (im Hintergrund, non-blocking)
- Musik: Sofort (lokale Assets nach erstem Stream)
- Token-Optimierung: Protokoll wird komprimiert (ältere Szenen als Zusammenfassung)
