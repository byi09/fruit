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
        border: '2px dashed rgba(59, 130, 246, 0.8)',
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.12)',
      }}
    />
  );
}
