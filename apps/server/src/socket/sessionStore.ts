/**
 * In-memory session store mapping session tokens to player/room identity.
 * Used for reconnection after disconnect.
 */
export interface SessionInfo {
  roomCode: string;
  playerId: string;
}

export class SessionStore {
  private sessions = new Map<string, SessionInfo>();

  set(token: string, info: SessionInfo): void {
    this.sessions.set(token, info);
  }

  get(token: string): SessionInfo | undefined {
    return this.sessions.get(token);
  }

  delete(token: string): void {
    this.sessions.delete(token);
  }

  findByPlayerId(playerId: string): { token: string; info: SessionInfo } | undefined {
    for (const [token, info] of this.sessions) {
      if (info.playerId === playerId) return { token, info };
    }
    return undefined;
  }

  deleteByRoomCode(roomCode: string): void {
    for (const [token, info] of this.sessions) {
      if (info.roomCode === roomCode) {
        this.sessions.delete(token);
      }
    }
  }
}
