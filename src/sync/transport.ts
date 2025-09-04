export interface SyncTransport {
  send(data: unknown): void;
  onMessage(cb: (data: unknown) => void): void;
  close(): void;
}

export class NoopTransport implements SyncTransport {
  onMessage() {}
  send() {}
  close() {}
}

export async function createDiscordInstanceTransport(sdk: any): Promise<SyncTransport> {
  try {
    // Try to open a shared channel for this activity instance
    const openFn = sdk.commands.openActivityInstanceChannel || sdk.commands.openEmbeddedActivityInstanceChannel;
    if (!openFn) throw new Error('instance channel open not supported');
    await openFn({ channel: 'rpm-sync' });
    const listeners: Array<(d: unknown) => void> = [];
    const unsub = sdk.subscribe?.('ACTIVITY_INSTANCE_CHANNEL_MESSAGE_CREATE', (e: any) => {
      try {
        if (!e || !e.data) return;
        const payload = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        listeners.forEach(l => l(payload));
      } catch {}
    });
    const api: SyncTransport = {
      onMessage(cb) { listeners.push(cb); },
      send(data: unknown) {
        try {
          const payload = { channel: 'rpm-sync', data: JSON.stringify(data) };
          const senders = [
            sdk.commands.sendActivityInstanceMessage,
            sdk.commands.sendActivityInstanceActivity,
            sdk.commands.sendEmbeddedActivityInstanceMessage
          ].filter(Boolean);
          if (senders.length === 0) throw new Error('no instance message sender');
          // Try first available sender
          senders[0](payload);
        } catch {}
      },
      close() { try { unsub?.(); } catch {} }
    };
    (window as any).rpmTransport = api;
    return api;
  } catch {
    return new NoopTransport();
  }
}


