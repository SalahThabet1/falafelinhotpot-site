import React, { memo } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { IconSearch, IconFilter, IconCheck, IconClose } from './icons';

import './SearchBar.css';

const SEARCH_MODES = [
  { value: 'syllable', label: 'Syllable' },
  { value: 'pinyin', label: 'Pinyin' },
  { value: 'both', label: 'Both' },
];

const SearchBar = memo(function SearchBar({
  value = '',
  onChange,
  placeholder = 'Search syllables…',
  searchMode = 'syllable',
  onSearchModeChange,
}) {
  const handleClear = () => {
    if (onChange) {
      onChange({ target: { value: '' } });
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
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
        <span className="search-hint">use 'v' for 'ü'</span>
      </div>
    </div>
  );
});

export default SearchBar;
