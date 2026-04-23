interface SelectionOverlayProps {
  rect: { x: number; y: number; width: number; height: number };
  valid?: boolean;
}

export function SelectionOverlay({ rect, valid }: SelectionOverlayProps) {
  const border = valid
    ? '2px solid var(--sel-valid-border)'
    : '2px solid var(--sel-invalid-border)';
  const background = valid ? 'var(--sel-valid-bg)' : 'var(--sel-invalid-bg)';
  const shadow = valid ? 'var(--sel-valid-shadow)' : 'var(--sel-invalid-shadow)';

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
