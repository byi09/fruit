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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-md w-full animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🍎</div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Fruit Box</h1>
          <p className="text-gray-500 mt-2">Select rectangles that sum to 10!</p>
        </div>

        {/* Name input */}
        <div className="mb-6">
          <label htmlFor="playerName" className="block text-sm font-medium text-gray-600 mb-2">
            Your Name
          </label>
          <input
            id="playerName"
            type="text"
            className="input"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => saveName(e.target.value)}
            maxLength={20}
            autoComplete="off"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm animate-fade-in">
            {error}
          </div>
        )}

        {mode === 'menu' ? (
          <div className="space-y-3">
            <button
              className="btn-primary w-full text-lg"
              onClick={handleCreate}
              disabled={!playerName.trim()}
            >
              Create Room
            </button>
            <button
              className="btn-secondary w-full text-lg"
              onClick={() => setMode('join')}
              disabled={!playerName.trim()}
            >
              Join Room
            </button>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in">
            <div>
              <label htmlFor="roomCode" className="block text-sm font-medium text-gray-600 mb-2">
                Room Code
              </label>
              <input
                id="roomCode"
                type="text"
                className="input text-center text-2xl tracking-[0.3em] uppercase font-mono"
                placeholder="ABCD"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 4))}
                maxLength={4}
                autoComplete="off"
                autoFocus
              />
            </div>
            <button
              className="btn-primary w-full text-lg"
              onClick={handleJoin}
              disabled={!playerName.trim() || roomCode.length !== 4}
            >
              Join Game
            </button>
            <button
              className="w-full py-2 text-gray-500 hover:text-gray-700 transition-colors"
              onClick={() => setMode('menu')}
            >
              Back
            </button>
          </div>
        )}

        {/* How to play */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-2">How to Play</h3>
          <ul className="text-sm text-gray-500 space-y-1">
            <li>Drag to select a rectangle of numbered apples</li>
            <li>If the numbers sum to exactly 10, they clear!</li>
            <li>Clear as many apples as possible before time runs out</li>
            <li>Compete against other players in real-time</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
