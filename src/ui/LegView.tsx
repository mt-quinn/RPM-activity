import React from 'react';
import { RaceSnapshot } from '../controller/raceController';
import { Gear } from '../game/types';

export default function LegView({ snap, meId, onRoll, onHold, onShift }:
  { snap: RaceSnapshot; meId: string; onRoll: () => void; onHold: () => void; onShift: (d: -1 | 1) => void; }) {
  const leg = snap.leg!;
  const me = snap.players[meId];
  const canShift = me && me.rollHistory.length > 0 && !me.isHeld && !me.hasOvershot;
  const canRoll = me && !me.isHeld && !me.hasOvershot && me.rollsRemaining > 0;
  return (
    <div>
      <h3>Leg {snap.legIndex + 1}/{snap.maxLegs} — {leg.name}</h3>
      <div>Target {leg.targetDistance} — Weather {leg.weather} — Time {snap.timeRemainingSec}s</div>
      <div style={{ marginTop: 8 }}>
        <button onClick={() => onShift(-1)} disabled={!canShift || me.currentGear === Gear.FIRST}>Shift Down</button>
        <button onClick={onRoll} disabled={!canRoll} style={{ margin: '0 8px' }}>Roll</button>
        <button onClick={() => onShift(1)} disabled={!canShift || me.currentGear === Gear.FIFTH}>Shift Up</button>
        <button onClick={onHold} disabled={!me || me.isHeld || me.hasOvershot} style={{ marginLeft: 8 }}>Hold</button>
      </div>
      <div style={{ marginTop: 8 }}>
        <strong>Players</strong>
        <ul>
          {Object.values(snap.players).map(p => (
            <li key={p.id}>{p.username}: {p.totalDistance}/{leg.targetDistance} {p.isHeld ? '🟢' : p.hasOvershot ? '🔴' : '🟡'} Rolls {p.rollsRemaining}/{p.maxRollsAllowed} Gear {Gear[p.currentGear]}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}


