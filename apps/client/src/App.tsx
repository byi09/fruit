import { useEffect, useRef, useState } from 'react';
import { useSocket } from './hooks/useSocket';
import { useServerTime } from './hooks/useServerTime';
import { useRoom } from './hooks/useRoom';
import { useGame } from './hooks/useGame';
import { useChat } from './hooks/useChat';
import { Home } from './components/Home';
import { Lobby } from './components/Lobby';
import { Countdown } from './components/Countdown';
import { GameBoard } from './components/GameBoard';
import { BoardSwitcher } from './components/BoardSwitcher';
import { Timer } from './components/Timer';
import { Leaderboard } from './components/Leaderboard';
import { Results } from './components/Results';
import { Chat } from './components/Chat';
import { PlayerStats } from './components/PlayerStats';
import { ThemeToggle } from './components/ThemeToggle';

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
    isSpectator,
    createRoom,
    joinRoom,
    leaveRoom,
    updateConfig,
    consumeInitialBoards,
  } = useRoom();
  const {
    board,
    viewedBoard,
    viewedPlayerId,
    setViewedPlayerId,
    seed,
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
  } = useGame(setScreen, { isSpectator, roomState, consumeInitialBoards });
  const { messages, sendMessage, unreadCount: _unreadCount, markVisible } = useChat();

  useEffect(() => {
    markVisible(screen === 'playing');
  }, [screen, markVisible]);

  // Streak tracking: score-delta-based. Reset on round change.
  const [streak, setStreak] = useState(0);
  const prevScoreRef = useRef(myScore);
  const prevRoundRef = useRef(roundNumber);
  useEffect(() => {
    if (prevRoundRef.current !== roundNumber) {
      setStreak(0);
      prevScoreRef.current = myScore;
      prevRoundRef.current = roundNumber;
      return;
    }
    if (myScore > prevScoreRef.current) {
      setStreak((s) => s + 1);
    }
    prevScoreRef.current = myScore;
  }, [myScore, roundNumber]);

  // Score-kick animation trigger: key swaps on each score change.
  const scoreKickKey = useRef(0);
  if (prevScoreRef.current !== myScore) {
    scoreKickKey.current += 1;
  }

  const connectionBadge = !isConnected ? (
    <div className="fixed top-3 right-3 z-[60]">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-accent/10 text-accent backdrop-blur-sm border border-accent/30 animate-pulse">
        <div className="w-1.5 h-1.5 rounded-full bg-accent" />
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
          onUpdateConfig={updateConfig}
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

  const playingBoard = isSpectator ? viewedBoard : board;
  if (screen === 'playing' && playingBoard && config && endsAt && roomState && playerId) {
    const totalCells = config.rows * config.cols;
    const viewedPlayer = viewedPlayerId ? roomState.players[viewedPlayerId] : null;
    return (
      <>
        {connectionBadge}
        <div className="min-h-screen bg-bg text-text">
          {/* HUD */}
          <div
            className="sticky top-0 z-50 h-[58px] px-4 sm:px-6 border-b border-border"
            style={{ background: 'var(--hud-bg)', backdropFilter: 'blur(24px)' }}
          >
            <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
              {/* Left */}
              {isSpectator ? (
                <div>
                  <div className="label-eyebrow">Spectating</div>
                  <div className="font-display text-lg font-bold text-text leading-tight">
                    {viewedPlayer?.name ?? '—'}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="flex items-baseline gap-4">
                    <span
                      key={scoreKickKey.current}
                      className="font-display text-[30px] font-extrabold tabular-nums text-text leading-none animate-score-kick inline-block"
                    >
                      {myScore}
                    </span>
                    <span className="w-px h-[26px] bg-border" />
                    <span className="font-display text-[20px] font-bold tabular-nums text-text-2 leading-none">
                      {myMoves}
                    </span>
                  </div>
                  {streak >= 2 && (
                    <span
                      className="inline-flex items-center gap-1 font-display font-bold rounded-full border"
                      style={{
                        fontSize: 11,
                        padding: '3px 10px',
                        background: 'rgba(245,158,11,0.1)',
                        borderColor: 'rgba(245,158,11,0.25)',
                        color: 'var(--gold)',
                      }}
                    >
                      🔥 ×{streak}
                    </span>
                  )}
                </div>
              )}

              {/* Center */}
              <Timer endsAt={endsAt} isPaused={isPaused} durationMs={config.durationMs} />

              {/* Right */}
              <div className="flex items-center gap-2">
                <ThemeToggle />
                {!isSpectator && (
                  <button
                    onClick={isPaused ? resumeGame : pauseGame}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                               bg-panel hover:bg-panel-hover text-text-2 hover:text-text border border-border hover:border-border-bright"
                    title={isPaused ? 'Resume game' : 'Pause game'}
                  >
                    {isPaused ? (
                      <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><polygon points="4,2 14,8 4,14" /></svg>
                    ) : (
                      <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><rect x="3" y="2" width="3.5" height="12" rx="0.5" /><rect x="9.5" y="2" width="3.5" height="12" rx="0.5" /></svg>
                    )}
                    <span className="hidden sm:inline">{isPaused ? 'Resume' : 'Pause'}</span>
                  </button>
                )}
                <span
                  className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-lg font-display text-xs bg-panel border border-border text-text-3"
                  style={{ letterSpacing: '0.14em' }}
                >
                  {roomState.code}
                </span>
              </div>
            </div>
          </div>

          {/* Game area */}
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-5">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Left: Chat */}
              <div className="lg:w-[220px] xl:w-[240px] flex flex-col order-2 lg:order-1 lg:min-h-[480px] lg:max-h-[calc(100vh-120px)]">
                <Chat messages={messages} onSend={sendMessage} myPlayerId={playerId} />
              </div>

              {/* Center: Board */}
              <div className="flex-1 order-1 lg:order-2">
                {isSpectator && (
                  <BoardSwitcher
                    players={Object.values(roomState.players)}
                    viewedPlayerId={viewedPlayerId}
                    scores={scores}
                    onSelect={setViewedPlayerId}
                  />
                )}
                {isSpectator ? (
                  <GameBoard board={playingBoard} config={config} readOnly disabled={isPaused} />
                ) : (
                  <GameBoard board={playingBoard} config={config} onMove={submitMove} disabled={isPaused} />
                )}
              </div>

              {/* Right: Leaderboard + Stats */}
              <div className="lg:w-[196px] xl:w-[220px] space-y-3 order-3">
                <Leaderboard
                  roomState={roomState}
                  scores={scores}
                  myPlayerId={playerId}
                  myScore={myScore}
                  myMoves={myMoves}
                />
                {!isSpectator && (
                  <PlayerStats score={myScore} moves={myMoves} totalCells={totalCells} startsAt={startsAt!} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pause overlay */}
        {isPaused && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
          >
            <div className="text-center animate-scale-in panel px-10 py-8">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-text-2">
                  <rect x="5" y="3" width="5" height="18" rx="1" />
                  <rect x="14" y="3" width="5" height="18" rx="1" />
                </svg>
              </div>
              <h2 className="font-display text-[28px] font-extrabold text-text mb-1">Paused</h2>
              {pausedByName && (
                <p className="text-text-3 text-sm mb-6">Paused by {pausedByName}</p>
              )}
              {!isSpectator && (
                <button onClick={resumeGame} className="btn-primary">
                  Resume
                </button>
              )}
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
          seed={seed}
          config={config}
          onRematch={requestRematch}
          onLeave={leaveRoom}
        />
      </>
    );
  }

  return (
    <>
      {connectionBadge}
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center animate-fade-in">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 animate-glow-pulse"
            style={{
              background: 'linear-gradient(135deg, rgba(233,69,96,0.18), rgba(233,69,96,0.08))',
              border: '1px solid rgba(233,69,96,0.3)',
            }}
          >
            <span className="text-2xl">🍎</span>
          </div>
          <div className="text-text-3 text-sm">Loading...</div>
        </div>
      </div>
    </>
  );
}
