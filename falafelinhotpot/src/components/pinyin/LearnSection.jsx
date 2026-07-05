import React, { useState, useCallback } from 'react';
import { FINAL_GROUPS } from './finalsGroups';
import irregulars from './irregulars.json';
import {
  IconMusic, IconPuzzle, IconBook,
  IconTable, IconTarget, IconAlert,
  IconTrending, IconRefresh, IconPlay, IconSpeaker
} from './icons';
import { unlockAudio, playAudio, stopAudio, pinyinAudioSrc } from './audioEngine';
import './LearnSection.css';

/* Light haptic feedback for mobile — same trivial helper duplicated
   per-component elsewhere in this app (PinyinChartApp.jsx, TonePairBoard.jsx). */
function hapticFeedback() {
  try {
    if (navigator.vibrate) navigator.vibrate(10);
  } catch (_) {}
}

/* ── Irregular groupings by phonetic category ── */
const IRREG_GROUPS = [
  {
    label: 'Apical Vowels (舌尖音)',
    desc: 'The letter "i" sounds completely different — no front vowel, just a sustained buzz.',
    keys: ['zi', 'ci', 'si', 'zhi', 'chi', 'shi', 'ri'],
  },
  {
    label: 'Ü Rule — Written "u", Spoken "ü"',
    desc: 'After j, q, x, and y, the letter "u" actually represents the rounded front vowel [y] (like German ü). The umlaut is omitted in writing.',
    keys: ['ju', 'qu', 'xu', 'juan', 'quan', 'xuan', 'jun', 'qun', 'xun', 'jue', 'que', 'xue', 'yuan', 'yue', 'yun'],
  },
  {
    label: 'Vowel Quality Shifts',
    desc: 'The letters "e" and "a" take unexpected values in certain environments.',
    keys: ['ye', 'yan', 'yin', 'ying'],
  },
  {
    label: 'Hidden Glides',
    desc: 'Compound finals conceal an extra vowel that surfaces in careful speech.',
    keys: ['iu', 'ui', 'un'],
  },
  {
    label: 'Labial + "o" → [wo]',
    desc: 'A [w] glide is inserted between labial initials (b, p, m, f) and "o".',
    keys: ['bo', 'po', 'mo', 'fo', 'lo', 'yo'],
  },
  {
    label: 'Eng as [əŋ]',
    desc: 'The "eng" final is pronounced with a schwa [ə], not a front [e].',
    keys: ['beng', 'peng', 'weng', 'yong'],
  },
  {
    label: 'Syllabic Nasals',
    desc: 'Standalone nasal consonants used as interjections — no vowel at all.',
    keys: ['m', 'n', 'ng', 'hm', 'hng'],
  },
  {
    label: 'Rare / Exceptional',
    desc: 'Uncommon syllables that break standard initial-final constraints.',
    keys: ['dia', 'nun', 'bia'],
  },
];

/* A few IRREG_GROUPS keys aren't themselves playable full syllables (bare
   finals with no initial, or standalone nasal interjections) — these map to
   a representative full syllable from the main chart that demonstrates the
   same sound instead. `bia` has no confirmed audio and no honest substitute
   (it IS the specific rare form being taught), so it's omitted entirely
   rather than pointed at an unrelated syllable. */
const IRREG_AUDIO_OVERRIDES = {
  ui: 'hui',
  un: 'dun',
  m: 'ma',
  n: 'na',
  ng: 'dang',
  hm: 'ha',
  hng: 'hang',
  bia: null,
};

function irregExampleFor(key) {
  if (key in IRREG_AUDIO_OVERRIDES) return IRREG_AUDIO_OVERRIDES[key];
  return key;
}

const TOC_ITEMS = [
  { id: 'tones-glance', label: 'The Four Tones', icon: IconMusic },
  { id: 'syllable-structure', label: 'Syllable Structure', icon: IconPuzzle },
  { id: 'finals-table', label: 'Finals by Vowel', icon: IconTable },
  { id: 'tricky-sounds', label: 'Tricky Sounds', icon: IconTarget },
  { id: 'irregular-pron', label: 'Irregular Pronunciations', icon: IconAlert },
  { id: 'tones-detail', label: 'Tones in Detail', icon: IconTrending },
  { id: 'tone-sandhi', label: 'Tone Sandhi', icon: IconRefresh },
];

/* ── Table of Contents ── */
function TableOfContents() {
  return (
    <nav className="lp-toc" aria-label="Table of contents">
      <ol className="lp-toc-list">
        {TOC_ITEMS.map(({ id, label, icon: Icon }) => (
          <li key={id}>
            <a className="lp-toc-link" href={`#${id}`}>
              <Icon size={14} />
              {label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ── Section Divider ── */
function SectionSplit({ label }) {
  return (
    <div className="lp-split">
      <span className="lp-split-line" />
      {label && <span className="lp-split-label">{label}</span>}
      <span className="lp-split-line" />
    </div>
  );
}

/* ── Tone Contour SVG Chart ── */
function ToneChartSVG() {
  const tones = [
    { num: '1st', label: 'high level', color: 'var(--tone-1)', path: 'M20,20 L220,20' },
    { num: '2nd', label: 'rising',     color: 'var(--tone-2)', path: 'M20,60 Q120,20 220,20' },
    { num: '3rd', label: 'dipping',    color: 'var(--tone-3)', path: 'M20,40 Q120,100 220,40' },
    { num: '4th', label: 'falling',    color: 'var(--tone-4)', path: 'M20,20 Q120,60 220,100' },
  ];
  return (
    <div className="tone-chart-wrap">
      <svg viewBox="0 0 240 120" className="tone-chart-svg" aria-label="Tone contour chart">
        {[20, 40, 60, 80, 100].map(y => (
          <line key={y} x1="16" y1={y} x2="224" y2={y} stroke="var(--border-color)" strokeWidth="0.5" opacity="0.4" />
        ))}
        {tones.map(t => (
          <g key={t.num}>
            <path
              d={t.path}
              fill="none"
              stroke={t.color}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx={t.num === '4th' ? 220 : 20} cy={t.num === '1st' ? 20 : t.num === '2nd' ? 20 : t.num === '3rd' ? 40 : 100} r="3" fill={t.color} />
          </g>
        ))}
      </svg>
      <div className="tone-chart-labels">
        {tones.map(t => (
          <span key={t.num} className="tone-chart-label" style={{ color: t.color }}>
            <span className="tone-chart-dot" style={{ background: t.color }} />
            {t.num} — {t.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Syllable structure diagram ── */
function SyllableDiagram() {
  return (
    <div className="syllable-diagram">
      <div className="syll-diagram-inner">
        <div className="syll-block">
          <div className="syll-block-label">Initial</div>
          <div className="syll-block-box" style={{ background: 'var(--tone-4)', opacity: 0.9 }}>b</div>
          <div className="syll-block-desc">starting consonant</div>
        </div>
        <span className="syll-plus">+</span>
        <div className="syll-block">
          <div className="syll-block-label">Final</div>
          <div className="syll-block-box" style={{ background: 'var(--tone-2)', opacity: 0.9 }}>a</div>
          <div className="syll-block-desc">vowel / ending</div>
        </div>
        <span className="syll-plus">+</span>
        <div className="syll-block">
          <div className="syll-block-label">Tone</div>
          <div className="syll-block-box" style={{ background: 'var(--tone-1)', opacity: 0.9 }}>˥</div>
          <div className="syll-block-desc">pitch contour</div>
        </div>
        <span className="syll-eq">
          <span className="syll-eq-box">bā</span>
        </span>
      </div>
    </div>
  );
}

/* ── Finals table ── */
function FinalsTable() {
  return (
    <div className="finals-table-wrap">
      <table className="finals-table">
        <thead>
          <tr>
            <th>Group</th>
            <th>Finals</th>
          </tr>
        </thead>
        <tbody>
          {FINAL_GROUPS.map(g => (
            <tr key={g.label}>
              <td className="ft-group">{g.label}</td>
              <td className="ft-finals">
                {g.finals.map(f => (
                  <span key={f} className="ft-chip">{f}</span>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Pronunciation group card ── */
function PronGroup({ icon: IconComp, title, rows, playingKey, onPlay }) {
  return (
    <div className="pron-group">
      <h4 className="pron-group-head">
        {IconComp && <IconComp size={18} />}
        <span className="pron-title">{title}</span>
      </h4>
      <div className="pron-group-rows">
        {rows.map(r => (
          <div key={r.code} className="pron-row">
            <code className="pron-code">{r.code}</code>
            <span className="pron-desc">{r.desc}</span>
            {r.aspiration && <span className="pron-asp">{r.aspiration}</span>}
            {r.example && (
              <ListenButton
                active={playingKey === `pron-${r.code}`}
                onClick={() => onPlay(`pron-${r.code}`, pinyinAudioSrc(r.example))}
                label={`Play ${r.example}`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Tone Demo Row ── */
function ToneDemoRow({ mark, num, label, example, meaning, color, isPlaying, onPlay }) {
  return (
    <div className="tone-demo-row" style={{ '--tone-color': color }}>
      <span className="tone-demo-mark">{mark}</span>
      <span className="tone-demo-num">{num}</span>
      <span className="tone-demo-label">{label}</span>
      <span className="tone-demo-example">{example}</span>
      <span className="tone-demo-meaning">{meaning}</span>
      <ListenButton active={isPlaying} onClick={onPlay} label={`Play ${example}`} />
    </div>
  );
}

/* ── Irregular group display ── */
function IrregularGroup({ group, playingKey, onPlay }) {
  return (
    <div className="irreg-group-card">
      <h4 className="irreg-group-head">{group.label}</h4>
      <p className="irreg-group-desc">{group.desc}</p>
      <div className="irreg-group-rows">
        {group.keys.map(k => {
          const example = irregExampleFor(k);
          return (
            <div key={k} className="irreg-row">
              <code className="irreg-syl">{k}</code>
              <span className="irreg-exp">{irregulars[k]}</span>
              {example && (
                <ListenButton
                  active={playingKey === `irreg-${k}`}
                  onClick={() => onPlay(`irreg-${k}`, `/audio/${example}1.mp3`)}
                  label={`Play ${example}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Listen button — mirrors TonePairBoard.jsx's .tpop-play pattern exactly:
   a single "now playing" key lives in the parent (audioEngine only supports
   one playing clip at a time), tapping the active button again stops it,
   and onEnded auto-clears the state when a clip finishes naturally. ── */
function ListenButton({ active, onClick, label }) {
  return (
    <button
      type="button"
      className={`lp-listen-btn${active ? ' lp-listen-btn--active' : ''}`}
      onClick={onClick}
      aria-label={label}
    >
      {active ? <IconSpeaker size={16} /> : <IconPlay size={16} />}
    </button>
  );
}

/* ── Main Learn Component ── */
export default function LearnSection() {
  const [playingKey, setPlayingKey] = useState(null);

  const handlePlay = useCallback((key, src) => {
    hapticFeedback();
    unlockAudio();
    if (playingKey === key) {
      stopAudio();
      setPlayingKey(null);
      return;
    }
    setPlayingKey(key);
    stopAudio();
    playAudio(src, () => setPlayingKey(null)).catch(() => setPlayingKey(null));
  }, [playingKey]);

  return (
    <div className="learn-page">
      <div className="learn-page-inner">

        {/* ── Header ── */}
        <div className="lp-header">
          <span className="lp-kicker">Guide</span>
          <h2 className="lp-title">Learning Mandarin Pinyin</h2>
          <p className="lp-sub">
            A quick reference to the sounds, tones, and pronunciation rules
            behind Standard Mandarin's romanisation system.
          </p>
        </div>

        <TableOfContents />

        <SectionSplit label="Tones &amp; Sounds" />

        {/* ── Tone Contour Chart ── */}
        <section id="tones-glance" className="lp-section">
          <h3 className="lp-h">
            <IconMusic size={22} />
            The Four Tones at a Glance
          </h3>
          <p className="lp-body">
            Mandarin uses pitch contours to distinguish word meanings.
            Here's what each tone looks like against the syllable <strong>mā</strong>:
          </p>
          <ToneChartSVG />
        </section>

        <SectionSplit />

        {/* ── Syllable Structure ── */}
        <section id="syllable-structure" className="lp-section">
          <h3 className="lp-h">
            <IconPuzzle size={22} />
            How a Syllable Is Built
          </h3>
          <p className="lp-body">
            Every Mandarin syllable is composed of three parts:
            an <strong>initial</strong> (consonant start), a <strong>final</strong> (vowel core),
            and a <strong>tone</strong> that gives it meaning.
          </p>
          <SyllableDiagram />
          <p className="lp-caption">
            Example: <code>b</code> (initial) + <code>a</code> (final) + 1st tone = <strong>bā</strong> (八, "eight")
          </p>
        </section>

        <SectionSplit />

        {/* ── Finals Table ── */}
        <section id="finals-table" className="lp-section">
          <h3 className="lp-h">
            <IconTable size={22} />
            Finals by Starting Vowel
          </h3>
          <p className="lp-body">
            The finals (vowel or vowel–consonant endings) group naturally by
            their starting sound. These groups make memorisation easier:
          </p>
          <FinalsTable />
        </section>

        <SectionSplit label="Pronunciation" />

        {/* ── Tricky Sounds ── */}
        <section id="tricky-sounds" className="lp-section">
          <h3 className="lp-h">
            <IconTarget size={22} />
            Tricky Sounds
          </h3>
          <p className="lp-body">
            These three consonant groups give English speakers the most
            trouble. The key difference is <strong>tongue position</strong>:
          </p>
          <div className="pron-groups">
            <PronGroup
              icon={IconBook}
              title="Alveolo-palatal (j / q / x)"
              playingKey={playingKey}
              onPlay={handlePlay}
              rows={[
                { code: 'j', desc: 'unaspirated, like "jeep" with flatter tongue', aspiration: 'no puff', example: 'jī' },
                { code: 'q', desc: 'aspirated, strong puff of air', aspiration: 'strong puff', example: 'qī' },
                { code: 'x', desc: 'like "sheep" with tongue raised to palate', aspiration: '—', example: 'xī' },
              ]}
            />
            <PronGroup
              icon={IconBook}
              title="Retroflex (zh / ch / sh / r)"
              playingKey={playingKey}
              onPlay={handlePlay}
              rows={[
                { code: 'zh', desc: 'unaspirated, like "j" with curled tongue', aspiration: 'no puff', example: 'zhī' },
                { code: 'ch', desc: 'aspirated, like "church" with curled tongue', aspiration: 'strong puff', example: 'chī' },
                { code: 'sh', desc: 'like "shirt" with curled tongue tip', aspiration: '—', example: 'shī' },
                { code: 'r', desc: 'voiced counterpart of sh, like "rain"', aspiration: '—', example: 'rī' },
              ]}
            />
            <PronGroup
              icon={IconBook}
              title="Dental / Flat (z / c / s)"
              playingKey={playingKey}
              onPlay={handlePlay}
              rows={[
                { code: 'z', desc: 'unaspirated, like "dz" in "adze"', aspiration: 'no puff', example: 'zī' },
                { code: 'c', desc: 'aspirated, like "ts" in "cats"', aspiration: 'strong puff', example: 'cī' },
                { code: 's', desc: 'like "s" in "see"', aspiration: '—', example: 'sī' },
              ]}
            />
          </div>
        </section>

        <SectionSplit />

        {/* ── Irregular Pronunciations ── */}
        <section id="irregular-pron" className="lp-section">
          <h3 className="lp-h">
            <IconAlert size={22} />
            Irregular Pronunciations
          </h3>
          <p className="lp-body">
            Several pinyin syllables don't follow the expected sound rules
            from their spelling. These are grouped by phonetic theme —
            all visible, no toggles.
          </p>
          {IRREG_GROUPS.map(g => (
            <IrregularGroup key={g.label} group={g} playingKey={playingKey} onPlay={handlePlay} />
          ))}
        </section>

        <SectionSplit label="Tone Rules" />

        {/* ── The 4 Tones in Detail ── */}
        <section id="tones-detail" className="lp-section">
          <h3 className="lp-h">
            <IconTrending size={22} />
            The 4 Tones in Detail
          </h3>
          <p className="lp-body">
            The same syllable spoken at different pitches means completely
            different things. Here they are with the example <strong>mā</strong>:
          </p>
          <div className="tone-demo">
            {[
              { mark: 'ˉ', num: '1st', label: 'high level', example: 'mā', meaning: 'mother', color: 'var(--tone-1)' },
              { mark: 'ˊ', num: '2nd', label: 'rising', example: 'má', meaning: 'hemp', color: 'var(--tone-2)' },
              { mark: 'ˇ', num: '3rd', label: 'dipping', example: 'mǎ', meaning: 'horse', color: 'var(--tone-3)' },
              { mark: 'ˋ', num: '4th', label: 'falling', example: 'mà', meaning: 'scold', color: 'var(--tone-4)' },
            ].map(t => (
              <ToneDemoRow
                key={t.num}
                {...t}
                isPlaying={playingKey === `tone-${t.example}`}
                onPlay={() => handlePlay(`tone-${t.example}`, pinyinAudioSrc(t.example))}
              />
            ))}
          </div>
          <p className="lp-body">
            Tap any syllable in the <strong>Sound Table</strong> to hear all four
            tones played aloud. The colour coding matches this guide.
          </p>
          <aside className="lp-callout">
            <IconBook size={16} /> <strong>Tip:</strong> Use the <strong>Tone Sandhi</strong> tab to explore
            two-syllable words. Each cell shows real HSK vocabulary for that
            tone combination — tap to hear the full word.
          </aside>
        </section>

        <SectionSplit />

        {/* ── Tone Sandhi ── */}
        <section id="tone-sandhi" className="lp-section">
          <h3 className="lp-h">
            <IconRefresh size={22} />
            Tone Sandhi
          </h3>
          <p className="lp-body">
            In natural speech, tones shift depending on neighbouring syllables.
            The most common change — <strong>third tone sandhi</strong> — turns
            3-3 into 2-3:
          </p>
          <div className="sandhi-demo">
            <div className="sandhi-cell">
              <div className="sandhi-cell-tone" style={{ color: 'var(--tone-3)' }}>3</div>
              <div className="sandhi-cell-char">nǐ</div>
            </div>
            <span className="sandhi-arrow">+</span>
            <div className="sandhi-cell">
              <div className="sandhi-cell-tone" style={{ color: 'var(--tone-3)' }}>3</div>
              <div className="sandhi-cell-char">hǎo</div>
            </div>
            <span className="sandhi-arrow">→</span>
            <div className="sandhi-cell sandhi-cell--result">
              <div className="sandhi-cell-tone" style={{ color: 'var(--tone-2)' }}>2</div>
              <div className="sandhi-cell-char">ní</div>
            </div>
            <span className="sandhi-arrow">+</span>
            <div className="sandhi-cell sandhi-cell--result">
              <div className="sandhi-cell-tone" style={{ color: 'var(--tone-3)' }}>3</div>
              <div className="sandhi-cell-char">hǎo</div>
            </div>
          </div>
          <p className="lp-caption">
            nǐ hǎo (你好) → <strong>ní hǎo</strong> — "hello"
          </p>
          <table className="sandhi-table">
            <thead>
              <tr>
                <th>Pattern</th>
                <th>Result</th>
                <th>Example</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span className="tone-tag t3">3</span> + <span className="tone-tag t3">3</span></td>
                <td><span className="tone-tag t2">2</span> + <span className="tone-tag t3">3</span></td>
                <td>nǐ hǎo → <strong>ní hǎo</strong></td>
              </tr>
              <tr>
                <td><span className="tone-tag t1">1</span> + any</td>
                <td>no change</td>
                <td>—</td>
              </tr>
              <tr>
                <td><span className="tone-tag t4">4</span> + <span className="tone-tag t4">4</span></td>
                <td>first 4 becomes ~2 (half falling)</td>
                <td>dà jiā → dà~jiā</td>
              </tr>
            </tbody>
          </table>
        </section>

      </div>
    </div>
  );
}
