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
    await sdk.commands.openActivityInstanceChannel?.({ channel: 'rpm-sync' });
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
          sdk.commands.sendActivityInstanceActivity?.({ channel: 'rpm-sync', data: JSON.stringify(data) });
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


