import React, { memo } from 'react';
import SeatingMapOptimized from './SeatingMapOptimized';
import { BackgroundImage } from './SeatingMapOptimized'; // If we exported it, otherwise we might need to copy/export it or just not use it if Optimized handles it internally (it does).

// This file is now a facade to keep imports working.
// It maps the legacy props to the new component signature.

const SeatingMapUnified = (props) => {
  // Map legacy props to new component expectations
  // Old: onSeatToggle(seat)
  // New: onSeatClick(seat)

  const handleSeatClick = (seat) => {
    if (props.onSeatToggle) {
      props.onSeatToggle(seat);
    }
    if (props.onSeatClick) {
      props.onSeatClick(seat);
    }
  };

  return (
    <SeatingMapOptimized
      {...props}
      onSeatClick={handleSeatClick}
    />
  );
};

export { BackgroundImage }; // Keep export if used elsewhere
export const registerProgressCallback = () => { }; // No-op for now unless we reimplement in Optimized
export default memo(SeatingMapUnified);
