import React from 'react';
import { RaceSnapshot } from '../controller/raceController';
import { Gear } from '../game/types';
import { Button } from './components/Button';
import { CardHeader } from './components/Card';

export default function LegView({ snap, meId, onRoll, onHold, onShift }:
  { snap: RaceSnapshot; meId: string; onRoll: () => void; onHold: () => void; onShift: (d: -1 | 1) => void; }) {
  const leg = snap.leg!;
  const me = snap.players[meId];
  const canShift = me && me.rollHistory.length > 0 && !me.isHeld && !me.hasOvershot;
  const canRoll = me && !me.isHeld && !me.hasOvershot && me.rollsRemaining > 0 && !me.mustShift;
  return (
    <div>
      <CardHeader title={`Leg ${snap.legIndex + 1}/${snap.maxLegs} — ${leg.name}`} subtitle={`Target ${leg.targetDistance} • Weather ${leg.weather} • Time ${snap.timeRemainingSec}s ${leg.isPoliceRaid ? '• 🚨 Raid' : ''}`} />
      <div className="flex flex-wrap gap-2 mb-2">
        <Button onClick={() => onShift(-1)} disabled={!canShift || me.currentGear === Gear.FIRST} variant="secondary">Shift Down</Button>
        <Button onClick={onRoll} disabled={!canRoll}>{`Roll${me?.mustShift ? ' (Shift)' : ''}`}</Button>
        <Button onClick={() => onShift(1)} disabled={!canShift || me.currentGear === Gear.FIFTH} variant="secondary">Shift Up</Button>
        <Button onClick={onHold} disabled={!me || me.isHeld || me.hasOvershot} variant="ghost">Hold</Button>
      </div>
      <div className="mt-3">
        <div className="font-semibold mb-1">Leaderboard (Live)</div>
        <ol className="space-y-1">
          {snap.scoreboard.map(s => {
            const p = snap.players[s.id];
            return (
              <li key={s.id} className="flex items-center justify-between bg-slate-800/40 rounded-lg px-3 py-2">
                <span>{p?.username ?? s.id}</span>
                <span className="text-sm opacity-80">{p?.totalDistance ?? 0}/{leg.targetDistance} • {p?.isHeld ? 'Held' : p?.hasOvershot ? 'Overshot' : 'Rolling'}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}


