import { useState } from 'react';
import {
  type RoomState,
  MIN_ROWS,
  MAX_ROWS,
  MIN_COLS,
  MAX_COLS,
  MIN_DURATION_MS,
  MAX_DURATION_MS,
  DURATION_STEP_MS,
} from '@fruitbox/shared';
import { ThemeToggle } from './ThemeToggle';

interface LobbyProps {
  roomState: RoomState;
  playerId: string;
  isHost: boolean;
  onStartGame: () => void;
  onLeave: () => void;
  onUpdateConfig: (patch: { rows?: number; cols?: number; durationMs?: number }) => void;
}

const SIZE_PRESETS: { label: string; rows: number; cols: number }[] = [
  { label: 'Small', rows: 8, cols: 12 },
  { label: 'Classic', rows: 10, cols: 17 },
  { label: 'Large', rows: 12, cols: 20 },
];

const DURATION_PRESETS: { label: string; ms: number }[] = [
  { label: '1 min', ms: 60_000 },
  { label: '2 min', ms: 120_000 },
  { label: '5 min', ms: 300_000 },
];

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

const AVATAR_COLORS = [
  'bg-rose-500', 'bg-amber-500', 'bg-emerald-500', 'bg-blue-500',
  'bg-violet-500', 'bg-pink-500', 'bg-teal-500', 'bg-orange-500',
];

export function Lobby({ roomState, playerId, isHost, onStartGame, onLeave, onUpdateConfig }: LobbyProps) {
  const allPlayers = Object.values(roomState.players);
  const players = allPlayers.filter((p) => !p.isSpectator);
  const spectators = allPlayers.filter((p) => p.isSpectator);
  const roomCode = roomState.code;
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--lobby-bg)' }}
    >
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <p className="label-eyebrow mb-3">Room Code</p>
          <button
            onClick={copyCode}
            className="group relative inline-flex flex-col items-center gap-1"
          >
            <span
              className="font-display font-extrabold gradient-text"
              style={{ fontSize: 52, letterSpacing: '0.18em', lineHeight: 1 }}
            >
              {roomCode}
            </span>
            <span className="text-xs text-text-3 group-hover:text-text-2 transition-colors">
              {copied ? '✓ Copied' : 'Click to copy'}
            </span>
          </button>
        </div>

        <div className="panel p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="label-eyebrow">Players</h2>
            <span className="text-xs tabular-nums text-text-3 font-display">
              {players.length}/8
            </span>
          </div>

          <div className="space-y-1.5">
            {players.map((p, i) => (
              <div
                key={p.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  p.id === playerId ? 'bg-accent/[0.06]' : 'hover:bg-panel-hover'
                } ${!p.connected ? 'opacity-40' : ''}`}
              >
                <div className={`w-9 h-9 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-text truncate block">
                    {p.name}
                    {p.id === playerId && <span className="text-text-3 font-normal ml-1">(you)</span>}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {p.id === roomState.hostPlayerId && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-panel border border-border text-text-2">
                      Host
                    </span>
                  )}
                  <div className={`w-1.5 h-1.5 rounded-full ${p.connected ? 'bg-emerald' : 'bg-text-3'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {spectators.length > 0 && (
          <div className="panel p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="label-eyebrow">Spectators</h2>
              <span className="text-xs tabular-nums text-text-3 font-display">{spectators.length}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {spectators.map((p) => (
                <span
                  key={p.id}
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs ${
                    p.id === playerId ? 'bg-accent/[0.08] text-text' : 'bg-panel text-text-2'
                  } border border-border ${!p.connected ? 'opacity-40' : ''}`}
                >
                  <div className={`w-1 h-1 rounded-full ${p.connected ? 'bg-emerald' : 'bg-text-3'}`} />
                  {p.name}
                  {p.id === playerId && <span className="text-text-3">(you)</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        <GameSettings
          rows={roomState.config.rows}
          cols={roomState.config.cols}
          durationMs={roomState.config.durationMs}
          editable={isHost}
          onChange={onUpdateConfig}
        />

        {!isHost && (
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 text-sm text-text-2">
              <span className="pulse-dot" />
              Waiting for host to start
            </div>
          </div>
        )}

        <div className="space-y-2">
          {isHost && (
            <button className="btn-primary w-full" onClick={onStartGame}>
              Start Game
            </button>
          )}
          <button className="btn-ghost w-full text-sm" onClick={onLeave}>
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
}

interface GameSettingsProps {
  rows: number;
  cols: number;
  durationMs: number;
  editable: boolean;
  onChange: (patch: { rows?: number; cols?: number; durationMs?: number }) => void;
}

function GameSettings({ rows, cols, durationMs, editable, onChange }: GameSettingsProps) {
  const [open, setOpen] = useState(false);
  const durationSec = Math.round(durationMs / 1000);

  const bump = (field: 'rows' | 'cols' | 'durationMs', delta: number) => {
    if (!editable) return;
    if (field === 'rows') {
      onChange({ rows: clamp(rows + delta, MIN_ROWS, MAX_ROWS) });
    } else if (field === 'cols') {
      onChange({ cols: clamp(cols + delta, MIN_COLS, MAX_COLS) });
    } else {
      onChange({ durationMs: clamp(durationMs + delta, MIN_DURATION_MS, MAX_DURATION_MS) });
    }
  };

  const applySizePreset = (preset: { rows: number; cols: number }) => {
    if (!editable) return;
    onChange({ rows: preset.rows, cols: preset.cols });
  };

  const applyDurationPreset = (ms: number) => {
    if (!editable) return;
    onChange({ durationMs: ms });
  };

  return (
    <div className="panel p-4 mb-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-left"
      >
        <div>
          <h2 className="label-eyebrow">Game Settings</h2>
          <div className="text-xs text-text-3 mt-1 font-display tabular-nums">
            {rows} × {cols} · {durationSec}s
          </div>
        </div>
        <span className="text-text-3 text-xs">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          {!editable && (
            <p className="text-xs text-text-3">Only the host can change these.</p>
          )}

          <Stepper
            label="Rows"
            value={rows}
            min={MIN_ROWS}
            max={MAX_ROWS}
            onDec={() => bump('rows', -1)}
            onInc={() => bump('rows', +1)}
            disabled={!editable}
          />
          <Stepper
            label="Columns"
            value={cols}
            min={MIN_COLS}
            max={MAX_COLS}
            onDec={() => bump('cols', -1)}
            onInc={() => bump('cols', +1)}
            disabled={!editable}
          />

          <div className="flex flex-wrap gap-1.5">
            {SIZE_PRESETS.map((p) => {
              const active = p.rows === rows && p.cols === cols;
              return (
                <button
                  key={p.label}
                  type="button"
                  disabled={!editable}
                  onClick={() => applySizePreset(p)}
                  className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${
                    active
                      ? 'bg-accent/[0.1] border-accent/40 text-text'
                      : 'bg-panel border-border text-text-2 hover:bg-panel-hover hover:text-text'
                  } ${!editable ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {p.label} <span className="text-text-3">({p.rows}×{p.cols})</span>
                </button>
              );
            })}
          </div>

          <Stepper
            label="Duration"
            value={`${durationSec}s`}
            min={MIN_DURATION_MS / 1000}
            max={MAX_DURATION_MS / 1000}
            onDec={() => bump('durationMs', -DURATION_STEP_MS)}
            onInc={() => bump('durationMs', +DURATION_STEP_MS)}
            disabled={!editable}
          />

          <div className="flex flex-wrap gap-1.5">
            {DURATION_PRESETS.map((p) => {
              const active = p.ms === durationMs;
              return (
                <button
                  key={p.label}
                  type="button"
                  disabled={!editable}
                  onClick={() => applyDurationPreset(p.ms)}
                  className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${
                    active
                      ? 'bg-accent/[0.1] border-accent/40 text-text'
                      : 'bg-panel border-border text-text-2 hover:bg-panel-hover hover:text-text'
                  } ${!editable ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface StepperProps {
  label: string;
  value: number | string;
  min: number;
  max: number;
  onDec: () => void;
  onInc: () => void;
  disabled?: boolean;
}

function Stepper({ label, value, onDec, onInc, disabled }: StepperProps) {
  const btnCls =
    'w-7 h-7 rounded-md border border-border bg-panel text-text-2 hover:bg-panel-hover hover:text-text transition-colors text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed';
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-text-2">{label}</span>
      <div className="flex items-center gap-2">
        <button type="button" className={btnCls} onClick={onDec} disabled={disabled}>−</button>
        <span className="font-display tabular-nums text-text text-sm w-12 text-center">
          {value}
        </span>
        <button type="button" className={btnCls} onClick={onInc} disabled={disabled}>+</button>
      </div>
    </div>
  );
}
