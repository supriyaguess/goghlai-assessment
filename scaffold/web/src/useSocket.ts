import { useCallback, useEffect, useRef, useState } from 'react';
import type { Frame, Subscribe } from './types';

const MIN_DELAY = 1000;
const MAX_DELAY = 10000;

export function useSocket(workspace: string) {
  const listeners = useRef(new Set<(frame: Frame) => void>());
  const [connected, setConnected] = useState(false);
  const [epoch, setEpoch] = useState(0);

  const subscribe = useCallback<Subscribe>((listener) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  useEffect(() => {
    let lastSeq = 0;
    let delay = MIN_DELAY;
    let socket: WebSocket | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    function connect() {
      const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
      const query = new URLSearchParams({ workspace });
      if (lastSeq > 0) query.set('after', String(lastSeq));
      const ws = new WebSocket(`${scheme}://${location.host}/ws?${query}`);
      socket = ws;

      ws.onopen = () => {
        delay = MIN_DELAY;
        setConnected(true);
        setEpoch((n) => n + 1);
      };

      ws.onmessage = (event) => {
        let frame: Frame;
        try {
          frame = JSON.parse(String(event.data));
        } catch {
          return;
        }
        if (typeof frame.seq !== 'number' || frame.seq <= lastSeq) return;
        lastSeq = frame.seq;
        listeners.current.forEach((listener) => listener(frame));
      };

      ws.onclose = () => {
        if (stopped) return;
        setConnected(false);
        timer = setTimeout(connect, delay);
        delay = Math.min(delay * 2, MAX_DELAY);
      };
    }

    connect();
    return () => {
      stopped = true;
      clearTimeout(timer);
      socket?.close();
      setConnected(false);
    };
  }, [workspace]);

  return { connected, epoch, subscribe };
}
