/**
 * Tone-colored pinyin — uses pre-computed syllable split data from pypinyin.
 *
 * For pinyin strings found in pinyinSplit.json (all 240 tone-pair words),
 * uses the authoritative pypinyin-split data.
 * For all other pinyin text (space-separated examples, individual syllables),
 * splits on spaces and detects tone from tone marks.
 *
 * Tone colors: 1=red (var(--tone-1)), 2=green (var(--tone-2)),
 *              3=blue (var(--tone-3)), 4=purple (var(--tone-4)),
 *              5=grey (var(--tone-neutral))
 *
 * Usage:
 *   import { colorPinyin } from './pinyinColor';
 *   <span>{colorPinyin('dōngxī')}</span>
 */

import React from 'react';
import pinyinSplit from './pinyinSplit.json';

/* ── Tone character detection ── */
const TONE_MAP = {
  'ā':1,'á':2,'ǎ':3,'à':4,'ē':1,'é':2,'ě':3,'è':4,
  'ī':1,'í':2,'ǐ':3,'ì':4,'ō':1,'ó':2,'ǒ':3,'ò':4,
  'ū':1,'ú':2,'ǔ':3,'ù':4,'ǖ':1,'ǘ':2,'ǚ':3,'ǜ':4,
  'Ā':1,'Á':2,'Ǎ':3,'À':4,'Ē':1,'É':2,'Ě':3,'È':4,
  'Ī':1,'Í':2,'Ǐ':3,'Ì':4,'Ō':1,'Ó':2,'Ǒ':3,'Ò':4,
  'Ū':1,'Ú':2,'Ǔ':3,'Ù':4,'Ǖ':1,'Ǘ':2,'Ǚ':3,'Ǜ':4,
};
function getTone(s) {
  for (const c of s) if (TONE_MAP[c] !== undefined) return TONE_MAP[c];
  return 5;
}

/* ── CSS color vars ── */
const TONE_CSS = {
  1: 'var(--tone-1)',
  2: 'var(--tone-2)',
  3: 'var(--tone-3)',
  4: 'var(--tone-4)',
  5: 'var(--tone-neutral)',
};

/**
 * Check if a string has tone marks (i.e., is real pinyin, not just text).
 */
function hasTone(s) {
  return [...s].some(c => TONE_MAP[c] !== undefined);
}

/**
 * Parse a pinyin string into an array of { text, color } segments.
 *
 * Strategy:
 * 1. Look up in pinyinSplit.json first (authoritative for Chinese words)
 * 2. If not found, try space-splitting (for already-separated text)
 * 3. If single word with no spaces, treat each syllable independently
 *    based on tone mark positions
 *
 * @param {string} text - Pinyin string (e.g. "dōngxī" or "nǐ hǎo")
 * @returns {Array<{text: string, color: string}>}
 */
export function parsePinyin(text) {
  const cleaned = text.replace(/'/g, ' ');
  const trimmed = cleaned.trim();
  if (!trimmed) return [];

  // Strategy 1: Look up in pinyinSplit.json
  const lookup = pinyinSplit[trimmed];
  if (lookup && Array.isArray(lookup) && lookup.length > 0) {
    return lookup.map(([syl, tone]) => ({
      text: syl,
      color: TONE_CSS[tone] || TONE_CSS[5],
    }));
  }

  // Strategy 2: If contains spaces, split and color each word
  if (trimmed.includes(' ')) {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    const segments = [];
    for (const part of parts) {
      // Try lookup for each part too
      const partLookup = pinyinSplit[part];
      if (partLookup && Array.isArray(partLookup)) {
        for (const [syl, tone] of partLookup) {
          segments.push({ text: syl, color: TONE_CSS[tone] || TONE_CSS[5] });
        }
      } else {
        const tone = getTone(part);
        segments.push({ text: part, color: TONE_CSS[tone] || TONE_CSS[5] });
      }
    }
    return segments;
  }

  // Strategy 3: Single word - try to split at particle boundaries
  // Each syllable has exactly one tone mark
  // Split at the position where a tone-marked vowel appears after
  // a consonant that could be an initial
  if (!hasTone(trimmed)) {
    return [{ text: trimmed, color: TONE_CSS[5] }];
  }

  // Manual split for unsplit pinyin not in the map
  return manualSplit(trimmed);
}

/**
 * Manual split for edge-case pinyin not in the map.
 * Relies on the fact that each syllable has exactly one tone-marked vowel.
 */
function manualSplit(word) {
  const chars = [...word];
  const segments = [];
  let current = '';

  for (let i = 0; i < chars.length; i++) {
    current += chars[i];
    // A syllable boundary is likely when:
    // - We have a tone-marked vowel in current
    // - The next character starts a known initial (consonant cluster)
    // - AND the remaining text also has a tone-marked vowel
    if (hasTone(current)) {
      const remaining = chars.slice(i + 1).join('');
      if (remaining && hasTone(remaining)) {
        const nextChar = chars[i + 1];
        // Check if next char starts a new syllable
        // (it's a consonant not part of the current syllable's final)
        const lo = nextChar.toLowerCase();
        const isInitial =
          (['b','p','m','f','d','t','l','k','h','j','q','x','z','c','s','y','w'].includes(lo)) ||
          (lo === 'n' && (i + 2 >= chars.length || !['g','n'].includes(chars[i + 2]?.toLowerCase()))) ||
          (lo === 'g' && (i + 2 >= chars.length || !['u','i'].includes(chars[i + 2]?.toLowerCase()))) ||
          (lo === 'r' && (i + 2 >= chars.length || !['i','u'].includes(chars[i + 2]?.toLowerCase())));
        // Two-char initials
        const twoChars = lo + (chars[i + 2] || '').toLowerCase();
        if (['zh','ch','sh'].includes(twoChars)) {
          segments.push({ text: current, color: TONE_CSS[getTone(current)] });
          current = '';
          continue;
        }
        if (isInitial) {
          segments.push({ text: current, color: TONE_CSS[getTone(current)] });
          current = '';
          continue;
        }
      }
    }
  }

  if (current) {
    segments.push({ text: current, color: TONE_CSS[getTone(current)] });
  }

  return segments;
}

/**
 * Render pinyin string as React elements with tone colors.
 *
 * @param {string} text - Pinyin string (e.g. "dōngxī" or "nǐ hǎo")
 * @param {object} [opts] - Options
 * @param {number} [opts.gap] - Gap between syllables in em (default 0.2)
 * @returns {React.ReactElement[]}
 */
export function colorPinyin(text, opts = {}) {
  const { gap = 0.2 } = opts;
  const parsed = parsePinyin(text);
  const elements = [];

  for (let i = 0; i < parsed.length; i++) {
    if (i > 0) {
      elements.push(
        <span
          key={`sp-${i}`}
          style={{ display: 'inline-block', width: `${gap}em` }}
        >{' '}</span>
      );
    }
    const { text: syl, color } = parsed[i];
    elements.push(
      <span key={`syl-${i}`} style={{ color }}>
        {syl}
      </span>
    );
  }

  return elements;
}

/**
 * Convenience component: renders tone-colored pinyin in a <span>.
 */
export function ColorPinyinSpan({ text, gap, style, className, ...rest }) {
  return (
    <span className={className} style={style} {...rest}>
      {colorPinyin(text, { gap })}
    </span>
  );
}
