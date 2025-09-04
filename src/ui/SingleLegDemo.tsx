import React from 'react';
import { useMemo, useState } from 'react';
import { createInitialPlayer, performRoll, shiftDown, shiftUp } from '../game/logic';
import { Gear, RaceLeg, Weather } from '../game/types';

function useRng() {
  // Simple rng wrapper
  return useMemo(() => () => Math.random(), []);
}

export default function SingleLegDemo({ leg }: { leg: RaceLeg }) {
  const rng = useRng();
  const [player, setPlayer] = useState(() => createInitialPlayer('demo', 'You'));
  const [requiresShift, setRequiresShift] = useState(false);

  const canRoll = !player.isHeld && !player.hasOvershot && player.rollsRemaining > 0 && (!requiresShift);

  const onRoll = () => {
    const res = performRoll(player, leg, rng);
    setPlayer(res.player);
    setRequiresShift(res.requiresShiftAfter);
  };

  const onHold = () => setPlayer({ ...player, isHeld: true });
  const up = () => setPlayer(p => (setRequiresShift(false), shiftUp(p)));
  const down = () => setPlayer(p => (setRequiresShift(false), shiftDown(p)));

  const remaining = Math.max(0, leg.targetDistance - player.totalDistance);

  return (
    <div style={{ border: '1px solid #555', borderRadius: 8, padding: 12, marginTop: 12 }}>
      <div style={{ marginBottom: 8 }}>
        <strong>Leg:</strong> {leg.name} | Target {leg.targetDistance} | Weather {leg.weather}
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div><strong>Total:</strong> {player.totalDistance} / {leg.targetDistance}</div>
          <div><strong>Rolls Left:</strong> {player.rollsRemaining} / {player.maxRollsAllowed}</div>
          <div><strong>Gear:</strong> {Gear[player.currentGear]} (d{[4,6,8,10,20][player.currentGear-1]})</div>
          <div><strong>Status:</strong> {player.hasOvershot ? 'Overshot' : player.isHeld ? 'Held' : 'Active'}</div>
          <div><strong>Remaining Dist:</strong> {remaining}</div>
        </div>
        <div>
          <button onClick={down} disabled={player.rollHistory.length === 0 || player.currentGear === Gear.FIRST || player.isHeld || player.hasOvershot}>
            Shift Down
          </button>
          <button onClick={onRoll} disabled={!canRoll} style={{ margin: '0 8px' }}>
            Roll
          </button>
          <button onClick={up} disabled={player.rollHistory.length === 0 || player.isHeld || player.hasOvershot || player.currentGear === Gear.FIFTH}>
            Shift Up
          </button>
          <button onClick={onHold} disabled={player.isHeld || player.hasOvershot} style={{ marginLeft: 8 }}>
            Hold {player.totalDistance} / {leg.targetDistance}
          </button>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <strong>Roll History:</strong>
        <ul>
          {player.rollHistory.map((r, i) => (
            <li key={i}>
              {Gear[r.gear]}: {r.rolls.join(', ')} =&gt; {r.final}
            </li>
          ))}
        </ul>
      </div>

      {leg.weather === Weather.SWELTERING && (
        <div style={{ marginTop: 8, color: '#a66' }}>
          Must shift after every roll. {requiresShift ? 'Shift now to roll again.' : ''}
        </div>
      )}
    </div>
  );
}


