interface SelectionOverlayProps {
  rect: { x: number; y: number; width: number; height: number };
  valid?: boolean;
}

export function SelectionOverlay({ rect, valid }: SelectionOverlayProps) {
  const border = valid
    ? '2px solid rgba(16, 185, 129, 0.75)'
    : '2px solid rgba(233, 69, 96, 0.7)';
  const background = valid
    ? 'rgba(16, 185, 129, 0.1)'
    : 'rgba(233, 69, 96, 0.08)';
  const shadow = valid
    ? '0 0 24px rgba(16, 185, 129, 0.3)'
    : '0 0 18px rgba(233, 69, 96, 0.3)';

  return (
    <div
      className="absolute pointer-events-none z-10"
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        border,
        background,
        boxShadow: shadow,
        borderRadius: 4,
      }}
    />
  );
}
