# Speichersystem: Automatisches Spielprotokoll

---

## Prinzip

Der gesamte Spielverlauf wird automatisch in einem strukturierten System von Markdown-Dateien gespeichert. Das Protokoll dient als das **Gedächtnis der KI** — jede neue Spielleiter-Antwort basiert auf allen bisherigen gespeicherten Zuständen.

Kein manuelles Speichern nötig. Kein Spielstand-Menü. Das Spiel hält sich selbst fest.

---

## Verzeichnisstruktur

```
/saves/
  /session_DATUM/
    spieler_status.md       ← LP, Resonanz, Inventar, aktuelle Position
    protokoll.md            ← Vollständiger Spielverlauf (Szene für Szene)
    charakterbogen.md       ← Entwicklungsstand, Entscheidungen, Beziehungen
    weltstand.md            ← Was hat sich in Kaldermünd verändert?
    nebencharaktere.md      ← Status aller NPCs (lebendig, tot, verbündet, feindlich)
    wuerfelprotokoll.md     ← Alle Würfe mit Kontext und Ergebnis
    nebenquests.md          ← Aktive / abgeschlossene / verpasste Nebenquests

/assets/
  /bilder/
    kvr_wartezone_neon.webp
    untergeschoss_gang.webp
    werkstatt_abend.webp
    ... (alle generierten Szenenbilder)
  /musik/
    neon_hum_ambience.mp3
    stille_zone_drone.mp3
    untergeschoss_piano.mp3
    verfolgung_industrial.mp3
    ... (alle generierten Musikloops)
```

---

## spieler_status.md — Format

```markdown
# Spielerstatus

**Stand:** 2026-10-15 | Szene 7

| | |
|---|---|
| **Lebensenergie** | 73 / 100 LP |
| **Resonanz** | Belastet (–10 auf Wahrnehmungswürfe) |
| **Ort** | Verwaltungszentrum, Untergeschoss –2 |
| **Zeit** | Dienstag, 16:42 Uhr |

## Inventar
- Hausausweis KVR (Rahmenvertrag Kerzenlieferung)
- Zettel von Ornstein (Formular U-0 / Hinweis)
- Taschenmesser (Arbeitswerkzeug)
- 23 Euro, Stadtbahnticket (gültig bis 18:00)

## Aktiver Effekt
- Wunde am rechten Unterarm (bis Szene 10 –5 auf Kampfwürfe)
```

---

## protokoll.md — Format

```markdown
# Spielprotokoll

---

## Szene 1 — D-347
**Zeit:** Dienstag, 09:14 Uhr
**Ort:** Verwaltungszentrum, Wartezone C, Erdgeschoss

[Vollständige Spielleiter-Narration]

**Spieleraktion:** Zettel aufheben. Sicherheitsmann fragt — Tomas schweigt statt zu lügen.
**Würfelwurf:** entfallen (keine ambitionierte Aktion)
**Ergebnis:** Sicherheitsmann akzeptiert das Schweigen. Tomas ist frei.
**LP-Änderung:** keine

---

## Szene 2 — ...
```

---

## weltstand.md — Format

```markdown
# Weltstand

**Stille Zonen aktiv:**
- [ ] Wartezone C, EG (AUFGELÖST, Szene 1)
- [x] KVR Raum 4c, 2. OG (seit Szene 3)
- [x] Untergeschoss –2, Gang B (seit Szene 5, wächst)

**Bekannte Fakten über die Goldene Lüge:**
- Tomas weiß: Es gibt ein Archiv in den Untergeschossen
- Tomas weiß nicht: Was der Originaldraftentwurf der Stadtverfassung wirklich sagt

**Status der Stille Maschine:**
- Ornstein: 72 Stunden bis zur Aktivierung (Stand: Szene 6)
```

---

## nebencharaktere.md — Format

```markdown
# Nebencharaktere

## Katrijn Voss
- **Status:** Verbündet, lebendig
- **Ort:** Copyshop, Schmalfassgasse 9
- **Weiß:** Tomas hat den Zettel von Ornstein
- **Vertraut:** Tomas vollständig
- **Letzt gesehen:** Szene 4

## Rainer Molt
- **Status:** Schwer belastet, in ambulanter Behandlung
- **Ort:** Ärztehaus, Bahnhofstraße 14
- **Weiß:** Standort von Ornsteins Archiv (unbewusst)
- **Kann sprechen:** nur in Behördenformulierungen (seit der Stille-Zone)
```

---

## Wiederverwendung von Assets

Vor jeder neuen Bild- oder Musikgenerierung prüft der Spielleiter:

```
PRÜFUNG: Existiert ein passendes Bild für "Neon, KVR-Flur, Untergeschoss, leer"?
→ JA: /assets/bilder/untergeschoss_gang.webp verwenden
→ NEIN: Neu generieren via Antigravity 2.0, speichern, katalogisieren
```

Bilder-Index (`/assets/bilder/INDEX.md`) enthält Tags für jedes Bild.

---

## Sitzungsübergreifende Kontinuität

Wenn eine neue Spielsitzung beginnt, liest der Spielleiter:
1. `spieler_status.md` — Wo stehen wir?
2. `protokoll.md` — Was ist passiert?
3. `weltstand.md` — Was hat sich verändert?
4. `nebencharaktere.md` — Wer ist wo, in welchem Zustand?

Dann formuliert er einen kurzen **Rückblick für den Spieler** (max. 3 Sätze) und setzt nahtlos fort.
