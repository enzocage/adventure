import fs from 'fs/promises';
import path from 'path';

export interface PlayerStatus {
  lp: number;
  resonance: string;
  location: string;
  time: string;
  inventory: string[];
  activeEffects: string[];
  sprache: 'de' | 'en';
  totalInputTokens?: number;
  totalOutputTokens?: number;
  totalCost?: number;
  // Detailed token and cost breakdown
  statsSpielleiterInputTokens?: number;
  statsSpielleiterOutputTokens?: number;
  statsSpielleiterCost?: number;
  statsTranskriptionInputTokens?: number;
  statsTranskriptionOutputTokens?: number;
  statsTranskriptionCost?: number;
  statsSzenenGenInputTokens?: number;
  statsSzenenGenOutputTokens?: number;
  statsSzenenGenCost?: number;
  statsBilderCount?: number;
  statsBilderCost?: number;
  statsMusikCount?: number;
  statsMusikCost?: number;
}

export interface Weltstand {
  stilleZonen: { [key: string]: boolean };
  knownFacts: string[];
  stilleMaschineHours: number;
}

export interface NPC {
  name: string;
  status: string;
  location: string;
  knows: string;
  trusts: string;
  lastSeen: string;
}

export interface Quest {
  id: string;
  title: string;
  status: 'inactive' | 'active' | 'completed' | 'failed';
  details: string;
}

export interface GameState {
  sessionId: string;
  status: PlayerStatus;
  protokoll: string; // Plain markdown text
  weltstand: Weltstand;
  npcs: NPC[];
  quests: Quest[];
}

const SAVES_DIR = path.join(process.cwd(), 'saves');

// Helper to ensure saves directory exists
async function ensureDir(dirPath: string) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

// Convert state to markdown with standard formats and hidden JSON block
export function serializePlayerStatus(status: PlayerStatus): string {
  const table = `# Spielerstatus

| Attribut | Wert |
|---|---|
| **Sprache** | ${status.sprache === 'de' ? 'Deutsch' : 'English'} |
| **Lebensenergie** | ${status.lp} / 100 LP |
| **Resonanz** | ${status.resonance} |
| **Ort** | ${status.location} |
| **Zeit** | ${status.time} |

## Inventar
${status.inventory.map(item => `- ${item}`).join('\n')}

## Aktive Effekte
${status.activeEffects.map(effect => `- ${effect}`).join('\n')}
`;
  return `${table}\n<!-- STATE_JSON\n${JSON.stringify(status, null, 2)}\n-->`;
}

export function serializeWeltstand(weltstand: Weltstand): string {
  const md = `# Weltstand

**Stille Zonen aktiv:**
${Object.entries(weltstand.stilleZonen)
  .map(([zone, active]) => `- [${active ? 'x' : ' '}] ${zone}`)
  .join('\n')}

**Bekannte Fakten:**
${weltstand.knownFacts.map(fact => `- ${fact}`).join('\n')}

**Status der Stille Maschine:**
- Ornstein: ${weltstand.stilleMaschineHours} Stunden bis zur Aktivierung
`;
  return `${md}\n<!-- STATE_JSON\n${JSON.stringify(weltstand, null, 2)}\n-->`;
}

export function serializeNPCs(npcs: NPC[]): string {
  const md = `# Nebencharaktere

${npcs
  .map(
    npc => `## ${npc.name}
- **Status:** ${npc.status}
- **Ort:** ${npc.location}
- **Weiß:** ${npc.knows}
- **Vertraut:** ${npc.trusts}
- **Letzt gesehen:** ${npc.lastSeen}
`
  )
  .join('\n')}
`;
  return `${md}\n<!-- STATE_JSON\n${JSON.stringify(npcs, null, 2)}\n-->`;
}

export function serializeQuests(quests: Quest[]): string {
  const md = `# Nebenquests

${quests
  .map(
    q => `## ${q.title} (ID: ${q.id})
- **Status:** ${q.status}
- **Details:** ${q.details}
`
  )
  .join('\n')}
`;
  return `${md}\n<!-- STATE_JSON\n${JSON.stringify(quests, null, 2)}\n-->`;
}

// Extraction helper
function extractStateJSON<T>(content: string): T | null {
  const match = content.match(/<!-- STATE_JSON\n([\s\S]*?)\n-->/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as T;
  } catch {
    return null;
  }
}

export async function createNewSession(): Promise<string> {
  await ensureDir(SAVES_DIR);
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-');
  const sessionDir = path.join(SAVES_DIR, `session_${timestamp}`);
  await ensureDir(sessionDir);
  return `session_${timestamp}`;
}

export async function saveGame(state: GameState): Promise<void> {
  const sessionDir = path.join(SAVES_DIR, state.sessionId);
  await ensureDir(sessionDir);

  await fs.writeFile(path.join(sessionDir, 'spieler_status.md'), serializePlayerStatus(state.status), 'utf-8');
  await fs.writeFile(path.join(sessionDir, 'protokoll.md'), state.protokoll, 'utf-8');
  await fs.writeFile(path.join(sessionDir, 'weltstand.md'), serializeWeltstand(state.weltstand), 'utf-8');
  await fs.writeFile(path.join(sessionDir, 'nebencharaktere.md'), serializeNPCs(state.npcs), 'utf-8');
  await fs.writeFile(path.join(sessionDir, 'nebenquests.md'), serializeQuests(state.quests), 'utf-8');
}

export async function loadGame(sessionId: string): Promise<GameState> {
  const sessionDir = path.join(SAVES_DIR, sessionId);

  const readOrNull = async (filename: string): Promise<string | null> => {
    try {
      return await fs.readFile(path.join(sessionDir, filename), 'utf-8');
    } catch {
      return null;
    }
  };

  const statusContent = await readOrNull('spieler_status.md');
  const protokollContent = await readOrNull('protokoll.md');
  const weltstandContent = await readOrNull('weltstand.md');
  const npcsContent = await readOrNull('nebencharaktere.md');
  const questsContent = await readOrNull('nebenquests.md');

  const status = statusContent ? extractStateJSON<PlayerStatus>(statusContent) : null;
  const weltstand = weltstandContent ? extractStateJSON<Weltstand>(weltstandContent) : null;
  const npcs = npcsContent ? extractStateJSON<NPC[]>(npcsContent) : null;
  const quests = questsContent ? extractStateJSON<Quest[]>(questsContent) : null;

  return {
    sessionId,
    status: status || {
      lp: 100,
      resonance: 'Normal',
      location: 'Verwaltungszentrum, Wartezone C, Erdgeschoss',
      time: 'Dienstag, 09:14 Uhr',
      inventory: ['Hausausweis KVR (Rahmenvertrag Kerzenlieferung)'],
      activeEffects: [],
      sprache: 'de',
    },
    protokoll: protokollContent || '# Spielprotokoll\n\n',
    weltstand: weltstand || {
      stilleZonen: {
        'Wartezone C, EG': false,
        'KVR Raum 4c, 2. OG': false,
        'Untergeschoss -2, Gang B': false,
      },
      knownFacts: [],
      stilleMaschineHours: 72,
    },
    npcs: npcs || [
      { name: 'Katrijn Voss', status: 'Lebendig, neutral', location: 'Copyshop, Schmalfassgasse 9', knows: 'Nichts Relevantes', trusts: 'Wenig', lastSeen: 'Nie' },
      { name: 'Rainer Molt', status: 'Lebendig, verwirrt', location: 'Ärztehaus, Bahnhofstraße 14', knows: 'Standort von Ornsteins Archiv (unbewusst)', trusts: 'Neutral', lastSeen: 'Nie' },
      { name: 'Bolle (Hausmeister)', status: 'Lebendig', location: 'Verwaltungszentrum', knows: 'Türen außerhalb des Grundrisses', trusts: 'Neutral', lastSeen: 'Nie' },
      { name: 'Frau Jütt (Schalter 3)', status: 'Lebendig', location: 'Schalter 3, EG', knows: 'Ungenannte Behördenabläufe', trusts: 'Neutral', lastSeen: 'Nie' },
    ],
    quests: quests || [
      { id: '1', title: 'Die Frau mit dem falschen Bescheid', status: 'inactive', details: 'Finde Raum 4c und reiche das Fehlerkorrekturformular für Paula Kern ein.' },
      { id: '2', title: 'Der stumme Zeuge', status: 'inactive', details: 'Hilf Beni, seinen behördlichen Widerspruchskreis zu durchbrechen.' },
      { id: '3', title: 'Das Formular U-0', status: 'inactive', details: 'Finde das mysteriöse Formular U-0 in den Untergeschossen.' },
      { id: '4', title: 'Die Kaffeemaschine in Raum 112', status: 'inactive', details: 'Finde heraus, warum die Kaffeemaschine in Raum 112 auf eine Anfrage wartet.' },
    ],
  };
}

export async function listSessions(): Promise<{ id: string; date: string }[]> {
  await ensureDir(SAVES_DIR);
  const items = await fs.readdir(SAVES_DIR);
  const sessions = [];
  for (const item of items) {
    if (item.startsWith('session_')) {
      const stats = await fs.stat(path.join(SAVES_DIR, item));
      sessions.push({
        id: item,
        date: stats.mtime.toLocaleString(),
      });
    }
  }
  return sessions.sort((a, b) => b.id.localeCompare(a.id));
}
