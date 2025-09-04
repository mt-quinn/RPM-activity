import React from 'react';
import { RaceSnapshot } from '../controller/raceController';

export default function Checkpoint({ snap, onNext, onRepair, meId }:
  { snap: RaceSnapshot; onNext: () => void; onRepair: () => void; meId: string; }) {
  const leg = snap.leg;
  return (
    <div>
      <h3>Checkpoint — Next in {snap.timeRemainingSec}s</h3>
      <div style={{ marginTop: 8 }}>
        <strong>Scoreboard</strong>
        <ul>
          {snap.scoreboard.map(s => (
            <li key={s.id}>{s.id}: {s.points} pts</li>
          ))}
        </ul>
      </div>
      <div style={{ marginTop: 8 }}>
        <button onClick={onRepair}>Repair my car</button>
        <button onClick={onNext} style={{ marginLeft: 8 }}>Skip Timer (host)</button>
      </div>
    </div>
  );
}


