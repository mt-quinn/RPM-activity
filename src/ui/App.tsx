import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { type DiscordUser } from '../sdk/discord';
import { initDiscordSdk, getInstanceConnectedUsers, getInstanceId } from '../sdk/discord';
import { generateLeg } from '../game/race';
import SingleLegDemo from './SingleLegDemo';

export default function App() {
  const [ready, setReady] = useState(false);
  const [participants, setParticipants] = useState<DiscordUser[]>([]);
  const [instanceId, setInstanceId] = useState<string>('');
  const [seed, setSeed] = useState<number>(() => Math.floor(Math.random() * 1e9));

  useEffect(() => {
    let disposed = false;
    (async () => {
      const sdk = await initDiscordSdk('1413218482954440766');
      if (disposed) return;
      setReady(true);
      const users = await getInstanceConnectedUsers(sdk);
      const inst = await getInstanceId(sdk);
      if (disposed) return;
      setParticipants(users);
      setInstanceId(inst ?? '');
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

  const demoLeg = useMemo(() => generateLeg(0, rng), [rng]);

  return (
    <div style={{ padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <h2>RPM: Rally Premiere Marathon (Embedded)</h2>
      <div style={{ fontSize: 12, opacity: 0.8 }}>
        {ready ? 'SDK ready' : 'Initializing...'} {instanceId && `| Instance ${instanceId}`}
      </div>

      {/* Self user display can be added once we add identity fetch. */}
      <div style={{ marginTop: 8 }}>
        <strong>Participants:</strong>
        <ul>
          {participants.map(p => (
            <li key={p.id}>{p.username}#{p.discriminator}</li>
          ))}
        </ul>
      </div>

      <SingleLegDemo leg={demoLeg} />
    </div>
  );
}


