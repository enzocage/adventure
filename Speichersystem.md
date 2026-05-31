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
    weltstand.md            ← Was hat sich in Velundra verändert?
    nebencharaktere.md      ← Status aller NPCs (lebendig, tot, verbündet, feindlich)
    wuerfelprotokoll.md     ← Alle Würfe mit Kontext und Ergebnis
    nebenquests.md          ← Aktive / abgeschlossene / verpasste Nebenquests

/assets/
  /bilder/
    markt_stille_zone.png
    werkstatt_nacht.png
    ... (alle generierten Szenenbilder)
  /musik/
    stadtambience_tag.mp3
    kathedrale_stille.mp3
    gefahr_verfolgung.mp3
    ... (alle generierten Musikloops)
```

---

## spieler_status.md — Format

```markdown
# Spielerstatus

**Stand:** 2024-10-15 | Szene 7

| | |
|---|---|
| **Lebensenergie** | 73 / 100 LP |
| **Resonanz** | Belastet (–10 auf Wahrnehmungswürfe) |
| **Ort** | Kerzenviertel, Schmalfassgasse 11 |
| **Zeit** | Dienstag, Abend, Stunde der Kerze |

## Inventar
- Wachsgießer-Werkzeug
- Zettel mit der Botschaft
- Kleines Messer (Arbeitswerkzeug)
- 4 Silbermünzen

## Aktiver Effekt
- Wunde am rechten Unterarm (bis Szene 10 –5 auf Kampfwürfe)
```

---

## protokoll.md — Format

```markdown
# Spielprotokoll

---

## Szene 1 — Der Markt und das Schweigen
**Zeit:** Dienstag, Morgen
**Ort:** Wachsviertel, Wochenmarkt

[Vollständige Spielleiter-Narration]

**Spieleraktion:** Zettel aufheben, Guard anlügen versucht — Kehle versagt, schweigt statt.
**Würfelwurf:** entfallen (keine ambitionierte Aktion)
**Ergebnis:** Guard akzeptiert das Schweigen. Tomas ist frei.
**LP-Änderung:** keine

---

## Szene 2 — ...
```

---

## weltstand.md — Format

```markdown
# Weltstand

**Stille Zonen aktiv:**
- [ ] Wachsviertel Marktplatz (AUFGELÖST, Szene 1)
- [x] Kathedrale Ostturm (seit Szene 3)
- [x] Rathauskeller (seit Szene 5, wächst)

**Bekannte Fakten über die Goldene Lüge:**
- Tomas weiß: Es gibt ein Archiv
- Tomas weiß nicht: Was dort drin ist

**Status der Stille Maschine:**
- Ornstein: 72 Stunden bis zur Aktivierung (Stand: Szene 6)
```

---

## nebencharaktere.md — Format

```markdown
# Nebencharaktere

## Katrijn Voss
- **Status:** Verbündet, lebendig
- **Ort:** Schreibstube, Schmalfassgasse 9
- **Weiß:** Tomas hat den Zettel
- **Vertraut:** Tomas vollständig
- **Letzt gesehen:** Szene 4

## Fenn Rouch
- **Status:** Schwer verletzt, in Obhut der Heiler
- **Ort:** Heilhaus, Altstadt
- **Weiß:** Standort des Stillen Archivs
- **Kann sprechen:** nein (seit der Stille-Zone)
```

---

## Wiederverwendung von Assets

Vor jeder neuen Bild- oder Musikgenerierung prüft der Spielleiter:

```
PRÜFUNG: Existiert ein passendes Bild für "Nacht, Kerzenwerkstatt, Innenraum, warm"?
→ JA: /assets/bilder/werkstatt_nacht.png verwenden
→ NEIN: Neu generieren, speichern, katalogisieren
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
