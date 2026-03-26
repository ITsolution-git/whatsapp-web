const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'ws://localhost:3002';

let ws: WebSocket | null = null;
let reconnectToken: string | null = null;
let reconnectDeviceId: string | null = null;
const listeners: Map<string, ((data: unknown) => void)[]> = new Map();
const openListeners: (() => void)[] = [];
const pendingMessages: string[] = [];

export function connectSocket(token: string, deviceId: string) {
  reconnectToken = token;
  reconnectDeviceId = deviceId;
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

  ws = new WebSocket(`${SOCKET_URL}?token=${token}&deviceId=${deviceId}`);

  ws.onopen = () => {
    console.log('[Socket] Connected');
    while (pendingMessages.length > 0) {
      ws!.send(pendingMessages.shift()!);
    }
    openListeners.forEach((fn) => fn());
  };

  ws.onmessage = (event) => {
    try {
      const { event: evtName, data } = JSON.parse(event.data);
      const handlers = listeners.get(evtName) || [];
      handlers.forEach((h) => h(data));
    } catch (e) {
      console.error('[Socket] Parse error', e);
    }
  };

  ws.onclose = () => {
    console.log('[Socket] Disconnected');
    ws = null;
    if (reconnectToken && reconnectDeviceId) {
      setTimeout(() => connectSocket(reconnectToken!, reconnectDeviceId!), 3000);
    }
  };

  ws.onerror = (e) => {
    console.error('[Socket] Error', e);
  };
}

export function disconnectSocket() {
  reconnectToken = null;
  reconnectDeviceId = null;
  ws?.close();
  ws = null;
}

export function on(event: string, handler: (data: unknown) => void) {
  if (!listeners.has(event)) listeners.set(event, []);
  listeners.get(event)!.push(handler);
}

export function off(event: string, handler: (data: unknown) => void) {
  const arr = listeners.get(event) || [];
  listeners.set(event, arr.filter((h) => h !== handler));
}

export function onOpen(fn: () => void): () => void {
  openListeners.push(fn);
  return () => {
    const i = openListeners.indexOf(fn);
    if (i >= 0) openListeners.splice(i, 1);
  };
}

export function send(event: string, data: unknown) {
  const msg = JSON.stringify({ event, data });
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(msg);
  } else {
    pendingMessages.push(msg);
  }
}
