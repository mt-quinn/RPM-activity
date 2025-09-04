export type Intent =
  | { t: 'join'; id: string; name: string }
  | { t: 'ready'; id: string; ready: boolean }
  | { t: 'roll'; id: string }
  | { t: 'hold'; id: string }
  | { t: 'shift'; id: string; d: -1 | 1 }
  | { t: 'repair'; id: string }
  | { t: 'host-start' };

export type SnapshotMsg = { t: 'snapshot'; v: number; state: any };


