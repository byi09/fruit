import type { RoomState } from '@fruitbox/shared';

interface LobbyProps {
  roomState: RoomState;
  playerId: string;
  isHost: boolean;
  onStartGame: () => void;
  onLeave: () => void;
}

export function Lobby({ roomState, playerId, isHost, onStartGame, onLeave }: LobbyProps) {
  const players = Object.values(roomState.players);
  const roomCode = roomState.code;

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode).catch(() => {});
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-lg w-full animate-slide-up">
        {/* Room code */}
        <div className="text-center mb-6">
          <p className="text-sm text-gray-500 mb-1">Room Code</p>
          <button
            onClick={copyCode}
            className="text-4xl font-mono font-extrabold tracking-[0.3em] text-emerald-600
                       hover:text-emerald-700 transition-colors cursor-pointer"
            title="Click to copy"
          >
            {roomCode}
          </button>
          <p className="text-xs text-gray-400 mt-1">Click to copy</p>
        </div>

        {/* Players */}
        <div className="mb-6">
          <h2 className="font-semibold text-gray-700 mb-3">
            Players ({players.length})
          </h2>
          <div className="space-y-2">
            {players.map((p) => (
              <div
                key={p.id}
                className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                  p.id === playerId ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50'
                } ${!p.connected ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${p.connected ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                  <span className="font-medium">
                    {p.name}
                    {p.id === playerId && <span className="text-gray-400 ml-1">(you)</span>}
                  </span>
                </div>
                {p.id === roomState.hostPlayerId && (
                  <span className="text-xs font-semibold px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                    HOST
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Waiting message */}
        {!isHost && (
          <div className="text-center text-gray-500 mb-4">
            Waiting for host to start the game...
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {isHost && (
            <button
              className="btn-primary w-full text-lg"
              onClick={onStartGame}
            >
              Start Game
            </button>
          )}
          <button
            className="w-full py-2 text-gray-500 hover:text-gray-700 transition-colors"
            onClick={onLeave}
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
}
