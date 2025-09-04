import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { type DiscordUser } from '../sdk/discord';
import { authenticate, initDiscordSdk } from '../sdk/discord';
import { RaceController } from '../controller/raceController';
import { Phase } from '../controller/types';
import Lobby from './Lobby';
import LegView from './LegView';
import Checkpoint from './Checkpoint';
import { createDiscordInstanceTransport } from '../sync/transport';
import type { Intent, SnapshotMsg } from '../sync/protocol';

export default function App() {
  const [ready, setReady] = useState(false);
  const [participants, setParticipants] = useState<DiscordUser[]>([]);
  const [instanceId, setInstanceId] = useState<string>('');
  const [meId, setMeId] = useState<string>('me');
  const [ctrl, setCtrl] = useState<RaceController | null>(null);
  const [snap, setSnap] = useState(() => null as ReturnType<RaceController['getSnapshot']> | null);
  const [seed, setSeed] = useState<number>(() => Math.floor(Math.random() * 1e9));
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    let disposed = false;
    (async () => {
      const sdk = await initDiscordSdk('1413218482954440766');
      if (disposed) return;
      setReady(true);
      const me = await authenticate(sdk);
      const myId = me?.id ?? 'me';
      const myName = me?.username ?? 'Player';
      setMeId(myId);
      const c = new RaceController(myId, (() => {
        let s = 1234567;
        return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; };
      })());
      c.addParticipant(myId, myName);
      setCtrl(c);
      setSnap(c.getSnapshot());
      // Host election: lowest user ID among instance users (fallback me)
      const users = (await (sdk as any).commands.getInstanceConnectedUsers?.())?.users ?? [];
      const ids: string[] = [...users.map((u: any) => u.id), myId].filter(Boolean).sort();
      const hostId = ids[0] ?? myId;
      const amHost = hostId === myId;
      setIsHost(amHost);

      const transport = await createDiscordInstanceTransport(sdk);
      let seq = 0;
      const broadcast = () => {
        if (!amHost) return;
        const state = c.getSnapshot();
        seq += 1;
        const msg: SnapshotMsg = { t: 'snapshot', v: seq, state };
        transport.send(msg);
      };

      // Listen for intents and snapshots
      transport.onMessage((m: any) => {
        if (!m || typeof m !== 'object') return;
        if ((m as SnapshotMsg).t === 'snapshot') {
          setSnap((m as SnapshotMsg).state);
          return;
        }
        if (!amHost) return;
        const intent = m as Intent;
        switch (intent.t) {
          case 'join':
            c.addParticipant(intent.id, intent.name);
            break;
          case 'ready':
            c.setReady(intent.id, intent.ready);
            break;
          case 'host-start':
            c.startIfAllReady();
            break;
          case 'roll':
            c.roll(intent.id);
            break;
          case 'hold':
            c.hold(intent.id);
            break;
          case 'shift':
            c.shift(intent.id, intent.d);
            break;
          case 'repair':
            c.repair(intent.id);
            break;
        }
        setSnap(c.getSnapshot());
        broadcast();
      });

      // Host tick loop
      const t = window.setInterval(() => {
        if (amHost) {
          c.tickOneSecond();
          setSnap(c.getSnapshot());
          broadcast();
        }
      }, 1000);

      // Announce join
      transport.send({ t: 'join', id: myId, name: myName } as Intent);

      return () => { window.clearInterval(t); transport.close(); };
    })();
    return () => { disposed = true; };
  }, []);

  const rng = useMemo(() => {
    // Deterministic per instance seed to keep the demo fixed across re-renders
    let s = seed;
    return () => {
      // xorshift32
      s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
      return ((s >>> 0) % 100000) / 100000;
    };
  }, [seed]);

  const snapshot = snap;

  return (
    <div className="min-h-screen px-4 py-3">
      <header className="flex items-center justify-between">
        <h2 className="text-xl font-bold">RPM: Rally Premiere Marathon</h2>
        <span className="stat">{ready ? 'Connected' : 'Initializing...'} {instanceId && `| ${instanceId}`}</span>
      </header>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="md:col-span-2 space-y-3">
          <div className="card">
            {snapshot && (
              snapshot.phase === Phase.Lobby ? (
                <Lobby
                  participants={snapshot.participants}
                  ready={snapshot.participants.find(p => p.id === meId)?.ready ?? false}
                  onToggleReady={() => {
                    const next = !(snapshot.participants.find(p => p.id === meId)?.ready);
                    if (isHost && ctrl) { ctrl.setReady(meId, next); setSnap(ctrl.getSnapshot()); }
                    else (window as any).rpmTransport?.send?.({ t: 'ready', id: meId, ready: next } as Intent);
                  }}
                  onStart={() => {
                    if (isHost && ctrl) { ctrl.startIfAllReady(); setSnap(ctrl.getSnapshot()); }
                    else (window as any).rpmTransport?.send?.({ t: 'host-start' } as Intent);
                  }}
                />
              ) : snapshot.phase === Phase.Leg ? (
                <LegView
                  snap={snapshot}
                  meId={meId}
                  onRoll={() => { if (isHost && ctrl) { ctrl.roll(meId); setSnap(ctrl.getSnapshot()); } else (window as any).rpmTransport?.send?.({ t: 'roll', id: meId } as Intent); }}
                  onHold={() => { if (isHost && ctrl) { ctrl.hold(meId); setSnap(ctrl.getSnapshot()); } else (window as any).rpmTransport?.send?.({ t: 'hold', id: meId } as Intent); }}
                  onShift={(d) => { if (isHost && ctrl) { ctrl.shift(meId, d); setSnap(ctrl.getSnapshot()); } else (window as any).rpmTransport?.send?.({ t: 'shift', id: meId, d } as Intent); }}
                />
              ) : snapshot.phase === Phase.Checkpoint ? (
                <Checkpoint
                  snap={snapshot}
                  meId={meId}
                  onRepair={() => { if (isHost && ctrl) { ctrl.repair(meId); setSnap(ctrl.getSnapshot()); } else (window as any).rpmTransport?.send?.({ t: 'repair', id: meId } as Intent); }}
                  onNext={() => { if (isHost && ctrl) { ctrl.tickOneSecond(); setSnap(ctrl.getSnapshot()); } else (window as any).rpmTransport?.send?.({ t: 'host-start' } as Intent); }}
                />
              ) : (
                <div>Game Over. Thanks for playing!</div>
              )
            )}
          </div>
        </div>
        <div className="space-y-3">
          <div className="card">
            <div className="font-semibold mb-2">Participants</div>
            <ul className="text-sm opacity-80 list-disc list-inside">
              {snapshot?.participants.map(p => (
                <li key={p.id}>{p.name} {p.ready ? '✅' : '⏳'}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}


