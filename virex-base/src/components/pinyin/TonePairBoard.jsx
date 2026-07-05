import React, { useState, useCallback, useEffect, Fragment } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import tonePairWords from './tonePairWords.json';
import wordsWithAudio from './wordsWithAudio.json';
import { IconPlay, IconSpeaker } from './icons';
import { colorPinyin } from './pinyinColor';
import { unlockAudio, playAudio, stopAudio, preloadBatch } from './audioEngine';
import DotPattern from './components/DotPattern';
import './TonePairBoard.css';

/* ── Constants ── */
const TONE_COLORS = ['var(--tone-1)', 'var(--tone-2)', 'var(--tone-3)', 'var(--tone-4)'];
const TONE_LABELS = ['1st', '2nd', '3rd', '4th'];
const ROW_TONES = [1, 2, 3, 4];
const COL_TONES = [1, 2, 3, 4, 5]; // 5 = neutral (轻声)

function hapticFeedback() {
  try { if (navigator.vibrate) navigator.vibrate(10); } catch (_) {}
}

/* ── Word Popup Content (inside Radix Dialog) ── */
function WordPopupContent({ pairKey, words }) {
  const [playingIdx, setPlayingIdx] = useState(null);
  const [rowTone, colTone] = pairKey.split('-').map(Number);
  const colLabel = colTone === 5 ? '∅' : TONE_LABELS[colTone - 1];

  useEffect(() => {
    preloadBatch(words.map(w => `/audio/${w.chars}.mp3`));
  }, [words]);

  const handlePlay = useCallback((idx, word) => {
    hapticFeedback();
    unlockAudio();
    if (playingIdx === idx) {
      stopAudio();
      setPlayingIdx(null);
      return;
    }
    setPlayingIdx(idx);
    stopAudio();

    const wordSrc = `/audio/${word.chars}.mp3`;
    playAudio(wordSrc, () => setPlayingIdx(null)).catch(() => setPlayingIdx(null));
  }, [playingIdx]);

  return (
    <>
      <div className="tpop-header">
        <div className="tpop-title-area">
          <Dialog.Title className="tpop-pair">
            <span className="tpop-tone-num" style={{ color: TONE_COLORS[rowTone - 1] }}>{rowTone}</span>
            <span className="tpop-sep">-</span>
            <span className="tpop-tone-num" style={{ color: colTone === 5 ? 'var(--text-secondary)' : TONE_COLORS[colTone - 1] }}>{colLabel}</span>
          </Dialog.Title>
          <span className="tpop-title-label">{words.length} word{words.length !== 1 ? 's' : ''}</span>
        </div>
        <Dialog.Close className="tpop-close" aria-label="Close">✕</Dialog.Close>
      </div>

      <div className="tpop-list">
        {words.map((w, i) => (
          <div key={w.chars} className="tpop-word">
            <div className="tpop-word-main">
              <div className="tpop-word-left">
                <span className="tpop-chars">{w.chars}</span>
                <span className="tpop-pinyin">{colorPinyin(w.pinyin)}</span>
                {w.translation && (
                  <span className="tpop-trans">{w.translation}</span>
                )}
              </div>
              <button
                className={`tpop-play ${playingIdx === i ? 'tpop-play--active' : ''}`}
                onClick={() => handlePlay(i, w)}
                aria-label={`Play ${w.chars}`}
              >
                {playingIdx === i ? <IconSpeaker size={16} /> : <IconPlay size={16} />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Single Grid Cell ── */
function TonePairCell({ rowTone, colTone, pairKey, words, onClick }) {
  const wordCount = words.length;
  const isNeutral = colTone === 5;

  return (
    <button
      className={`tp-cell${pairKey === '3-3' ? ' tp-cell--sandhi' : ''}`}
      onClick={() => onClick(pairKey)}
    >
      <div className="tp-cell-label" style={{
        '--tc1': TONE_COLORS[rowTone - 1],
        '--tc2': isNeutral ? 'var(--text-secondary)' : TONE_COLORS[colTone - 1]
      }}>
        <span className="tp-cell-label-num">{rowTone}</span>
        <span className="tp-cell-label-sep">-</span>
        <span className="tp-cell-label-num">{isNeutral ? '∅' : colTone}</span>
      </div>
      {pairKey === '3-3' && <div className="tp-cell-badge">sandhi</div>}
      <div className="tp-cell-count">{wordCount}</div>
    </button>
  );
}

/* ── Main Board ── */
export default function TonePairBoard() {
  const [popupPair, setPopupPair] = useState(null);

  const openPopup = useCallback((pairKey) => {
    hapticFeedback();
    setPopupPair(pairKey);
  }, []);

  const closePopup = useCallback(() => setPopupPair(null), []);

  const activeWords = popupPair
    ? (tonePairWords[popupPair] || []).filter(w => wordsWithAudio[w.chars]).slice(0, 8)
    : [];

  return (
    <div className="tp-wrapper">
      <div className="tp-board">
        <DotPattern spacing={24} radius={0.6} color="rgba(196, 168, 130, 0.18)" />
        <div className="tp-head">
          <h2 className="tp-title">Tone Sandhi</h2>
          <p className="tp-sub">
            Two-syllable tone combos — tap a cell to explore words
          </p>
        </div>

        {/* 4×5 Grid */}
        <div className="tp-grid">
          <div className="tp-grid-corner" />

          {COL_TONES.map(t => (
            <div
              key={`col-${t}`}
              className="tp-grid-header"
              style={{ '--hc': t === 5 ? 'var(--text-secondary)' : TONE_COLORS[t - 1] }}
            >
              <span className="tp-grid-header-icon">{t === 5 ? '∅' : '↑'}</span>
              <span className="tp-grid-header-label">{t === 5 ? 'neutral' : TONE_LABELS[t - 1]}</span>
            </div>
          ))}

          {ROW_TONES.map(rowTone => (
            <Fragment key={`row-${rowTone}`}>
              <div className="tp-grid-row-header" style={{ '--hc': TONE_COLORS[rowTone - 1] }}>
                <span className="tp-grid-header-icon">→</span>
                <span className="tp-grid-header-label">{TONE_LABELS[rowTone - 1]}</span>
              </div>
              {COL_TONES.map(colTone => {
                const pairKey = `${rowTone}-${colTone}`;
                const words = tonePairWords[pairKey] || [];
                const audioWords = words.filter(w => wordsWithAudio[w.chars]);
                return (
                  <TonePairCell
                    key={pairKey}
                    rowTone={rowTone}
                    colTone={colTone}
                    pairKey={pairKey}
                    words={audioWords}
                    onClick={openPopup}
                  />
                );
              })}
            </Fragment>
          ))}
        </div>

        {/* Legend */}
        <div className="tp-legend">
          <span className="tp-legend-item">
            <span className="tp-legend-dot" style={{ background: 'var(--tone-1)' }} /> 1st
          </span>
          <span className="tp-legend-item">
            <span className="tp-legend-dot" style={{ background: 'var(--tone-2)' }} /> 2nd
          </span>
          <span className="tp-legend-item">
            <span className="tp-legend-dot" style={{ background: 'var(--tone-3)' }} /> 3rd
          </span>
          <span className="tp-legend-item">
            <span className="tp-legend-dot" style={{ background: 'var(--tone-4)' }} /> 4th
          </span>
          <span className="tp-legend-item">
            <span className="tp-legend-dot" style={{ background: 'var(--tone-neutral)' }} /> ∅ neutral
          </span>
          <span className="tp-legend-item tp-legend-sandhi">⚡ 3-3 sandhi</span>
        </div>
      </div>

      <Dialog.Root open={!!popupPair} onOpenChange={open => { if (!open) closePopup(); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="tpop-overlay" />
          <Dialog.Content className="tpop-modal" aria-describedby={undefined}>
            {popupPair && (
              <WordPopupContent
                pairKey={popupPair}
                words={activeWords}
              />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
