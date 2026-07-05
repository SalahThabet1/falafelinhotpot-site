// Colors are tuned to clear 4.5:1 text contrast against --bg-primary (#F5ECE0) —
// each is used as text color (group-header, row-head) as well as an accent, so
// the darkened value has to work for both. Verified against WCAG 1.4.3.
export const FINAL_GROUPS = [
  { label: 'I',      finals: ['i'],                                                                         hue: 0,   color: '#C0392B' },
  { label: 'A',      finals: ['a', 'ai', 'an', 'ang', 'ao'],                                               hue: 30,  color: '#A35524' },
  { label: 'E',      finals: ['e', 'ei', 'en', 'eng', 'er', 'ê'],                                          hue: 45,  color: '#816628' },
  { label: 'O',      finals: ['o', 'ong', 'ou'],                                                            hue: 140, color: '#1B7A43' },
  { label: 'IA / IE', finals: ['ia', 'ie', 'iai', 'iao', 'iu', 'ian', 'in', 'iang', 'ing', 'iong', 'io'],  hue: 210, color: '#2470A2' },
  { label: 'U',      finals: ['u', 'ua', 'uo', 'uai', 'ui', 'uan', 'un', 'uang'],                          hue: 265, color: '#8E44AD' },
  { label: 'Ü',      finals: ['ü', 'üe', 'üan', 'ün'],                                                     hue: 330, color: '#AF4470' },
];

export const INITIAL_GROUPS = [
  { label: 'null',     initials: ['∅'],                              color: '#74685F' },
  { label: 'labial',   initials: ['b', 'p', 'm', 'f'],              color: '#C0392B' },
  { label: 'dental',   initials: ['d', 't', 'n', 'l'],              color: '#A35524' },
  { label: 'velar',    initials: ['g', 'k', 'h'],                   color: '#816628' },
  { label: 'palatal',  initials: ['j', 'q', 'x'],                   color: '#1B7A43' },
  { label: 'retroflex', initials: ['zh', 'ch', 'sh', 'r'],          color: '#2470A2' },
  { label: 'sibilant', initials: ['z', 'c', 's'],                   color: '#8E44AD' },
];
