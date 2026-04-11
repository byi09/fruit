import { useEffect } from 'react';
import { useSocket } from './hooks/useSocket';
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
    startGame,
    submitMove,
    requestRematch,
  } = useGame(setScreen);
  const { messages, sendMessage, unreadCount, markVisible } = useChat();

  // Mark chat visible when on playing screen
  useEffect(() => {
    markVisible(screen === 'playing');
  }, [screen, markVisible]);

  // Only show connection badge when disconnected
  const connectionBadge = !isConnected ? (
    <div className="fixed top-3 right-3 z-40">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-700 animate-pulse">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        Reconnecting...
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
        <div className="min-h-screen p-2 sm:p-4">
          {/* Top bar */}
          <div className="max-w-7xl mx-auto mb-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Score</div>
                  <div className="text-2xl font-extrabold text-emerald-600 tabular-nums">
                    {myScore}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Moves</div>
                  <div className="text-2xl font-extrabold text-gray-700 tabular-nums">
                    {myMoves}
                  </div>
                </div>
              </div>
              <Timer endsAt={endsAt} />
              <div className="text-sm text-gray-400">
                Room {roomState.code}
              </div>
            </div>
          </div>

          {/* 3-column game area */}
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-4">
            {/* Left: Chat */}
            <div className="lg:w-72 lg:min-h-[500px] flex flex-col order-2 lg:order-1">
              <Chat messages={messages} onSend={sendMessage} myPlayerId={playerId} />
            </div>

            {/* Center: Board */}
            <div className="flex-1 order-1 lg:order-2">
              <GameBoard board={board} config={config} onMove={submitMove} />
            </div>

            {/* Right: Leaderboard + Stats */}
            <div className="lg:w-64 space-y-4 order-3">
              <Leaderboard
                roomState={roomState}
                scores={scores}
                myPlayerId={playerId}
                myScore={myScore}
                myMoves={myMoves}
              />
              <PlayerStats score={myScore} moves={myMoves} totalCells={totalCells} />
            </div>
          </div>
        </div>
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

  // Fallback loading state
  return (
    <>
      {connectionBadge}
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🍎</div>
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    </>
  );
}
