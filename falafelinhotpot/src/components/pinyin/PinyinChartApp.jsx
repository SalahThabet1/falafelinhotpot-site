import React, { useState, useCallback, memo, useMemo, useEffect, useRef } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import * as Dialog from '@radix-ui/react-dialog';
import syllablesData from './syllables.json';
import syllableToPinyins from './syllableToPinyins.json';
import SearchBar from './SearchBar';
import ClickModeSwitch from './ClickModeSwitch';
import TonePairBoard from './TonePairBoard';
import LearnSection from './LearnSection';
import { FINAL_GROUPS, INITIAL_GROUPS } from './finalsGroups';
import irregulars from './irregulars.json';
import { IconTable, IconSoundMap, IconBook } from './icons';
import { initAudio, unlockAudio, playAudio, stopAudio, preloadBatch, pinyinAudioSrc, foldPinyinKey } from './audioEngine';
import ShimmerBorder from './components/ShimmerBorder';
import './App.css';
import './components/SoundCell.css';
import './components/ToneSheet.css';

/* Light haptic feedback for mobile */
function hapticFeedback() {
  try {
    if (navigator.vibrate) navigator.vibrate(10);
  } catch (_) { /* ignore */ }
}

/* Display order: 1st, 2nd, 3rd, 4th.
   Data order per syllable is [4th, 2nd, 1st, 3rd] (indices 0-3). */
const TONE_DISPLAY_ORDER = [2, 1, 3, 0]; // data index for each display slot
const TONE_COLORS = ['var(--tone-1)', 'var(--tone-2)', 'var(--tone-3)', 'var(--tone-4)'];
const TONE_LABELS = ['1st', '2nd', '3rd', '4th'];

const INITIALS = [
  '∅','b','p','m','f','d','t','n','l','g','k','h',
  'j','q','x','zh','ch','sh','r','z','c','s',
];

/* Build flat FINALS array from FINAL_GROUPS for cell iteration */
const FINALS = FINAL_GROUPS.flatMap(g => g.finals);

const FINAL_COLOR_MAP = {};
FINAL_GROUPS.forEach(g => g.finals.forEach(f => { FINAL_COLOR_MAP[f] = g.color; }));

const INITIAL_COLOR_MAP = {};
INITIAL_GROUPS.forEach(g => g.initials.forEach(i => { INITIAL_COLOR_MAP[i] = g.color; }));

/* Pre-compute every valid cell once at module load */
const CELLS = (() => {
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

/* ── Cell ── */
const SoundCell = memo(function SoundCell({ cellKey, onTap, isDimmed, isMatched, isCurrent, isIrregular, groupColor }) {
  const data = CELLS[cellKey];
  if (!data) return <td className="cell cell--empty" />;
  const cls = 'cell-btn' +
    (isDimmed ? ' cell-btn--dimmed' : '') +
    (isMatched ? ' cell-btn--matched' : '') +
    (isCurrent ? ' cell-btn--current' : '') +
    (isIrregular ? ' cell-btn--irregular' : '');
  return (
    <td className="cell" style={{ '--gc': groupColor }}>
      <button
        className={cls}
        data-cell-key={cellKey}
        onClick={() => onTap(data.syl, data.pins)}
      >
        {data.syl}
      </button>
    </td>
  );
});

/* ── Tone bottom-sheet (Radix Dialog) ── */
function ToneSheetContent({ syllable, pinyins, onPlay }) {
  return (
    <>
      <div className="sheet-head">
        <Dialog.Title className="sheet-syl">{syllable}</Dialog.Title>
        <Dialog.Close className="sheet-close" aria-label="Close">✕</Dialog.Close>
      </div>
      <div className="sheet-grid">
        {TONE_DISPLAY_ORDER.map((dataIdx, displayIdx) => {
          const py = pinyins[dataIdx];
          if (!py) return null;
          return (
            <button
              key={py}
              className="tone-btn"
              style={{ '--c': TONE_COLORS[displayIdx] }}
              onClick={() => {
                hapticFeedback();
                onPlay(py);
              }}
            >
              <span className="tone-num">{displayIdx + 1}</span>
              <span className="tone-py">{py}</span>
              <span className="tone-label">{TONE_LABELS[displayIdx]} tone</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

/* Parses a raw search query into a toneless base (with 'v' for 'ü', same
   convention as foldPinyinKey) plus an optional tone digit — either typed
   directly ('ma1') or carried by a pasted toned character ('mā'). This is
   what lets Pinyin-mode search work from a plain keyboard instead of
   requiring literal tone marks. */
function parseSearchQuery(raw) {
  const folded = foldPinyinKey(raw.trim().toLowerCase());
  let { base, tone } = folded;
  if (!tone) {
    const m = base.match(/^(.*?)([1-4])$/);
    if (m) { base = m[1]; tone = m[2]; }
  }
  return { base, tone };
}

export default function App() {
  const [active, setActive] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [clickMode, setClickMode] = useState('Show tones');
  const [activeTab, setActiveTab] = useState('chart');
  const [searchMode, setSearchMode] = useState('syllable'); // 'syllable' | 'pinyin' | 'both'
  const [searchResultIndex, setSearchResultIndex] = useState(-1);
  const tableWrapRef = useRef(null);
  const audioInitRef = useRef(false);

  // Toggle scroll indicator on Sound Table
  useEffect(() => {
    const el = tableWrapRef.current;
    if (!el) return;
    const onScroll = () => {
      const atRight = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      el.classList.toggle('scrolled-right', atRight);
    };
    el.addEventListener('scroll', onScroll);
    // Check initial state
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Create the AudioContext and start preloading common sounds as soon as the
  // page loads, decoupled from the user gesture — decoding doesn't need one,
  // only playback does (handled separately via unlockAudio on first tap).
  useEffect(() => {
    initAudio();
    const common = Object.values(CELLS).slice(0, 50).flatMap(c =>
      c.pins.filter(Boolean).map(pinyinAudioSrc)
    );
    preloadBatch([...new Set(common)]);
  }, []);

  const ensureAudioInit = useCallback(() => {
    if (!audioInitRef.current) {
      unlockAudio();
      audioInitRef.current = true;
    }
  }, []);

  const open = useCallback((syl, pins) => {
    ensureAudioInit();
    const modeIndex = ['Show tones', 'T1', 'T2', 'T3', 'T4'].indexOf(clickMode);
    if (modeIndex > 0) {
      hapticFeedback();
      const dataIdx = TONE_DISPLAY_ORDER[modeIndex - 1];
      const py = pins[dataIdx];
      if (!py) return;
      stopAudio();
      playAudio(pinyinAudioSrc(py));
      return;
    }
    setActive({ syl, pins });
  }, [clickMode, ensureAudioInit]);

  const close = useCallback(() => setActive(null), []);

  const play = useCallback(py => {
    ensureAudioInit();
    hapticFeedback();
    if (!py) return;
    stopAudio();
    playAudio(pinyinAudioSrc(py));
  }, [ensureAudioInit]);

  const isSearching = searchQuery.trim().length > 0;

  const cellKeys = Object.keys(CELLS);
  const totalCells = cellKeys.length;

  /* Pre-compute matched cell keys — single pass, O(1) lookup per cell.
     Syllable mode matches the toneless spelling only. Pinyin mode matches
     pronunciation: typing a plain "ma" ignores tone, typing "ma1" (or
     pasting an actual "mā") requires that exact tone. Both modes accept
     'v' for 'ü', same convention as the audio filenames. */
  const matchedKeys = useMemo(() => {
    const set = new Set();
    if (!isSearching) return set;
    const { base: qBase, tone: qTone } = parseSearchQuery(searchQuery);
    if (!qBase) return set;
    for (const key of cellKeys) {
      const data = CELLS[key];
      if (!data) continue;
      if (searchMode === 'syllable' || searchMode === 'both') {
        if (foldPinyinKey(data.syl).base.includes(qBase)) { set.add(key); continue; }
      }
      if (searchMode === 'pinyin' || searchMode === 'both') {
        // A tone digit means the user knows exactly which syllable+tone they
        // want ("ma3" = mǎ), so the base has to match exactly, not just
        // contain it — otherwise "ma3" would also pull in "mang"/"mao" cells
        // that happen to have some 3rd-tone reading.
        const matches = data.pins && data.pins.some(p => {
          if (!p) return false;
          const { base: pBase, tone: pTone } = foldPinyinKey(p);
          const baseMatches = qTone ? pBase === qBase : pBase.includes(qBase);
          if (!baseMatches) return false;
          return !qTone || pTone === qTone;
        });
        if (matches) { set.add(key); continue; }
      }
    }
    return set;
  }, [searchQuery, searchMode, isSearching, cellKeys]);

  /* Stable left-to-right, top-to-bottom order for Enter-key cycling —
     cellKeys is already built in that order (INITIALS x FINALS), so this
     is just filtering it down to the current matches. */
  const matchedKeysOrdered = useMemo(
    () => cellKeys.filter(k => matchedKeys.has(k)),
    [cellKeys, matchedKeys]
  );

  // A new query or mode invalidates whatever match we were on.
  useEffect(() => {
    setSearchResultIndex(-1);
  }, [searchQuery, searchMode]);

  const currentMatchKey = searchResultIndex >= 0 ? matchedKeysOrdered[searchResultIndex] : null;
  const [matchAnnouncement, setMatchAnnouncement] = useState('');

  /* Enter: jump to the first match. Enter again: advance to the next one,
     wrapping back to the first after the last. Deliberately does NOT move
     DOM focus to the cell — that would steal focus out of the search input
     and break the ability to keep pressing Enter to advance. The jump is
     communicated visually (.cell-btn--current) and to screen readers via
     the aria-live region below, while focus stays in the input. */
  const goToNextMatch = useCallback(() => {
    if (!matchedKeysOrdered.length) return;
    const nextIndex = (searchResultIndex + 1) % matchedKeysOrdered.length;
    setSearchResultIndex(nextIndex);
    const key = matchedKeysOrdered[nextIndex];
    const data = CELLS[key];
    const el = tableWrapRef.current?.querySelector(`[data-cell-key="${key}"]`);
    if (el) {
      el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
    }
    if (data) {
      setMatchAnnouncement(`${data.syl}, match ${nextIndex + 1} of ${matchedKeysOrdered.length}`);
    }
  }, [matchedKeysOrdered, searchResultIndex]);

  return (
    <Tabs.Root className="app" value={activeTab} onValueChange={setActiveTab}>
        <h1 className="sr-only">Pinyin Chart</h1>

        <Tabs.Content className="tab-content" value="chart" forceMount={false}>
            <div className="mode-bar">
              <ClickModeSwitch mode={clickMode} onChange={setClickMode} />
            </div>

            <div className="table-wrap" ref={tableWrapRef}>
              <table className="sound-table">
                <thead>
                  <tr>
                    <th className="th corner" />
                    {FINAL_GROUPS.map(group => (
                      <th
                        key={group.label}
                        className="th col-head group-header"
                        colSpan={group.finals.length}
                        style={{ '--gc': group.color }}
                      >
                        <span className="group-header-dot" />
                        {group.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                    {INITIALS.map(ini => (
                      <tr key={ini}>
                        <th
                          className="th row-head"
                          style={{ '--ic': INITIAL_COLOR_MAP[ini] || 'var(--text-secondary)' }}
                        >
                          {ini}
                        </th>
                        {FINALS.map(fin => {
                          const cellKey = `${ini}|${fin}`;
                          const data = CELLS[cellKey];
                          const syl = data ? data.syl : '';
                          const matchesQuery = !isSearching || matchedKeys.has(cellKey);
                          const isIrreg = !!irregulars[syl];
                          return (
                            <SoundCell
                              key={fin}
                              cellKey={cellKey}
                              onTap={open}
                              isDimmed={isSearching && !matchesQuery}
                              isMatched={isSearching && matchesQuery}
                              isCurrent={cellKey === currentMatchKey}
                              isIrregular={isIrreg}
                              groupColor={FINAL_COLOR_MAP[fin]}
                            />
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
              </table>
              {isSearching && (
                <div className="search-info">
                  Matched <strong>{matchedKeys.size || totalCells}</strong> / {totalCells} syllables
                </div>
              )}
            </div>
        </Tabs.Content>

        <Tabs.Content className="tab-content" value="pairs" forceMount={false}>
          <TonePairBoard />
        </Tabs.Content>

        <Tabs.Content className="tab-content" value="learn" forceMount={false}>
          <LearnSection />
        </Tabs.Content>

        <div className="lp-footer">
          <p>
            Audio by <a href="https://github.com/cmguo/PinYinSound" target="_blank" rel="noopener noreferrer">cmguo</a> + <a href="https://github.com/hugolpz/audio-cmn" target="_blank" rel="noopener noreferrer">Hugo</a> (CC-BY-SA)
            &middot; Words from HSK 2012 &middot; Dictionary data from <a href="https://cc-cedict.org" target="_blank" rel="noopener noreferrer">CC-CEDICT</a> (CC-BY-SA 4.0)
          </p>
          <p className="lp-footer-copy">
            All rights reserved &middot; &copy; falafelinhotpot.com
          </p>
        </div>

        <div className="dock">
          {activeTab === 'chart' && (
            <div className="dock-context">
              <SearchBar
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                searchMode={searchMode}
                onSearchModeChange={setSearchMode}
                onEnter={goToNextMatch}
              />
              <span className="sr-only" role="status" aria-live="polite">{matchAnnouncement}</span>
            </div>
          )}
          <Tabs.List className="dock-tabs" aria-label="View mode">
            <Tabs.Trigger className="dock-btn dock-btn--chart" value="chart">
              <IconTable size={14} />
              Sound Table
            </Tabs.Trigger>
            <Tabs.Trigger className="dock-btn dock-btn--pairs" value="pairs">
              <IconSoundMap size={14} />
              The Sound Map
            </Tabs.Trigger>
            <Tabs.Trigger className="dock-btn dock-btn--learn" value="learn">
              <IconBook size={14} />
              Learn
            </Tabs.Trigger>
          </Tabs.List>
        </div>

        <Dialog.Root open={!!active} onOpenChange={open => { if (!open) close(); }}>
          <Dialog.Portal>
            <Dialog.Overlay className="overlay" />
            <Dialog.Content className="sheet" aria-describedby={undefined}>
              <ShimmerBorder className="sheet-shimmer" borderWidth={1.5} duration={4} color="var(--red)">
                <div className="sheet-inner">
                  {active && (
                    <ToneSheetContent
                      syllable={active.syl}
                      pinyins={active.pins}
                      onPlay={play}
                    />
                  )}
                </div>
              </ShimmerBorder>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
    </Tabs.Root>
  );
}
