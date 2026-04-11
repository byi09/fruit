import { useEffect, useRef, useCallback } from 'react';
import { socket } from '../socket';

const SYNC_ROUNDS = 5;

let globalOffset = 0;
let synced = false;

export function serverNow(): number {
  return Date.now() + globalOffset;
}

export function useServerTime() {
  const syncedRef = useRef(synced);

  const runSync = useCallback(() => {
    const offsets: number[] = [];
    let round = 0;

    function ping() {
      const clientSendTime = Date.now();
      socket.emit('time:sync', { clientSendTime }, (res) => {
        const clientReceiveTime = Date.now();
        const rtt = clientReceiveTime - res.clientSendTime;
        const offset = res.serverTime - (res.clientSendTime + rtt / 2);
        offsets.push(offset);
        round++;

        if (round < SYNC_ROUNDS) {
          setTimeout(ping, 50);
        } else {
          offsets.sort((a, b) => a - b);
          globalOffset = offsets[Math.floor(offsets.length / 2)];
          synced = true;
          syncedRef.current = true;
        }
      });
    }

    ping();
  }, []);

  useEffect(() => {
    function onConnect() {
      runSync();
    }

    if (socket.connected) {
      runSync();
    }

    socket.on('connect', onConnect);
    return () => {
      socket.off('connect', onConnect);
    };
  }, [runSync]);

  return { serverNow };
}
