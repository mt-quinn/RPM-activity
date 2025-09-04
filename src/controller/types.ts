export enum Phase {
  Lobby = 'lobby',
  Leg = 'leg',
  Checkpoint = 'checkpoint',
  End = 'end'
}

export interface ParticipantMeta {
  id: string;
  name: string;
  ready: boolean;
}


