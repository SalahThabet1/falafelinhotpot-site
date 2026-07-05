import React, { memo } from 'react';
import { CELLS } from '../cellData';
import './SoundCell.css';

const SoundCell = memo(function SoundCell({ cellKey, onTap, isDimmed, isMatched, isIrregular }) {
  const data = CELLS[cellKey];
  if (!data) return <td className="cell cell--empty" />;
  const cls = 'cell-btn' +
    (isDimmed ? ' cell-btn--dimmed' : '') +
    (isMatched ? ' cell-btn--matched' : '') +
    (isIrregular ? ' cell-btn--irregular' : '');
  return (
    <td className="cell">
      <button className={cls} onClick={() => onTap(data.syl, data.pins)}>
        {data.syl}
      </button>
    </td>
  );
});

export default SoundCell;
