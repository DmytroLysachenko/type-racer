import "server-only";

// Store for the state of the game generated with generative AI

export type Player = {
  id: string;
  name: string;
  createdAt: number;
  lastSeenAt: number;
  lifetime: {
    roundsPlayed: number;
    avgWpm: number;
    avgAccuracy: number;
    bestWpm: number;
  };
};

export type LiveStat = {
  playerId: string;
  name: string;
  roundId: number;
  typed: string;
  wpm: number;
  accuracy: number;
  updatedAt: number;
};

type DB = {
  players: Map<string, Player>;
  live: Map<number, Map<string, LiveStat>>; // roundId -> playerId -> stat
};

const g = globalThis as unknown as { __DB?: DB };

function create(): DB {
  return { players: new Map(), live: new Map() };
}

export const db: DB = g.__DB ?? (g.__DB = create());

export function upsertPlayer(id: string, name: string): Player {
  const now = Date.now();
  const e = db.players.get(id);
  if (e) {
    e.name = name;
    e.lastSeenAt = now;
    return e;
  }
  const p: Player = {
    id,
    name,
    createdAt: now,
    lastSeenAt: now,
    lifetime: { roundsPlayed: 0, avgWpm: 0, avgAccuracy: 1, bestWpm: 0 },
  };
  db.players.set(id, p);
  return p;
}

export function finishRound(playerId: string, wpm: number, accuracy: number) {
  const p = db.players.get(playerId);

  if (!p) return;

  const L = p.lifetime;
  const n = L.roundsPlayed;

  L.roundsPlayed = n + 1;
  L.avgWpm = (L.avgWpm * n + wpm) / (n + 1);
  L.avgAccuracy = (L.avgAccuracy * n + accuracy) / (n + 1);
  L.bestWpm = Math.max(L.bestWpm, wpm);
  p.lastSeenAt = Date.now();
}
