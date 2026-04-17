import { useState } from 'react';

interface HomeProps {
  onCreateRoom: (playerName: string) => void;
  onJoinRoom: (roomCode: string, playerName: string) => void;
  error: string | null;
}

export function Home({ onCreateRoom, onJoinRoom, error }: HomeProps) {
  const [playerName, setPlayerName] = useState(() => sessionStorage.getItem('fruitbox_name') || '');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState<'menu' | 'join'>('menu');

  const saveName = (name: string) => {
    setPlayerName(name);
    sessionStorage.setItem('fruitbox_name', name);
  };

  const handleCreate = () => {
    if (!playerName.trim()) return;
    onCreateRoom(playerName.trim());
  };

  const handleJoin = () => {
    if (!playerName.trim() || !roomCode.trim()) return;
    onJoinRoom(roomCode.trim(), playerName.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-stone-50">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 mb-5">
            <span className="text-3xl">🍎</span>
          </div>
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">
            Fruit Box
          </h1>
          <p className="text-stone-500 text-sm mt-1.5">
            Select rectangles that sum to 10
          </p>
        </div>

        <div className="panel-light p-6">
          <div className="mb-5">
            <label htmlFor="playerName" className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5">
              Name
            </label>
            <input
              id="playerName"
              type="text"
              className="input"
              placeholder="Your name"
              value={playerName}
              onChange={(e) => saveName(e.target.value)}
              maxLength={20}
              autoComplete="off"
            />
          </div>

          {error && (
            <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm animate-fade-in-fast">
              {error}
            </div>
          )}

          {mode === 'menu' ? (
            <div className="space-y-2.5">
              <button
                className="btn-primary w-full"
                onClick={handleCreate}
                disabled={!playerName.trim()}
              >
                Create Room
              </button>
              <button
                className="btn-outline w-full"
                onClick={() => setMode('join')}
                disabled={!playerName.trim()}
              >
                Join Room
              </button>
            </div>
          ) : (
            <div className="space-y-3 animate-fade-in-fast">
              <div>
                <label htmlFor="roomCode" className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5">
                  Room Code
                </label>
                <input
                  id="roomCode"
                  type="text"
                  className="input text-center text-xl tracking-[0.25em] uppercase font-mono font-bold"
                  placeholder="ABCD"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 4))}
                  maxLength={4}
                  autoComplete="off"
                  autoFocus
                />
              </div>
              <p className="text-xs text-stone-400 text-center">
                Joining mid-game? You&apos;ll spectate until the match ends, then play the next round.
              </p>
              <button
                className="btn-primary w-full"
                onClick={handleJoin}
                disabled={!playerName.trim() || roomCode.length !== 4}
              >
                Join Game
              </button>
              <button
                className="btn-ghost w-full text-sm"
                onClick={() => setMode('menu')}
              >
                Back
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 px-1">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">How to play</p>
          <div className="space-y-1.5 text-sm text-stone-500">
            <p>Drag to select a rectangle of numbered apples.</p>
            <p>If the numbers sum to exactly <span className="font-semibold text-stone-700">10</span>, they clear.</p>
            <p>Clear as many as you can before time runs out.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
