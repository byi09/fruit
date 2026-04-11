import { useEffect } from 'react';
import { useSocket } from './hooks/useSocket';
import { useServerTime } from './hooks/useServerTime';
import { useRoom } from './hooks/useRoom';
import { useGame } from './hooks/useGame';
import { useChat } from './hooks/useChat';
import { Home } from './components/Home';
import { Lobby } from './components/Lobby';
import { Countdown } from './components/Countdown';
import { GameBoard } from './components/GameBoard';
import { Timer } from './components/Timer';
import { Leaderboard } from './components/Leaderboard';
import { Results } from './components/Results';
import { Chat } from './components/Chat';
import { PlayerStats } from './components/PlayerStats';

export default function App() {
  const { isConnected } = useSocket();
  useServerTime();
  const {
    roomState,
    playerId,
    screen,
    setScreen,
    error,
    isHost,
    createRoom,
    joinRoom,
    leaveRoom,
  } = useRoom();
  const {
    board,
    config,
    endsAt,
    startsAt,
    scores,
    standings,
    roundNumber,
    roundHistory,
    myScore,
    myMoves,
    isPaused,
    pausedByName,
    startGame,
    submitMove,
    requestRematch,
    pauseGame,
    resumeGame,
  } = useGame(setScreen);
  const { messages, sendMessage, unreadCount, markVisible } = useChat();

  useEffect(() => {
    markVisible(screen === 'playing');
  }, [screen, markVisible]);

  const connectionBadge = !isConnected ? (
    <div className="fixed top-3 right-3 z-50">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 backdrop-blur-sm border border-red-500/20 animate-pulse">
        <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
        Reconnecting
      </div>
    </div>
  ) : null;

  if (screen === 'home') {
    return (
      <>
        {connectionBadge}
        <Home onCreateRoom={createRoom} onJoinRoom={joinRoom} error={error} />
      </>
    );
  }

  if (screen === 'lobby' && roomState && playerId) {
    return (
      <>
        {connectionBadge}
        <Lobby
          roomState={roomState}
          playerId={playerId}
          isHost={isHost}
          onStartGame={startGame}
          onLeave={leaveRoom}
        />
      </>
    );
  }

  if (screen === 'countdown' && startsAt) {
    return (
      <>
        {connectionBadge}
        <Countdown startsAt={startsAt} />
      </>
    );
  }

  if (screen === 'playing' && board && config && endsAt && roomState && playerId) {
    const totalCells = config.rows * config.cols;
    return (
      <>
        {connectionBadge}
        <div className="min-h-screen game-bg text-white">
          {/* Top bar */}
          <div className="px-3 sm:px-6 py-3 border-b border-white/[0.06]">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              {/* Left: score + moves */}
              <div className="flex items-center gap-5">
                <div>
                  <div className="text-[10px] font-medium text-white/30 uppercase tracking-wider">Score</div>
                  <div className="text-2xl font-extrabold tabular-nums text-white leading-tight">
                    {myScore}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-medium text-white/30 uppercase tracking-wider">Moves</div>
                  <div className="text-2xl font-extrabold tabular-nums text-white/70 leading-tight">
                    {myMoves}
                  </div>
                </div>
              </div>

              {/* Center: timer */}
              <Timer endsAt={endsAt} isPaused={isPaused} durationMs={config.durationMs} />

              {/* Right: pause + room code */}
              <div className="flex items-center gap-3">
                <button
                  onClick={isPaused ? resumeGame : pauseGame}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                             bg-white/[0.06] hover:bg-white/[0.12] text-white/60 hover:text-white border border-white/[0.06]"
                  title={isPaused ? 'Resume game' : 'Pause game'}
                >
                  {isPaused ? (
                    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><polygon points="4,2 14,8 4,14" /></svg>
                  ) : (
                    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><rect x="3" y="2" width="3.5" height="12" rx="0.5" /><rect x="9.5" y="2" width="3.5" height="12" rx="0.5" /></svg>
                  )}
                  <span className="hidden sm:inline">{isPaused ? 'Resume' : 'Pause'}</span>
                </button>
                <span className="text-xs font-mono text-white/20 tracking-wider">
                  {roomState.code}
                </span>
              </div>
            </div>
          </div>

          {/* Game area */}
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Left sidebar: Chat */}
              <div className="lg:w-64 xl:w-72 flex flex-col order-2 lg:order-1 lg:min-h-[480px]">
                <Chat messages={messages} onSend={sendMessage} myPlayerId={playerId} />
              </div>

              {/* Center: Board */}
              <div className="flex-1 order-1 lg:order-2">
                <GameBoard board={board} config={config} onMove={submitMove} disabled={isPaused} />
              </div>

              {/* Right sidebar: Leaderboard + Stats */}
              <div className="lg:w-56 xl:w-64 space-y-3 order-3">
                <Leaderboard
                  roomState={roomState}
                  scores={scores}
                  myPlayerId={playerId}
                  myScore={myScore}
                  myMoves={myMoves}
                />
                <PlayerStats score={myScore} moves={myMoves} totalCells={totalCells} startsAt={startsAt!} />
              </div>
            </div>
          </div>
        </div>

        {/* Pause overlay */}
        {isPaused && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="text-center animate-scale-in">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7 opacity-80">
                  <rect x="5" y="3" width="5" height="18" rx="1" />
                  <rect x="14" y="3" width="5" height="18" rx="1" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">Game Paused</h2>
              {pausedByName && (
                <p className="text-white/50 text-sm mb-6">Paused by {pausedByName}</p>
              )}
              <button
                onClick={resumeGame}
                className="btn-primary"
              >
                Resume
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  if (screen === 'results' && standings && playerId) {
    return (
      <>
        {connectionBadge}
        <Results
          standings={standings}
          roundNumber={roundNumber}
          roundHistory={roundHistory}
          myPlayerId={playerId}
          isHost={isHost}
          onRematch={requestRematch}
          onLeave={leaveRoom}
        />
      </>
    );
  }

  return (
    <>
      {connectionBadge}
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-stone-100 mb-3">
            <span className="text-2xl">🍎</span>
          </div>
          <div className="text-stone-400 text-sm">Loading...</div>
        </div>
      </div>
    </>
  );
}
