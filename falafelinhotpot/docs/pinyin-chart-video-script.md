# Pinyin Chart — "How to Use" Video Script

Route: `https://falafelinhotpot.com/pinyin-chart` (single page, no sub-routes — everything below is tab/interaction state on this one URL).

This doc has two parts:
- **Part 1** — narration script + shot list, ready to record against.
- **Part 2** — technical appendix, mapping every scene to the exact route/selector/interaction/source file, for an agent driving a browser to capture footage.

---

## Part 1 — Narration script + shot list

### Scene 0 — Cold open / hook
**[On screen]** Homepage or a blank title card, then a hard cut into the Pinyin Chart page, Sound Table tab, default state.
**[Voiceover]** "Pinyin looks like a wall of syllables — and the part that actually trips people up is tone. So we built one chart that shows you every sound, and lets you hear every one of them."
**[Action]** Cut to `/pinyin-chart`.

### Scene 1 — Sound Table: the grid
**[On screen]** The initial × final grid — rows are consonants (b, p, m, f...), columns are grouped by vowel (I, A, E, O, IA/IE...). Cursor/finger taps a cell, e.g. "ma".
**[Voiceover]** "Every valid syllable in Mandarin, laid out by initial and final. Tap any one—"
**[Action]** Tap a cell (e.g. `ma`) with the mode switch on its default, "Show tones."

### Scene 2 — Sound Table: the tone sheet
**[On screen]** A bottom sheet slides up showing all 4 tones for that syllable (mā, má, mǎ, mà), each with its own play button.
**[Voiceover]** "—and hear all four tones for that syllable side by side. Same syllable, four completely different meanings."
**[Action]** Tap each tone's play button in turn; close the sheet.

### Scene 3 — Sound Table: direct tone playback
**[On screen]** Tap the mode switch, select "T3." Now tapping any cell plays that tone directly — no sheet.
**[Voiceover]** "Or lock in one tone — say, third tone — and every cell you tap plays straight away. Good for drilling one tone across the whole chart."
**[Action]** Switch mode to `T3` (or `T1`/`T2`/`T4`), tap 2-3 cells to demonstrate direct playback.

### Scene 4 — Sound Table: search
**[On screen]** Type "zh" into the search bar. Matching cells stay lit, everything else dims. Press Enter — the view scrolls to the first match; press Enter again, it advances to the next.
**[Voiceover]** "Searching narrows the whole table live, and Enter walks you through every match without losing your place in the search box."
**[Action]** Type into `.search-input`, press Enter twice, clear the search.

### Scene 5 — The Sound Map: tone sandhi
**[On screen]** Switch tabs to "The Sound Map." A 5×5 grid appears: tone 1–4 plus neutral, row against column.
**[Voiceover]** "Tones don't just exist on their own — they change each other. This is the sandhi map: every combination of two tones next to each other."
**[Action]** Switch to the "The Sound Map" tab.

### Scene 6 — The Sound Map: word popup + the 3rd+3rd callout
**[On screen]** Tap a regular cell (e.g. 1st+2nd) — a popup opens with real two-syllable words using that pair, each individually playable. Then tap the cell marked "sandhi" (3rd + 3rd).
**[Voiceover]** "Tap any pair to hear real words that use it. And this one—third tone plus third tone—is the famous exception: it doesn't sound like two third tones back to back, it sounds like second-plus-third. That's tone sandhi, and it's marked right on the map."
**[Action]** Tap a normal cell, play 1-2 words, close, then tap the `3-3` sandhi cell.

### Scene 7 — Learn tab: the guide
**[On screen]** Switch to "Learn." Scroll through the table of contents (7 sections), land on "Tricky Sounds."
**[Voiceover]** "Everything that's easy to get wrong — tricky sounds, irregular pronunciations, the finals table, tone sandhi explained in plain language — is written up here, organized so you're never staring at a wall of text."
**[Action]** Switch to the "Learn" tab, scroll to a section with visible "Listen" buttons.

### Scene 8 — Learn tab: inline audio
**[On screen]** Tap a "Listen" button next to a described sound (e.g. one of the tricky-sounds examples).
**[Voiceover]** "And nothing is just described — if we're telling you a sound is tricky, you can hear it right there, next to the explanation."
**[Action]** Tap 1-2 "Listen" buttons inline in the Learn content.

### Scene 9 — Mobile pass
**[On screen]** Resize/switch to a phone-width view. The same 3 tabs now live in a bottom dock with icons; each has its own small entrance animation on tab switch. Search bar appears above the dock's tab row only when Sound Table is active.
**[Voiceover]** "It's the same tool on your phone — dock at the bottom, tabs animate in, search shows up right where your thumb is."
**[Action]** Switch viewport to mobile, tap through the 3 dock tabs.

### Scene 10 — Close
**[On screen]** Back to the Sound Table default view, full chart visible.
**[Voiceover]** "One chart. Every syllable, every tone, every exception — and you can hear all of it. That's the Pinyin Chart."
**[Action]** End card / link to `falafelinhotpot.com/pinyin-chart`.

---

## Part 2 — Technical appendix (for a browser-driving agent)

| Scene | Route | Selector(s) | Interaction | Source file |
|---|---|---|---|---|
| 1 — Grid | `/pinyin-chart` | `.cell-btn` (has `data-cell-key` attr, e.g. `m|a`) | Click a cell | `src/components/pinyin/PinyinChartApp.jsx:63-82` (cell), `:242-306` (table render) |
| 2 — Tone sheet | `/pinyin-chart` | `.sheet` (Radix `Dialog.Content`), `.tone-btn` × 4, `.sheet-close` | Click a cell while mode = "Show tones" (default) | `PinyinChartApp.jsx:85-115` (`ToneSheetContent`), `:354-371` (Dialog mount) |
| 3 — Direct tone tap | `/pinyin-chart` | `.click-mode-switch` (Radix `ToggleGroup.Root`), items `.mode-btn` labelled "Show tones", "T1"–"T4" | Click a `T1`–`T4` pill, then click any `.cell-btn` — plays immediately, no dialog | `src/components/pinyin/ClickModeSwitch.jsx`; mode-branch logic in `PinyinChartApp.jsx:158-171` (`open` callback) |
| 4 — Search | `/pinyin-chart` | `.search-input` (only rendered inside `.dock-context` while Sound Table tab is active) | Type text; press `Enter` to cycle matches (`.cell-btn--current` marks the active match) | `PinyinChartApp.jsx:329-336` (mount condition), `:192-240` (match logic), `src/components/pinyin/SearchBar.jsx` |
| 5 — Sound Map grid | `/pinyin-chart` | `[role=tab]` with accessible name "The Sound Map"; grid cells `.tp-cell`, sandhi cell also has `.tp-cell--sandhi` | Click the tab, then observe grid | `PinyinChartApp.jsx:343-346` (tab trigger), `src/components/pinyin/TonePairBoard.jsx:87-` (`TonePairCell`) |
| 6 — Sandhi popup | `/pinyin-chart` | `.tpop-modal` (Radix `Dialog.Content`), `.tpop-play` per word | Click any `.tp-cell`; specifically click the `3-3` cell for the sandhi callout | `TonePairBoard.jsx` (popup + word list rendering, `tpop-*` classes) |
| 7 — Learn ToC | `/pinyin-chart` | `[role=tab]` name "Learn"; section anchors `#tones-glance`, `#syllable-structure`, `#finals-table`, `#tricky-sounds`, `#irregular-pron`, `#tones-detail`, `#tone-sandhi` | Click the tab, scroll or click a ToC link | `PinyinChartApp.jsx:347-350` (tab trigger), `src/components/pinyin/LearnSection.jsx:403-559` (section markup) |
| 8 — Inline audio | `/pinyin-chart` | "Listen" buttons inside `.lp-section` cards (class documented at `LearnSection.jsx:350`, mirrors `TonePairBoard.jsx`'s `.tpop-play` pattern) | Click a Listen button | `LearnSection.jsx:350-` (`ListenButton`/handler) |
| 9 — Mobile dock | `/pinyin-chart` (viewport ≤ ~480px) | `.dock`, `.dock-tabs`, `.dock-btn--chart` / `--pairs` / `--learn` | Resize viewport, click each dock tab | `App.css` (`.dock*` rules, per-tab keyframes), `PinyinChartApp.jsx:327-352` (dock markup) |
| — Audio engine (background) | n/a | n/a | Every play action above routes through one shared engine — useful if the voiceover wants to mention consistent volume | `src/components/pinyin/audioEngine.js` (RMS loudness normalization + shared `DynamicsCompressorNode`, so every clip plays back at comparable volume regardless of source file) |

**Recording notes:**
- No third-party scripts or auth gates on this route — safe to load directly and start capturing.
- The React island hydrates via `client:load` (`src/pages/pinyin-chart.astro`), so wait for `networkidle` (or a `.cell-btn` to be clickable) before the first interaction, same as `wait_for_load_state('networkidle')` in this repo's existing Playwright scripts.
- Desktop viewport shows tabs + search inline at the top; mobile (≤480px) is the bottom-dock layout — capture both if the video covers responsive behavior (Scene 9).
