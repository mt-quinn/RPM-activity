import * as Ably from 'ably';

export function setupAblyPresence(apiKey: string, channelName: string, selfId: string, name: string, onPresence: (id: string, name: string, action: 'enter'|'update'|'leave') => void) {
  const client = new Ably.Realtime(apiKey);
  const channel = client.channels.get(channelName);
  const handler = (msg: Ably.Types.PresenceMessage) => {
    try {
      const data = (typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data) as { id?: string; name?: string } | undefined;
      const id = data?.id || msg.clientId || 'unknown';
      const display = data?.name || 'Player';
      onPresence(id, display, msg.action as any);
    } catch {}
  };
  channel.presence.subscribe('enter', handler);
  channel.presence.subscribe('update', handler);
  channel.presence.subscribe('leave', handler);
  channel.presence.enter(JSON.stringify({ id: selfId, name }));
  return () => {
    try { channel.presence.leave(); } catch {}
    try { channel.detach(); } catch {}
    try { client.close(); } catch {}
  };
}


