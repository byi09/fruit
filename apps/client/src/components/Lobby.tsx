import { useState } from 'react';
import type { RoomState } from '@fruitbox/shared';

interface LobbyProps {
  roomState: RoomState;
  playerId: string;
  isHost: boolean;
  onStartGame: () => void;
  onLeave: () => void;
}

const AVATAR_COLORS = [
  'bg-rose-500', 'bg-amber-500', 'bg-emerald-500', 'bg-blue-500',
  'bg-violet-500', 'bg-pink-500', 'bg-teal-500', 'bg-orange-500',
];

export function Lobby({ roomState, playerId, isHost, onStartGame, onLeave }: LobbyProps) {
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
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          'radial-gradient(ellipse 60% 40% at 50% -5%, rgba(99,102,241,0.07), transparent 60%), #08080f',
      }}
    >
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
