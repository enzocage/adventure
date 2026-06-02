# 🏛️ Kaldermünd — Ein surreales Bürokratie-Rollenspiel

**Kaldermünd** ist ein interaktives Web-Rollenspiel (RPG) im Stil eines lynchianischen, kafkaesken Bürokratie-Horrors. Du schlüpfst in die Rolle von **Tomas Gretsch**, einem kleinen Beamten in der gigantischen „Behörde für Restrungen & Statistik“ (KVR) der Stadt Kaldermünd. Konfrontiert mit der drohenden Aktivierung der unheilvollen *Stillen Maschine* und deiner eigenen gefährlichen Gabe, Lügen physisch zu spüren (Lügengehör), versuchst du, die bürokratischen Geheimnisse der Stadt zu entschlüsseln.

Das Spiel nutzt modernste Generative AI (Gemini 2.5 Pro, Grok TTS, Imagen 4.0 & Lyria 3) für eine vollständig dynamische, sprachgesteuerte und visuelle Generierung von Geschichten, Bildern und Soundtracks in Echtzeit.

---

## 🛠️ Hauptfeatures & Systemarchitektur

### 1. Dynamischer Lore-Compiler (AI-Spielleiter)
* **Runtime Lore Integration**: Der Spielleiter ([gemini.ts](file:///src/lib/gemini.ts)) liest die Lore-Markdown-Dateien der Welt (`Welt.md`, `Protagonist.md`, `Antagonist.md`, `Spielmechanik.md`, `Superkraft.md`, `Einschraenkung.md`, `Nebenquests.md`) bei jedem Spielzug direkt von der Festplatte aus.
* **Echtzeit-Anpassung**: Bearbeitest du die Story-Dateien im Projektordner, fließt diese Änderung augenblicklich in das Verhalten und das Gedächtnis des KI-Spielleiters beim nächsten Zug ein!
* **Strukturierte JSON-Ausgabe**: Der Spielleiter bewertet die Spieleraktionen, verwaltet Lebenspunkte (LP), steuert Szenenübergänge und gibt dynamische Multiple-Choice-Handlungsbuttons aus.

### 2. Live Generative Medien (Bilder, Musik & Sprache)
* **Imagen 4.0 Bildgenerierung**: Über `/api/images` erzeugt Google's `imagen-4.0-fast-generate-001` zu jeder Aktion ein passendes, surreales Behördengemälde im Retro-Kamera-Look. Ein stilvoller Entwickler-Belichtungs-Screen überbrückt die Ladezeit. Tritt ein Fehler auf, greift das Spiel auf prozedurale, unheimliche SVG-Vektorgrafiken zurück.
* **Lyria 3 Musik-Loops**: Der Spielleiter steuert die Sound-Atmosphäre. Die Next.js-API `/api/music` generiert über `lyria-3-clip-preview` endlose, düstere Ambient-Tracks (z. B. industrielle Drohnen, langsame Klaviere, tickende Uhrwerke), die im Browser geloopt werden.
* **xAI Grok TTS (Text-to-Speech)**: Das Spiel liest die Antworten des Spielleiters mit der markanten Stimme `"Eve"` vor. Die API `/api/tts` nutzt BCP-47 zur automatischen Sprachdetektion (Deutsch/Englisch) und streamt hochwertige MP3-Dateien direkt an den Browser.
* **Spracherkennung (STT)**: Über das Mikrofon-Symbol können Spieler Aktionen direkt einsprechen. Die API `/api/transcribe` transkribiert die Audiodaten mithilfe von Gemini und fügt sie in das Texteingabefeld ein.
* **Lokaler Medien-Cache**: Um API-Kosten zu sparen und Ladezeiten zu minimieren, werden alle generierten Bilder und Musikclips unter `saves/image_cache/` und `saves/audio/` zwischengespeichert.

### 3. Interaktives d100 Würfelsystem
* Erfordert eine Aktion besonderes Geschick oder Risiko, verlangt der Spielleiter eine **d100-Prüfung** (`wuerfel_noetig: true`).
* Das Interface schaltet automatisch auf ein mechanisches Würfel-Panel um.
* Es berechnet automatisch Boni und Malusse (z. B. *Lügengehör-Bonus +15*, *Erschöpfungsmalus -10 bei niedrigen LP* oder *Resonanzsperre -20*).
* Der Spieler würfelt physisch per Button-Click, liest den Ausgang (z. B. *Kritischer Erfolg*, *Teilmisserfolg*, *Katastrophe*) und sendet das Ergebnis an den Spielleiter, der die Geschichte entsprechend fortführt.

### 4. Transparentes HUD & Viewport-Layout (Kein Scrollen!)
Die gesamte Benutzeroberfläche ist darauf optimiert, ohne äußere Scrollbalken exakt in einen einzigen Viewport (`100vh`) zu passen.
* **Widescreen-Split (2/3 zu 1/3)**: Die linke Bildschirmseite (2/3) gehört ganz der Szenerie – ein **vollständig rahmenloses** Bild (`object-cover`) mit CRT-Scanline-Raster und Filmvignette, das per Klick vergrößert werden kann. Die rechte Seite (1/3) beherbergt die Aktionskontrollen (kompakte Buttons in `text-xs`) und die scrollbare Narration.
* **Transparente Kopfleiste**:
  * **Status & Kosten-HUD**: Echtzeit-Kostenkontrolle in USD (basierend auf Gemini 2.5 Pro Raten: $1.25/1M Input, $5.00/1M Output) sowie die Gesamtanzahl der verbrauchten Tokens.
  * **Integrierte LP-Anzeige**: Tomas' Lebenspunkte (LP) werden platzsparend direkt neben dem Titel mit einer kleinen, farbwechselnden Status-Bar (Grün ➔ Gelb ➔ pulsierendes Rot) angezeigt.
  * **KI-Rechenindikator**: Ein prominenter bernsteinfarbener Scanline-Ladebalken läuft am oberen Bildschirmrand entlang, während eine pulsierende Status-Plakette (`[ KVR BEHÖRDE PRÜFT AKTENLAGE... ]` bzw. mobil `[ PRÜFT... ]`) signalisiert, wenn die KI nachdenkt.
* **Personalakte (Spielerblatt) als Manila-Ordner**: Über den Header lässt sich Tomas' KVR-Personalakte als retro-beige Aktenmappe einblenden. Sie listet in Tabs übersichtlich das Inventar, aktive körperliche Beeinträchtigungen, Quests, NPCs und den unaufhaltsamen Countdown der *Stillen Maschine* auf.

---

## 🚀 Erste Schritte / Installation

### 1. Voraussetzungen
Du benötigst Node.js (v18+) und entsprechende API-Schlüssel für Google Gemini und xAI Grok.

### 2. Umgebungsvariablen einrichten
Erstelle eine Datei namens `.env` im Stammverzeichnis des Projekts und trage deine API-Schlüssel ein:

```env
# Google Gemini API Key (für Spielleiter, STT & Medien)
GEMINI_API_KEY="dein-gemini-api-key"

# xAI Grok API Key (für die Text-to-Speech-Sprachausgabe)
XAI_API_KEY="dein-grok-api-key"
XAI_TTS_VOICE="Eve"
```

### 3. Abhängigkeiten installieren
Installiere die benötigten Node-Pakete:
```bash
npm install
```

### 4. Server starten
Starte den Next.js-Entwicklungsserver:
```bash
npm run dev
```

Öffne nun [http://localhost:3000](http://localhost:3000) im Webbrowser.

---

## 💾 Markdown-basiertes Speichersystem

Kaldermünd nutzt ein hybrides, menschenlesbares Speichersystem. Alle Spielstände werden im Verzeichnis `saves/` in lesbarem Markdown abgelegt:
* `spieler_status.md`: Aktuelle Lebenspunkte, Inventar, Buffs/Debuffs und Token-Statistiken.
* `protokoll.md`: Das vollständige Spielprotokoll des Abenteuers.
* `weltstand.md`: Der Zustand der Welt (z. B. Betriebsstunden der Stillen Maschine).
* `nebencharaktere.md` & `nebenquests.md`: Status aller getroffenen Personen und Aufträge.

**Das Besondere**: Am Ende jeder Markdown-Datei befindet sich ein unsichtbarer JSON-Kommentar (`<!-- STATE_JSON {"lp": 80, ...} -->`). Dadurch kann die Engine den Spielstand präzise maschinell auslesen, während du als Mensch die Markdown-Akten einfach im Texteditor öffnen, lesen und manuell manipulieren kannst.

---

## 🏛️ KVR-Richtlinien für Tomas Gretsch
* **Lügen haben Gewicht**: Achte auf deine Resonanz. Wer zu viel lügt oder Lügen ausgesetzt ist, erleidet Schaden an der mentalen Stabilität.
* **Zeit ist relativ, aber endlich**: Jede deiner Aktionen lässt die *Stille Maschine* näher an ihre Aktivierung rücken. Behalte die Stundenanzeige im Spielerblatt im Auge.
* **Formularwesen**: Dokumente der Klasse 3B sind stets vertraulich zu behandeln. Das Entwenden von Aktenordnern aus Archivraum 4C ist ohne Formular G-14b untersagt.
