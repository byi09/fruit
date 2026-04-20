import { useState, useEffect, useMemo } from 'react';

interface HomeProps {
  onCreateRoom: (playerName: string) => void;
  onJoinRoom: (roomCode: string, playerName: string) => void;
  error: string | null;
}

interface FloatingApple {
  id: number;
  left: number;
  delay: number;
  duration: number;
  rotation: number;
  scale: number;
}

// Mini preview board — small fixed 4×9 slice
const PREVIEW_VALUES = [
  [3, 5, 2, 7, 1, 8, 4, 6, 2],
  [6, 2, 5, 3, 9, 1, 2, 4, 8],
  [4, 8, 1, 6, 2, 5, 3, 7, 1],
  [1, 3, 7, 2, 4, 9, 5, 2, 3],
];
// Selected = cells forming a 3+2+5 = 10 group
const PREVIEW_SELECTED = new Set<string>(['2,0', '2,1', '3,2']);
const PREVIEW_CLEARED = new Set<string>(['0,6', '0,7', '1,5']);

export function Home({ onCreateRoom, onJoinRoom, error }: HomeProps) {
  const [playerName, setPlayerName] = useState(() => sessionStorage.getItem('fruitbox_name') || '');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState<'menu' | 'join'>('menu');
  const [applesCleared, setApplesCleared] = useState(() => 4823 + Math.floor(Math.random() * 200));
  const [gamesPlayed, setGamesPlayed] = useState(() => 512 + Math.floor(Math.random() * 40));

  const floatingApples = useMemo<FloatingApple[]>(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 12,
        duration: 10 + Math.random() * 18,
        rotation: (Math.random() - 0.5) * 40,
        scale: 0.7 + Math.random() * 0.6,
      })),
    [],
  );

  useEffect(() => {
    const id = setInterval(() => {
      setApplesCleared((n) => n + Math.floor(Math.random() * 4) + 1);
      if (Math.random() < 0.3) setGamesPlayed((n) => n + 1);
    }, 2000);
    return () => clearInterval(id);
  }, []);

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
    <div className="relative min-h-screen overflow-hidden bg-bg">
      {/* Animated orbs */}
      <div
        className="orb animate-orb1"
        style={{
          top: '-10%',
          left: '-10%',
          width: 520,
          height: 520,
          background: 'radial-gradient(circle, rgba(233,69,96,0.45), transparent 60%)',
        }}
      />
      <div
        className="orb animate-orb2"
        style={{
          bottom: '-15%',
          right: '-10%',
          width: 560,
          height: 560,
          background: 'radial-gradient(circle, rgba(99,102,241,0.35), transparent 60%)',
        }}
      />
      <div
        className="orb animate-orb1"
        style={{
          top: '30%',
          left: '40%',
          width: 420,
          height: 420,
          background: 'radial-gradient(circle, rgba(245,158,11,0.15), transparent 60%)',
          animationDelay: '-8s',
        }}
      />

      {/* Dot grid overlay */}
      <div className="absolute inset-0 dot-grid pointer-events-none" />

      {/* Floating apples */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {floatingApples.map((a) => (
          <span
            key={a.id}
            className="absolute bottom-[-10vh] text-2xl animate-float-up"
            style={{
              left: `${a.left}%`,
              animationDuration: `${a.duration}s`,
              animationDelay: `-${a.delay}s`,
              transform: `scale(${a.scale})`,
              ['--r' as string]: `${a.rotation}deg`,
            }}
          >
            🍎
          </span>
        ))}
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-[380px] animate-fade-in">
          {/* Hero */}
          <div className="text-center mb-7">
            <div className="relative inline-flex items-center justify-center w-[72px] h-[72px] mb-5">
              <div
                className="absolute inset-[-30%] rounded-full animate-glow-pulse"
                style={{
                  background: 'radial-gradient(circle, rgba(233,69,96,0.5), transparent 60%)',
                  filter: 'blur(16px)',
                }}
              />
              <div
                className="relative w-full h-full flex items-center justify-center"
                style={{
                  borderRadius: 22,
                  background: 'linear-gradient(135deg, rgba(233,69,96,0.18), rgba(233,69,96,0.08))',
                  border: '1px solid rgba(233,69,96,0.3)',
                  boxShadow: '0 0 40px rgba(233,69,96,0.2)',
                }}
              >
                <span className="text-4xl">🍎</span>
              </div>
            </div>
            <h1
              className="font-display font-extrabold tracking-tight gradient-text"
              style={{ fontSize: 36, letterSpacing: '-0.03em' }}
            >
              Fruit Box
            </h1>
            <p className="text-[13px] text-text-2 mt-2">
              Competitive apple-clearing puzzle
            </p>

            {/* Live ticker */}
            <div className="mt-5 flex items-center justify-center gap-2">
              <div className="bg-panel border border-border rounded-lg px-3.5 py-2">
                <div className="font-display text-[18px] font-extrabold text-text tabular-nums leading-none">
                  {applesCleared.toLocaleString()}
                </div>
                <div className="text-[9px] text-text-3 uppercase tracking-wider mt-0.5">
                  Apples cleared
                </div>
              </div>
              <div className="bg-panel border border-border rounded-lg px-3.5 py-2">
                <div className="font-display text-[18px] font-extrabold text-emerald tabular-nums leading-none">
                  {gamesPlayed.toLocaleString()}
                </div>
                <div className="text-[9px] text-text-3 uppercase tracking-wider mt-0.5">
                  Games played
                </div>
              </div>
            </div>
          </div>

          {/* Glowing-border card */}
          <div className="glow-border">
            <div
              className="relative shimmer-surface"
              style={{
                background: 'rgba(14,14,28,0.96)',
                backdropFilter: 'blur(20px)',
                borderRadius: 14,
                overflow: 'hidden',
              }}
            >
              {/* Mini board preview */}
              <div className="px-5 pt-5 pb-4">
                <p className="text-center text-[9px] uppercase tracking-wider text-text-3 mb-2.5">
                  live preview
                </p>
                <div
                  className="grid gap-[2px] mx-auto"
                  style={{
                    gridTemplateColumns: 'repeat(9, 1fr)',
                    maxWidth: 280,
                  }}
                >
                  {PREVIEW_VALUES.flatMap((row, r) =>
                    row.map((val, c) => {
                      const key = `${r},${c}`;
                      const isSelected = PREVIEW_SELECTED.has(key);
                      const isCleared = PREVIEW_CLEARED.has(key);
                      if (isCleared) {
                        return (
                          <div
                            key={key}
                            className="aspect-square"
                            style={{ background: 'var(--cell-cleared)', borderRadius: 2 }}
                          />
                        );
                      }
                      return (
                        <div
                          key={key}
                          className="relative aspect-square flex items-center justify-center"
                          style={{
                            background: isSelected ? 'rgba(233,69,96,0.25)' : 'var(--cell)',
                            borderRadius: 2,
                            boxShadow: isSelected ? 'inset 0 0 0 1px rgba(233,69,96,0.5)' : undefined,
                          }}
                        >
                          <span className="text-[10px] leading-none">
                            {isSelected ? '🍏' : '🍎'}
                          </span>
                          <span
                            className="absolute inset-0 flex items-center justify-center font-display font-extrabold text-white text-[9px]"
                            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.95)' }}
                          >
                            {val}
                          </span>
                        </div>
                      );
                    }),
                  )}
                </div>
                <p
                  className="text-center text-[10px] mt-2"
                  style={{ color: 'rgba(233,69,96,0.7)' }}
                >
                  ✓ 3+2+5 = 10 — cleared!
                </p>
              </div>

              {/* Form */}
              <div className="px-5 pt-4 pb-5 border-t border-border">
                <div className="mb-4">
                  <label htmlFor="playerName" className="label-eyebrow block mb-1.5">
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
                  <div className="mb-3 px-3 py-2 bg-accent/10 border border-accent/30 rounded-lg text-accent text-sm animate-fade-in-fast">
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
                      className="btn-ghost w-full"
                      onClick={() => setMode('join')}
                      disabled={!playerName.trim()}
                    >
                      Join Room
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 animate-fade-in-fast">
                    <div>
                      <label htmlFor="roomCode" className="label-eyebrow block mb-1.5">
                        Room Code
                      </label>
                      <input
                        id="roomCode"
                        type="text"
                        className="input text-center font-display font-extrabold uppercase"
                        style={{ fontSize: 26, letterSpacing: '0.22em' }}
                        placeholder="ABCD"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 4))}
                        maxLength={4}
                        autoComplete="off"
                        autoFocus
                      />
                    </div>
                    <p className="text-xs text-text-3 text-center">
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
                      className="btn-ghost w-full"
                      onClick={() => setMode('menu')}
                    >
                      Back
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* How to play */}
          <div className="mt-5 flex flex-wrap gap-1.5">
            {[
              { title: 'Drag', body: 'Select a rectangle' },
              { title: 'Sum 10', body: 'Numbers must total 10' },
              { title: 'Clear', body: 'Apples pop and vanish' },
              { title: 'Win', body: 'Most cleared when time ends' },
            ].map((t) => (
              <div
                key={t.title}
                className="panel-light px-2.5 py-2"
                style={{ flex: '1 1 calc(50% - 6px)', borderRadius: 8 }}
              >
                <div className="text-[10px] font-bold text-accent uppercase tracking-wider">
                  {t.title}
                </div>
                <div className="text-[11px] text-text-2 mt-0.5">{t.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
