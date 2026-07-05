import syllablesData from './syllables.json';
import syllableToPinyins from './syllableToPinyins.json';
import { FINAL_GROUPS } from './finalsGroups';

export { FINAL_GROUPS };

export const TONE_DISPLAY_ORDER = [2, 1, 3, 0];
export const TONE_COLORS = ['var(--tone-1)', 'var(--tone-2)', 'var(--tone-3)', 'var(--tone-4)'];
export const TONE_LABELS = ['1st', '2nd', '3rd', '4th'];

export const INITIALS = [
  '∅','b','p','m','f','d','t','n','l','g','k','h',
  'j','q','x','zh','ch','sh','r','z','c','s',
];

export const FINALS = FINAL_GROUPS.flatMap(g => g.finals);

export const CELLS = (() => {
  const map = {};
  for (const ini of INITIALS) {
    for (const fin of FINALS) {
      const row = syllablesData[ini];
      if (!row) continue;
      const syl = row[fin];
      if (!syl) continue;
      const pins = syllableToPinyins[syl];
      if (pins && pins.length) map[`${ini}|${fin}`] = { syl, pins };
    }
  }
  return map;
})();
