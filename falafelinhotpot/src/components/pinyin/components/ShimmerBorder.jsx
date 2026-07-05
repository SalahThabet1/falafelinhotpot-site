import React from 'react';

export default function ShimmerBorder({
  children,
  className = '',
  borderWidth = 1.5,
  duration = 3,
  color = 'var(--red)',
}) {
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'inherit',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          padding: borderWidth,
          background: `conic-gradient(from var(--shimmer-angle, 0deg), transparent 60%, ${color} 80%, transparent 100%)`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          animation: `shimmer-spin ${duration}s linear infinite`,
          opacity: 0.6,
        }}
      />
      <style>{`
        @keyframes shimmer-spin {
          from { --shimmer-angle: 0deg; }
          to { --shimmer-angle: 360deg; }
        }
        @property --shimmer-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
      `}</style>
      {children}
    </div>
  );
}
