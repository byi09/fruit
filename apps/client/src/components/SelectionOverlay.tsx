interface SelectionOverlayProps {
  rect: { x: number; y: number; width: number; height: number };
}

export function SelectionOverlay({ rect }: SelectionOverlayProps) {
  return (
    <div
      className="absolute pointer-events-none z-10 rounded-sm"
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        border: '2px solid rgba(233, 69, 96, 0.7)',
        boxShadow: '0 0 12px rgba(233, 69, 96, 0.3), inset 0 0 12px rgba(233, 69, 96, 0.1)',
      }}
    />
  );
}
