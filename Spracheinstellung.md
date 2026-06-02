# Spracheinstellung / Language Settings

---

## Unterstützte Sprachen

Das Spiel ist vollständig zweisprachig: **Deutsch** und **Englisch**.

Die Sprachwahl erfolgt beim ersten Start und kann jederzeit in den Einstellungen (⚙) geändert werden. Alle KI-generierten Inhalte, Buttons, UI-Texte und Medien-Prompts passen sich automatisch an.

---

## Was sich mit der Sprache ändert

| Element | Deutsch | English |
|---|---|---|
| Spielleiter-Narration | Deutsch | English |
| Buttons | z.B. "Türe öffnen" | "Open the door" |
| UI-Labels (LP, Inventar etc.) | Deutsch | English |
| Bild-Prompts | Englisch (immer) — Antigravity 2.0 ist EN-optimiert | English |
| Musik-Prompts | Englisch (immer) | English |
| Fehler- und Systemmeldungen | Deutsch | English |
| Charakternamen & Orte | Spielwelt-Eigennamen (unveränderlich) | Spielwelt-Eigennamen (unveränderlich) |

*Charakternamen und Ortsnamen bleiben in beiden Sprachen identisch — sie gehören zur Welt, nicht zur Interface-Sprache.*

---

## Technische Umsetzung

```typescript
// i18n-System mit next-intl oder eigener JSON-Struktur
/locales
  de.json    ← Deutsche UI-Strings
  en.json    ← English UI-Strings

// Spielleiter System-Prompt Sprachselektor
const systemPrompt = language === 'de'
  ? SPIELLEITER_PROMPT_DE
  : SPIELLEITER_PROMPT_EN;
```

---

## Spielleiter-Prompt Sprachparameter

Jeder API-Call an Gemini enthält:

```
SPRACHE: Deutsch
Antworte ausschließlich auf Deutsch.
Alle Charakterdialoge, Beschreibungen und Narration auf Deutsch.
```

oder:

```
LANGUAGE: English
Respond exclusively in English.
All character dialogue, descriptions and narration in English.
```

---

## Kulturelle Anpassungen

**Deutsch:** Förmlichkeit in Charakterdialogen — NPCs siezen Tomas bis Vertrauen aufgebaut ist. Das erhöht den bürokratischen Charakter der Spielwelt.

**English:** NPCs tend toward slightly more direct address — the world's formality is conveyed through vocabulary and sentence structure rather than pronoun choice.

---

## Standardsprache

Default beim ersten Start: **Deutsch** (da Primärnutzer deutschsprachig).

Sprache wird in `spieler_status.md` gespeichert:

```markdown
**Sprache:** Deutsch
```
