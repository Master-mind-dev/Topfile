import { useEffect, useRef } from 'react';
import { NoteItem, UploadedImageItem, LinkItem } from '../types';
import { formatNote, formatImage, formatLink } from '../lib/api';

export interface SyncHandlers {
  onNoteCreated?: (note: NoteItem) => void;
  onNoteUpdated?: (note: NoteItem) => void;
  onNoteDeleted?: (id: string) => void;
  onImageCreated?: (image: UploadedImageItem) => void;
  onImageDeleted?: (id: string) => void;
  onLinkCreated?: (link: LinkItem) => void;
  onLinkDeleted?: (id: string) => void;
}

export function useRealtimeSync(
  isAuthenticated: boolean,
  handlers: SyncHandlers
) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryDelay = useRef(1000);
  const handlersRef = useRef<SyncHandlers>(handlers);

  // Keep latest handlers ref without reconnecting socket
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem('ownly_auth_token');
    if (!token) return;

    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // Authenticate the WebSocket connection
        ws.send(JSON.stringify({ type: 'auth', token }));
        retryDelay.current = 1000; // reset backoff on success

        // Keep-alive ping every 25s
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 25_000);
        (ws as any).__pingInterval = pingInterval;
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          switch (msg.type) {
            case 'note_created':
              handlersRef.current.onNoteCreated?.(formatNote(msg.note));
              break;
            case 'note_updated':
              handlersRef.current.onNoteUpdated?.(formatNote(msg.note));
              break;
            case 'note_deleted':
              handlersRef.current.onNoteDeleted?.(msg.id);
              break;
            case 'image_created':
              handlersRef.current.onImageCreated?.(formatImage(msg.image));
              break;
            case 'image_deleted':
              handlersRef.current.onImageDeleted?.(msg.id);
              break;
            case 'link_created':
              handlersRef.current.onLinkCreated?.(formatLink(msg.link));
              break;
            case 'link_deleted':
              handlersRef.current.onLinkDeleted?.(msg.id);
              break;
          }
        } catch { /* ignore parse errors */ }
      };

      ws.onclose = () => {
        clearInterval((ws as any).__pingInterval);
        // Reconnect with exponential backoff (max 30s)
        retryDelay.current = Math.min(retryDelay.current * 1.5, 30_000);
        reconnectTimer.current = setTimeout(connect, retryDelay.current);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        clearInterval((wsRef.current as any).__pingInterval);
        wsRef.current.onclose = null; // prevent auto-reconnect on unmount
        wsRef.current.close();
      }
    };
  }, [isAuthenticated]);
}
