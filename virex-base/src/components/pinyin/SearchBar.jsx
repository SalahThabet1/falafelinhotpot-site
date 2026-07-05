import React, { memo } from 'react';
import { IconSearch, IconClose } from './icons';

import './SearchBar.css';

const SearchBar = memo(function SearchBar({
  value = '',
  onChange,
  placeholder = 'Search',
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
        <span className="search-hint">use 'v' for 'ü'</span>
      </div>
    </div>
  );
});

export default SearchBar;
