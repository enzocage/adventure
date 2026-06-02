# Spielmechanik: Das Abenteuer in Kaldermünd

**Ein KI-geleitetes surreales Bürokratie-Rollenspiel**

---

## Konzept

Das Spiel ist ein Rollenspiel analog zu *Das Schwarze Auge* — ein Einzelspieler-Erlebnis als **Web-App im Browser**, in dem die KI vollständig die Rolle des Spielleiters übernimmt. Der Spieler verkörpert Tomas Gretsch, Kerzenmacher und unfreiwilliger Wahrheitsdetektiv in der Stadt Kaldermünd.

Die KI erschafft, erzählt und leitet. Der Spieler handelt, entscheidet und erlebt.

Technische Details: → [Technische_Architektur.md](Technische_Architektur.md)

---

## Die KI als Spielleiter

Der Spielleiter:
- Erzählt, **wer** Tomas ist, **was** er kann und nicht kann
- Beschreibt, **wo** er sich befindet, **was** er sieht, hört, riecht
- Teilt Tomas' **Lügengehör-Wahrnehmung automatisch mit** — immer aktiv, kein Einschalten nötig
- Bietet **Handlungsoptionen als Buttons** an (für klare, naheliegende Aktionen)
- Akzeptiert **freie Texteingabe** und **Speech-to-Text** für Freitext-Aktionen
- Erschafft **Nebencharaktere** mit eigenen Motivationen und Sprache
- Prüft, ob gewünschte Handlungen **möglich** sind — und bietet Alternativen wenn nicht
- Würfelt bei ambitionierten Aktionen mit dem **100-seitigen Zufallswürfel**
- Formuliert das **narrative Ergebnis** des Würfelwurfs vollständig aus
- Generiert zu jeder neuen Szene ein **Bild** (Egoperspektive via Antigravity 2.0)
- Spielt **Hintergrundmusik** (loop, 10% Lautstärke) passend zur Stimmung
- Speichert automatisch alle generierten Medien zur Wiederverwendung

Speichersystem: → [Speichersystem.md](Speichersystem.md)
Sprache: → [Spracheinstellung.md](Spracheinstellung.md) (Deutsch / English wählbar)

---

## Das Lügengehör im Spiel (automatisch aktiv)

Tomas' Kraft ist **immer eingeschaltet**. Der Spielleiter teilt die Wahrnehmung automatisch mit — als Teil der Szenen-Beschreibung, ohne dass der Spieler sie aktivieren muss:

> *„Der Händler preist seine Ware an — du hörst das vertraute Kratzen einer kleinen Lüge, harmlos, routiniert."*

> *„Der Wachmann antwortet dir. Kein Misston. Er glaubt, was er sagt."*

> *„Die Amtsleiterin erklärt die Bearbeitungszeit. Ein metallisches Kreischen übertönt fast ihre Worte. Du weißt: Das ist eine konstruierte Lüge, nicht aus Angst — aus Gewohnheit."*

Der Spieler braucht keine Aktion, um zu hören. Er hört immer. Das ist Tomas' Welt.

---

## Spieler-Interface

### Buttons
Buttons für alle offensichtlichen Handlungsoptionen der aktuellen Szene:

```
[ Türe öffnen ]   [ Das Licht löschen ]   [ Sprechen ]   [ Verstecken ]
```

### Freitext / Sprache
Jede Eingabe ist möglich — Text oder Mikrofon:
> *„Ich versuche, hinter das Regal zu schauen, ohne dass mich jemand bemerkt."*

### Reaktion der KI auf Freitext
1. Prüfung: Ist die Aktion in der konsistenten Spielwelt möglich?
2. Falls ja → Würfelwurf wenn nötig, dann narratives Ergebnis
3. Falls nein → Alternative anbieten mit kurzer, weltlogischer Begründung

---

## Lebensenergie

| Zustand | Punkte |
|---|---|
| **Start** | 100 LP |
| **Tod** | 0 LP |
| **Kritisch** | unter 20 LP |
| **Verletzt** | unter 50 LP |
| **Gesund** | 75–100 LP |

**LP-Verlust durch:** Kampf, Kälte, Sturz, Vergiftung, Lügenüberlastung in Massen (Resonanz-Überforderung)

**LP-Gewinn durch:**
- Kurze Rast: +5 LP
- Ausschlafen in Sicherheit: +20 LP
- Gute Mahlzeit: +10 LP
- Erste Hilfe / kurze Pause an frischer Luft: +8 LP
- Ibuprofen + Wasser (wenn rechtzeitig): +5 LP
- Tomas-spezifisch: Eine Stunde ohne eine einzige Lüge (Tiere, kleine Kinder, Katrijn): +15 LP

Charakterentwicklung und LP-Entwicklung: → [Charakterentwicklung.md](Charakterentwicklung.md)

---

## Der 100-seitige Würfel

Bei ungewissen oder ambitionierten Aktionen:

| Ergebnis | Interpretation |
|---|---|
| **1–10** | Katastrophe — schlimmstmögliches Ergebnis |
| **11–25** | Misserfolg mit Konsequenzen |
| **26–45** | Teilmisserfolg — teils geschafft, teils nicht |
| **46–65** | Gemischtes Ergebnis — Ziel erreicht, aber mit Preis |
| **66–85** | Erfolg mit kleiner Einschränkung |
| **86–99** | Voller Erfolg |
| **100** | Kritischer Erfolg — besser als erwartet |

**Modifikatoren (simpel):**
- Lügengehör-Aktion: +15
- Lügen-Aktion (Tomas versucht zu täuschen): –20 (Einschränkung)
- Körperliche Erschöpfung (unter 30 LP): –10
- Verbündeter hilft aktiv mit: +10

---

## Kampf

Kämpfe werden **nicht taktisch** ausgeführt. Kein Rundenmanagement, keine Gegner-Aktionen im Detail.

Wenn Tomas kämpft:
1. Spieler beschreibt, was er tut
2. Spielleiter würfelt (1–100)
3. Spielleiter erzählt das vollständige narrative Ergebnis — inkl. LP-Verlust/Gewinn

**Beispiel:**
> Spieler: *„Ich schlage den Wachmann mit dem Kerzenständer."*
>
> Würfelergebnis: **31**
>
> Spielleiter: *„Du holst aus — aber der Wachmann dreht sich rechtzeitig. Der Kerzenständer trifft seine Schulter statt den Kopf. Er taumelt, fluchend. Du hast Zeit — aber er kommt gleich zurück. Du verlierst 8 LP (Gegenschlag streift deinen Arm). Was jetzt?"*

Tomas ist kein Kämpfer. Das System reflektiert das: hohe Würfelergebnisse im Kampf sind selten, weil er es schlicht nicht gut kann.

---

## Nebenquests

Neben der Haupthandlung (Ornstein stoppen) gibt es optionale Nebenstränge, die organisch in den Hauptplot eingebettet sind — keine Quest-Marker, kein Quest-Log. Der Spieler entdeckt sie durch Aufmerksamkeit.

Vollständige Nebenquest-Beschreibungen: → [Nebenquests.md](Nebenquests.md)

---

## Spielstruktur

### Makro: 5 Sessions à 60 Minuten

```
Session 1: "D-347"                          (Exposition, Spielstart im KVR)
Session 2: "Das Amt für unklare Verhältnisse" (Ermittlung, erste Verbündete)
Session 3: "Untergeschoss –4"               (Antagonist-Enthüllung, Ornsteins Archiv)
Session 4: "Das System läuft heiß"          (Eskalation, Nebenquest-Deadlines)
Session 5: "Karte gegen Wort"              (Finale, drei mögliche Enden)
```

Vollständiges Session-Design: → [Session_Design.md](Session_Design.md)

### Mikro: Szene zu Szene

```
Bild → Musik → Beschreibung (mit Lügengehör-Info) → Buttons → Spieleraktion → Würfel → Ergebnis → nächste Szene
```

---

## Charakterentwicklung

Tomas entwickelt sich **wie ein Mensch** — durch Erfahrungen, Verluste, Beziehungen, Erkenntnis. Keine Erfahrungspunkte, keine Level-Ups. Die Entwicklung spiegelt sich in Tomas' Fähigkeiten, seiner inneren Stimme und den Reaktionen der Spielwelt auf ihn.

Details: → [Charakterentwicklung.md](Charakterentwicklung.md)

---

## Spielstart

Der Startpunkt des Abenteuers ist kreativ gestaltet:
→ [Spielstart.md](Spielstart.md)

---

## Konsistenz-Prinzip

**Oberste Priorität:** Der Spielleiter führt ein laufendes Protokoll aller Ereignisse. Kein Detail, keine Aussage, kein NPC-Verhalten darf dem Protokoll widersprechen.

Gespeichert wird automatisch:
- Vollständiges Spielprotokoll (Szene für Szene)
- LP-Stand, Inventar, Entwicklungsstand
- Status aller Nebencharaktere
- Weltveränderungen (Stille Zonen, verstrichene Zeit)
- Alle generierten Bilder und Musik-Tracks (Pfade)

---

## Beispiel-Sequenz

**Spielleiter:**
> *Du stehst vor der Tür zu Untergeschoss –3. Das Neonlicht summt eine Terz zu hoch. Hinter dir: die Treppe zurück. Vor dir: eine Stahltür ohne Beschriftung, einen Spalt offen. Du hörst — nichts. Aber das Nichts hat eine Qualität. Es ist nicht leer. Es wartet.*
>
> `[ Tür weiter öffnen ]` `[ Lauschen, ohne zu bewegen ]` `[ Zurück zur Treppe ]`

**Spieler:** *„Ich schleiche durch die Tür und schaue, was dahinter ist."*

**Spielleiter (intern würfelt 34 — Teilmisserfolg):**
> *Du drückst die Tür auf — aber sie quietscht. Laut. In der Stille des Untergeschosses klingt es wie ein Schuss. Du erstarrst. Sekunden vergehen. Dann: Schritte, irgendwo im Dunkel dahinter. Sie kommen nicht näher. Sie entfernen sich. Du bist drin — aber jemand weiß, dass jemand da ist.*

---

## Spielende

| Ausgang | Beschreibung |
|---|---|
| **Tomas stirbt** (LP = 0) | Geschichte endet. Kurze Epilog-Sequenz. |
| **Ornstein überzeugt** | Ende A — die Wahrheit bleibt verborgen |
| **Kontrollierte Enthüllung** | Ende B — Teilwahrheit, Kaldermünd erschüttert |
| **Die Resonanz** | Ende C — Tomas' letzte Kraft, offenes Ende |

Es gibt kein falsches Ende.
