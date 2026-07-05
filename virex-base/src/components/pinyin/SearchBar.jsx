import React, { memo } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { IconSearch, IconFilter, IconCheck, IconClose } from './icons';

import './SearchBar.css';

const SEARCH_MODES = [
  { value: 'syllable', label: 'Syllable', desc: 'Match the spelling only, e.g. "ma".' },
  { value: 'pinyin', label: 'Pinyin', desc: 'Match pronunciation — add a tone number for an exact tone, e.g. "ma1" for mā.' },
  { value: 'both', label: 'Both', desc: 'Match spelling or pronunciation.' },
];

const SearchBar = memo(function SearchBar({
  value = '',
  onChange,
  placeholder = 'Search',
  searchMode = 'syllable',
  onSearchModeChange,
  onEnter,
}) {
  const handleClear = () => {
    if (onChange) {
      onChange({ target: { value: '' } });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      onEnter?.();
    }
  };

  return (
    <div className="search-bar-wrapper">
      <div className="search-bar">
        <span className="search-icon" aria-hidden="true">
          <IconSearch size={15} />
        </span>
        <input
          type="text"
          className="search-input"
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Search syllables"
          autoComplete="off"
          spellCheck={false}
        />
        {value && (
          <button
            className="search-clear"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <IconClose size={12} />
          </button>
        )}
        <Popover.Root>
          <Popover.Trigger asChild>
            <button
              className="search-filter-toggle"
              aria-label="Toggle search options"
            >
              <IconFilter size={14} />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              className="search-options-panel"
              sideOffset={4}
              align="end"
            >
              <div className="search-options-section">
                <span className="search-options-label">Search in</span>
                <div className="search-options-group">
                  {SEARCH_MODES.map(({ value, label }) => (
                    <button
                      key={value}
                      className={`search-option-pill ${searchMode === value ? 'active' : ''}`}
                      onClick={() => onSearchModeChange?.(value)}
                      aria-pressed={searchMode === value}
                    >
                      {searchMode === value && <IconCheck size={10} />}
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="search-options-desc">
                {SEARCH_MODES.find(m => m.value === searchMode)?.desc}
              </p>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
        <span className="search-hint">use 'v' for 'ü'</span>
      </div>
    </div>
  );
});

export default SearchBar;
