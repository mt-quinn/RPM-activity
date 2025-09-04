import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { type DiscordUser } from '../sdk/discord';
import { initDiscordSdk } from '../sdk/discord';
import { RaceController } from '../controller/raceController';
import { Phase } from '../controller/types';
import Lobby from './Lobby';
import LegView from './LegView';
import Checkpoint from './Checkpoint';

export default function App() {
  const [ready, setReady] = useState(false);
  const [participants, setParticipants] = useState<DiscordUser[]>([]);
  const [instanceId, setInstanceId] = useState<string>('');
  const [meId, setMeId] = useState<string>('me');
  const [ctrl, setCtrl] = useState<RaceController | null>(null);
  const [snap, setSnap] = useState(() => null as ReturnType<RaceController['getSnapshot']> | null);
  const [seed, setSeed] = useState<number>(() => Math.floor(Math.random() * 1e9));

  useEffect(() => {
    let disposed = false;
    (async () => {
      const sdk = await initDiscordSdk('1413218482954440766');
      if (disposed) return;
      setReady(true);
      // Stub identity/participants until we wire authenticate
      const myId = 'me';
      const myName = 'Player';
      setMeId(myId);
      const c = new RaceController(myId, (() => {
        let s = 1234567;
        return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; };
      })());
      c.addParticipant(myId, myName);
      setCtrl(c);
      setSnap(c.getSnapshot());
      const t = window.setInterval(() => {
        c.tickOneSecond();
        setSnap(c.getSnapshot());
      }, 1000);
      return () => { window.clearInterval(t); };
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
    <div style={{ padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <h2>RPM: Rally Premiere Marathon (Embedded)</h2>
      <div style={{ fontSize: 12, opacity: 0.8 }}>
        {ready ? 'SDK ready' : 'Initializing...'} {instanceId && `| Instance ${instanceId}`}
      </div>

      {/* Self user display can be added once we add identity fetch. */}
      {snapshot && (
        snapshot.phase === Phase.Lobby ? (
          <Lobby
            participants={snapshot.participants}
            ready={snapshot.participants.find(p => p.id === meId)?.ready ?? false}
            onToggleReady={() => { if (!ctrl) return; ctrl.setReady(meId, !(snapshot.participants.find(p => p.id === meId)?.ready)); setSnap(ctrl.getSnapshot()); ctrl.startIfAllReady(); }}
            onStart={() => { if (!ctrl) return; ctrl.startIfAllReady(); setSnap(ctrl.getSnapshot()); }}
          />
        ) : snapshot.phase === Phase.Leg ? (
          <LegView
            snap={snapshot}
            meId={meId}
            onRoll={() => { if (!ctrl) return; ctrl.roll(meId); setSnap(ctrl.getSnapshot()); }}
            onHold={() => { if (!ctrl) return; ctrl.hold(meId); setSnap(ctrl.getSnapshot()); }}
            onShift={(d) => { if (!ctrl) return; ctrl.shift(meId, d); setSnap(ctrl.getSnapshot()); }}
          />
        ) : snapshot.phase === Phase.Checkpoint ? (
          <Checkpoint
            snap={snapshot}
            meId={meId}
            onRepair={() => { if (!ctrl) return; ctrl.repair(meId); setSnap(ctrl.getSnapshot()); }}
            onNext={() => { if (!ctrl) return; ctrl.tickOneSecond(); setSnap(ctrl.getSnapshot()); }}
          />
        ) : (
          <div>Game Over. Thanks for playing!</div>
        )
      )}
    </div>
  );
}


