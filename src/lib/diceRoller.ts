export interface RollResult {
  baseRoll: number;
  modifier: number;
  finalScore: number;
  category: string;
  description: string;
}

export function rollD100(
  actionType: 'normal' | 'luegengehoer' | 'luegen' | 'kampf',
  currentLP: number,
  allyHelping: boolean,
  otherModifiers: number = 0
): RollResult {
  // Roll 1 to 100
  const baseRoll = Math.floor(Math.random() * 100) + 1;

  let modifier = 0;

  // Modifiers based on Spielmechanik.md
  if (actionType === 'luegengehoer') {
    modifier += 15;
  } else if (actionType === 'luegen') {
    modifier -= 20; // Due to physical limitation (Die Zunge des Zeugen)
  }

  // Physical exhaustion modifier (under 30 LP)
  if (currentLP < 30) {
    modifier -= 10;
  }

  // Active ally helper modifier
  if (allyHelping) {
    modifier += 10;
  }

  modifier += otherModifiers;

  // Calculate final score bounded by 1 and 100
  let finalScore = baseRoll + modifier;
  if (finalScore < 1) finalScore = 1;
  if (finalScore > 100) finalScore = 100;

  // Dice interpretation scales
  let category = '';
  let description = '';

  if (finalScore <= 10) {
    category = 'Katastrophe';
    description = 'Katastrophe — Schlimmstmögliches Ergebnis. Eine schwerwiegende Fehlentwicklung oder massiver Schaden.';
  } else if (finalScore <= 25) {
    category = 'Misserfolg';
    description = 'Misserfolg mit spürbaren Konsequenzen. Dein Ziel wurde nicht erreicht, und es hat Konsequenzen.';
  } else if (finalScore <= 45) {
    category = 'Teilmisserfolg';
    description = 'Teilmisserfolg — Teils geschafft, teils nicht. Einige positive Aspekte, aber unvollständig oder gestört.';
  } else if (finalScore <= 65) {
    category = 'Gemischtes Ergebnis';
    description = 'Gemischtes Ergebnis — Ziel erreicht, aber mit einem hohen Preis.';
  } else if (finalScore <= 85) {
    category = 'Erfolg mit Einschränkung';
    description = 'Erfolg mit kleiner Einschränkung. Dein Vorhaben gelingt weitgehend, aber mit einer kleinen Komplikation.';
  } else if (finalScore <= 99) {
    category = 'Voller Erfolg';
    description = 'Voller Erfolg! Dein Vorhaben gelingt ohne Komplikationen.';
  } else {
    category = 'Kritischer Erfolg';
    description = 'Kritischer Erfolg — Das Ergebnis übertrifft deine Erwartungen und bringt zusätzliche Vorteile.';
  }

  return {
    baseRoll,
    modifier,
    finalScore,
    category,
    description,
  };
}
