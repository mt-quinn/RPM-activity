import React from 'react';
import { RaceSnapshot } from '../../controller/raceController';

export default function Leaderboard({ snap }:{ snap: RaceSnapshot }) {
  return (
    <div>
      <div className="font-semibold mb-2">Leaderboard</div>
      <ol className="space-y-2">
        {snap.scoreboard.map((s, i) => {
          const p = snap.players[s.id];
          return (
            <li key={s.id} className="flex items-center justify-between bg-slate-800/40 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-sm opacity-60">{i + 1}</span>
                <span className="font-medium">{p?.username ?? s.id}</span>
              </div>
              <div className="text-sm"><span className="opacity-70">pts</span> <span className="font-semibold">{s.points}</span></div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}


