import * as Ably from 'ably';
import { SyncTransport } from './transport';

export function createAblyTransport(apiKey: string, channelName: string): SyncTransport {
  const client = new Ably.Realtime(apiKey);
  const channel = client.channels.get(channelName);
  const listeners: Array<(d: unknown) => void> = [];
  channel.subscribe('msg', (m) => {
    try {
      const payload = typeof m.data === 'string' ? JSON.parse(m.data) : m.data;
      listeners.forEach(l => l(payload));
    } catch {}
  });
  return {
    onMessage(cb) { listeners.push(cb); },
    send(data: unknown) { channel.publish('msg', JSON.stringify(data)); },
    close() { try { channel.detach(); client.close(); } catch {} }
  };
}


