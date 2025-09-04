import React from 'react';
import { RaceSnapshot } from '../controller/raceController';

export default function Checkpoint({ snap, onNext }:
  { snap: RaceSnapshot; onNext: () => void; }) {
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
      <button onClick={onNext}>Skip Timer (host)</button>
    </div>
  );
}


