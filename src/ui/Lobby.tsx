import React from 'react';
import { ParticipantMeta } from '../controller/types';
import { Button } from './components/Button';
import { CardHeader } from './components/Card';

export default function Lobby({ participants, ready, onToggleReady, onStart }:
  { participants: ParticipantMeta[]; ready: boolean; onToggleReady: () => void; onStart: () => void; }) {
  return (
    <div>
      <CardHeader title="Lobby" subtitle="Get ready while others join" />
      <div className="flex gap-2">
        <Button onClick={onToggleReady} variant={ready ? 'secondary' : 'primary'}>
          {ready ? 'Unready' : 'Ready'}
        </Button>
        <Button onClick={onStart} variant="ghost">Start (host)</Button>
      </div>
      <ul className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
        {participants.map(p => (
          <li key={p.id} className="bg-slate-800/40 rounded-lg px-3 py-2 flex items-center justify-between">
            <span>{p.name}</span>
            <span className="text-sm opacity-75">{p.ready ? '✅ Ready' : '⏳ Waiting'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}


