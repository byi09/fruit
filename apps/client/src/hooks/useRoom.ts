import { useState, useCallback, useEffect } from 'react';
import type { Board, RoomState, PlayerState } from '@fruitbox/shared';
import { socket } from '../socket';

export type Screen = 'home' | 'lobby' | 'countdown' | 'playing' | 'results';

export function useRoom() {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>('home');
  const [error, setError] = useState<string | null>(null);
  const [initialBoards, setInitialBoards] = useState<Record<string, Board> | null>(null);

  // Try reconnect on mount
  useEffect(() => {
    const token = sessionStorage.getItem('fruitbox_session');
    if (token) {
      socket.emit('room:reconnect', { sessionToken: token }, (res) => {
        if (res.ok) {
          setSessionToken(token);
          setPlayerId(res.playerId);
          setRoomState(res.roomState);
          if (res.boards) setInitialBoards(res.boards);

          const status = res.roomState.status;
          if (status === 'lobby') setScreen('lobby');
          else if (status === 'countdown') setScreen('countdown');
          else if (status === 'playing') setScreen('playing');
          else if (status === 'finished') setScreen('results');
        } else {
          sessionStorage.removeItem('fruitbox_session');
        }
      });
    }
  }, []);

  // Socket event listeners
  useEffect(() => {
    function onRoomState(state: RoomState) {
      setRoomState(state);
      if (state.status === 'lobby') setScreen('lobby');
    }

    function onPlayerJoined(player: PlayerState) {
      setRoomState((prev) => {
        if (!prev) return prev;
        return { ...prev, players: { ...prev.players, [player.id]: player } };
      });
    }

    function onPlayerLeft({ playerId: pid }: { playerId: string }) {
      setRoomState((prev) => {
        if (!prev) return prev;
        const players = { ...prev.players };
        delete players[pid];
        return { ...prev, players };
      });
    }

    function onPlayerDisconnected({ playerId: pid }: { playerId: string }) {
      setRoomState((prev) => {
        if (!prev) return prev;
        const players = { ...prev.players };
        if (players[pid]) {
          players[pid] = { ...players[pid], connected: false };
        }
        return { ...prev, players };
      });
    }

    function onPlayerReconnected({ playerId: pid }: { playerId: string }) {
      setRoomState((prev) => {
        if (!prev) return prev;
        const players = { ...prev.players };
        if (players[pid]) {
          players[pid] = { ...players[pid], connected: true };
        }
        return { ...prev, players };
      });
    }

    function onHostChanged({ playerId: pid }: { playerId: string }) {
      setRoomState((prev) => {
        if (!prev) return prev;
        return { ...prev, hostPlayerId: pid };
      });
    }

    function onError({ message }: { message: string }) {
      setError(message);
      setTimeout(() => setError(null), 5000);
    }

    socket.on('room:state', onRoomState);
    socket.on('room:player_joined', onPlayerJoined);
    socket.on('room:player_left', onPlayerLeft);
    socket.on('room:player_disconnected', onPlayerDisconnected);
    socket.on('room:player_reconnected', onPlayerReconnected);
    socket.on('room:host_changed', onHostChanged);
    socket.on('error', onError);

    return () => {
      socket.off('room:state', onRoomState);
      socket.off('room:player_joined', onPlayerJoined);
      socket.off('room:player_left', onPlayerLeft);
      socket.off('room:player_disconnected', onPlayerDisconnected);
      socket.off('room:player_reconnected', onPlayerReconnected);
      socket.off('room:host_changed', onHostChanged);
      socket.off('error', onError);
    };
  }, []);

  const createRoom = useCallback((playerName: string) => {
    setError(null);
    socket.emit('room:create', { playerName }, (res) => {
      if (res.ok) {
        setPlayerId(res.playerId);
        setSessionToken(res.sessionToken);
        setRoomState(res.roomState);
        setScreen('lobby');
        sessionStorage.setItem('fruitbox_session', res.sessionToken);
      } else {
        setError(res.error);
      }
    });
  }, []);

  const joinRoom = useCallback((roomCode: string, playerName: string) => {
    setError(null);
    socket.emit('room:join', { roomCode: roomCode.toUpperCase(), playerName }, (res) => {
      if (res.ok) {
        setPlayerId(res.playerId);
        setSessionToken(res.sessionToken);
        setRoomState(res.roomState);
        setScreen('lobby');
        sessionStorage.setItem('fruitbox_session', res.sessionToken);
      } else {
        setError(res.error);
      }
    });
  }, []);

  const spectateRoom = useCallback((roomCode: string, playerName: string) => {
    setError(null);
    socket.emit(
      'room:join',
      { roomCode: roomCode.toUpperCase(), playerName, asSpectator: true },
      (res) => {
        if (res.ok) {
          setPlayerId(res.playerId);
          setSessionToken(res.sessionToken);
          setRoomState(res.roomState);
          if (res.boards) setInitialBoards(res.boards);
          sessionStorage.setItem('fruitbox_session', res.sessionToken);

          const status = res.roomState.status;
          if (status === 'lobby') setScreen('lobby');
          else if (status === 'countdown') setScreen('countdown');
          else if (status === 'playing') setScreen('playing');
          else if (status === 'finished') setScreen('results');
          else setScreen('lobby');
        } else {
          setError(res.error);
        }
      },
    );
  }, []);

  const consumeInitialBoards = useCallback(() => {
    const b = initialBoards;
    if (b) setInitialBoards(null);
    return b;
  }, [initialBoards]);

  const leaveRoom = useCallback(() => {
    socket.emit('room:leave');
    setRoomState(null);
    setPlayerId(null);
    setSessionToken(null);
    setInitialBoards(null);
    setScreen('home');
    sessionStorage.removeItem('fruitbox_session');
  }, []);

  const isHost = roomState?.hostPlayerId === playerId;
  const isSpectator = !!(playerId && roomState?.players[playerId]?.isSpectator);

  return {
    roomState,
    playerId,
    sessionToken,
    screen,
    setScreen,
    error,
    setError,
    isHost,
    isSpectator,
    createRoom,
    joinRoom,
    spectateRoom,
    leaveRoom,
    consumeInitialBoards,
  };
}
