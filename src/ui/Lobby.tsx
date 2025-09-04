import React from 'react';
import { ParticipantMeta } from '../controller/types';

export default function Lobby({ participants, ready, onToggleReady, onStart }:
  { participants: ParticipantMeta[]; ready: boolean; onToggleReady: () => void; onStart: () => void; }) {
  return (
    <div>
      <h3>Lobby</h3>
      <button onClick={onToggleReady}>{ready ? 'Unready' : 'Ready'}</button>
      <button onClick={onStart} style={{ marginLeft: 8 }}>Start (host)</button>
      <ul style={{ marginTop: 8 }}>
        {participants.map(p => (
          <li key={p.id}>{p.name} {p.ready ? '✅' : '⏳'}</li>
        ))}
      </ul>
    </div>
  );
}


