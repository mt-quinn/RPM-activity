import React from 'react';
import { RaceSnapshot } from '../controller/raceController';
import { Button } from './components/Button';
import { CardHeader } from './components/Card';

export default function Checkpoint({ snap, onNext, onRepair, meId }:
  { snap: RaceSnapshot; onNext: () => void; onRepair: () => void; meId: string; }) {
  const leg = snap.leg;
  return (
    <div>
      <CardHeader title="Checkpoint" subtitle={`Next leg in ${snap.timeRemainingSec}s`} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          <div className="font-semibold mb-1">Scoreboard</div>
          <ul className="space-y-1">
            {snap.scoreboard.map(s => (
              <li key={s.id} className="flex items-center justify-between bg-slate-800/40 rounded-lg px-3 py-2">
                <span>{s.id}</span>
                <span className="text-sm opacity-80">{s.points} pts</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-2">
          <Button onClick={onRepair} variant="secondary">Repair my car</Button>
          <Button onClick={onNext} variant="ghost">Skip Timer (host)</Button>
        </div>
      </div>
    </div>
  );
}


