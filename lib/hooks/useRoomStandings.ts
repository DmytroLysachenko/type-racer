"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  mergeProgress,
  parseProgress,
  rankProgress,
} from "@/lib/game/progress";
import {
  bindRound,
  liveConfigured,
  type Member,
  type ProgressPayload,
} from "@/lib/pusher.client";

function upsert(rows: ProgressPayload[], row: ProgressPayload) {
  const index = rows.findIndex((item) => item.playerId === row.playerId);
  if (index < 0) return [...rows, row];
  const merged = mergeProgress(rows[index], row);
  if (!merged) return rows;
  const next = [...rows];
  next[index] = merged;
  return next;
}

/** Own the presence lifecycle and expose only room state to rendering. */
export function useRoomStandings(
  roundId: number,
  sentence: string,
  selfId: string,
  localProgress?: ProgressPayload,
) {
  const [rows, setRows] = useState<ProgressPayload[]>([]);
  const [status, setStatus] = useState(
    liveConfigured ? "connecting" : "offline",
  );
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());
  const membersRef = useRef(new Map<string, string>());

  useEffect(() => {
    if (!liveConfigured) return;
    return bindRound(roundId, {
      onSubscriptionSucceeded: (members) => {
        const seeded: ProgressPayload[] = [];
        const nextMembers = new Map<string, string>();
        members.each((member) => {
          const name = member.info?.name ?? "Guest";
          nextMembers.set(member.id, name);
          seeded.push({
            playerId: member.id,
            name,
            roundId,
            typed: "",
            totalTypedChars: 0,
            mistakes: 0,
            elapsedMs: 0,
            completed: false,
          });
        });
        membersRef.current = nextMembers;
        setActiveIds(new Set(nextMembers.keys()));
        setRows((previous) => {
          const active = seeded.map((row) => {
            const saved = previous.find(
              (item) => item.playerId === row.playerId,
            );
            return saved?.typed ? { ...saved, name: row.name } : row;
          });
          return [
            ...active,
            ...previous.filter(
              (row) => row.typed && !nextMembers.has(row.playerId),
            ),
          ];
        });
        setStatus("connected");
      },
      onMemberAdded: (member: Member) => {
        const name = member.info?.name ?? "Guest";
        membersRef.current.set(member.id, name);
        setActiveIds((previous) => new Set(previous).add(member.id));
        setRows((previous) => {
          if (previous.some((row) => row.playerId === member.id))
            return previous.map((row) =>
              row.playerId === member.id ? { ...row, name } : row,
            );
          return upsert(previous, {
            playerId: member.id,
            name,
            roundId,
            typed: "",
            totalTypedChars: 0,
            mistakes: 0,
            elapsedMs: 0,
            completed: false,
          });
        });
      },
      onMemberRemoved: (member: Member) => {
        membersRef.current.delete(member.id);
        setActiveIds((previous) => {
          const next = new Set(previous);
          next.delete(member.id);
          return next;
        });
        setRows((previous) =>
          previous.filter((row) => row.playerId !== member.id || row.typed),
        );
      },
      onProgress: (payload, senderId) => {
        const parsed = parseProgress(payload, roundId, sentence);
        if (!parsed || parsed.playerId !== senderId) return;
        const name = membersRef.current.get(parsed.playerId);
        if (!name) return;
        setRows((previous) => upsert(previous, { ...parsed, name }));
      },
      onStatus: (next) => {
        setStatus(next);
        if (next !== "connected") {
          membersRef.current.clear();
          setActiveIds(new Set());
        }
      },
    });
  }, [roundId, sentence]);

  const ranked = useMemo(() => {
    const parsed = localProgress
      ? parseProgress(localProgress, roundId, sentence)
      : null;
    const withLocal = parsed?.playerId === selfId ? upsert(rows, parsed) : rows;
    return rankProgress(withLocal, sentence);
  }, [rows, localProgress, roundId, sentence, selfId]);
  return { rows: ranked, status, activeIds };
}
