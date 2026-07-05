import React, { memo } from 'react';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import './ClickModeSwitch.css';

const MODES = [
  { value: 'Show tones', label: 'Show tones' },
  { value: 'T1', label: 'T1' },
  { value: 'T2', label: 'T2' },
  { value: 'T3', label: 'T3' },
  { value: 'T4', label: 'T4' },
];

const TONE_INDEX = { T1: 0, T2: 1, T3: 2, T4: 3 };

const ClickModeSwitch = memo(function ClickModeSwitch({ mode, onChange }) {
  return (
    <ToggleGroup.Root
      type="single"
      value={mode}
      onValueChange={val => { if (val) onChange(val); }}
      className="click-mode-switch"
      aria-label="Click mode"
    >
      {MODES.map(({ value, label }) => {
        const toneIdx = TONE_INDEX[value];
        const cssVar = toneIdx !== undefined ? `var(--tone-${toneIdx + 1})` : undefined;
        const active = value === mode;

        return (
          <ToggleGroup.Item
            key={value}
            value={value}
            className={
              'mode-btn' +
              (toneIdx !== undefined ? ' mode-btn--tone' : '')
            }
            style={active && cssVar ? { '--mode-accent': cssVar } : undefined}
          >
            {label}
          </ToggleGroup.Item>
        );
      })}
    </ToggleGroup.Root>
  );
});

export default ClickModeSwitch;
