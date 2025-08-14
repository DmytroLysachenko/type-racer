"use client";
import { useEffect, useMemo, useState } from "react";

import { useRound } from "@/lib/hooks/useRound";
import { bindRound } from "@/lib/pusher.client";

export type Row = {
  playerId: string;
  name: string;
  typed: string;
  wpm: number;
  accuracy: number;
};

export function ScoreTable({ selfId }: { selfId?: string }) {
  const { round } = useRound();

  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    setRows([]);
  }, [round.id]);

  // Presence + client events
  useEffect(() => {
    const off = bindRound(round.id, {
      onSubscriptionSucceeded: (members) => {
        const seeded: Row[] = [];

        members.each((m: any) => {
          const name = m.info?.name ?? "Guest";
          seeded.push({ playerId: m.id, name, typed: "", wpm: 0, accuracy: 1 });
        });
        setRows(seeded);
      },

      onMemberAdded: (m: any) => {
        setRows((prev) =>
          prev.some((r) => r.playerId === m.id)
            ? prev
            : [
                ...prev,
                {
                  playerId: m.id,
                  name: m.info?.name ?? "Guest",
                  typed: "",
                  wpm: 0,
                  accuracy: 1,
                },
              ]
        );
      },
      onMemberRemoved: (m: any) => {
        setRows((prev) => prev.filter((r) => r.playerId !== m.id));
      },
      onProgress: (d: any) => {
        if (+d.roundId !== round.id) return; // <-- coerced

        setRows((prev) => {
          const idx = prev.findIndex((r) => r.playerId === d.playerId);
          const row = {
            playerId: d.playerId,
            name: d.name,
            typed: d.typed,
            wpm: d.wpm,
            accuracy: d.accuracy,
          };
          if (idx === -1) return [...prev, row];
          const next = [...prev];
          next[idx] = row;
          return next;
        });
      },
    });
    return off;
  }, [round.id]);

  // Local echo for instant self-row updates
  useEffect(() => {
    const onLocal = (e: Event) => {
      const details = (e as CustomEvent<any>).detail;

      if (details.roundId !== round.id) return;

      setRows((prev) => {
        const idx = prev.findIndex((row) => row.playerId === details.playerId);

        const row = {
          playerId: details.playerId,
          name: details.name,
          typed: details.typed,
          wpm: details.wpm,
          accuracy: details.accuracy,
        };

        if (idx === -1) return [...prev, row];

        const next = [...prev];

        next[idx] = row;

        return next;
      });
    };

    window.addEventListener(
      "typearena:local-progress",
      onLocal as EventListener
    );

    return () =>
      window.removeEventListener(
        "typearena:local-progress",
        onLocal as EventListener
      );
  }, [round.id]);

  return (
    <div className="p-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-gray-400">
            <tr>
              <th className="py-2 pr-4">Live progress</th>
              <th className="py-2 pr-4">Player name</th>
              <th className="py-2 pr-4 text-right">Words per minute</th>
              <th className="py-2 pr-2 text-right">Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const self = row.playerId === selfId;
              return (
                <tr
                  key={row.playerId}
                  className={self ? "bg-indigo-500/5" : ""}
                >
                  <td className="py-2 pr-4 ">{row.typed}</td>
                  <td className="py-2 pr-4">
                    {self ? row.name + " (you)" : row.name}
                  </td>
                  <td className="py-2 pr-4 text-right">
                    {Math.round(row.wpm)}
                  </td>
                  <td className="py-2 pr-2 text-right">
                    {(row.accuracy * 100).toFixed(0)}%
                  </td>
                </tr>
              );
            })}

            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="py-6 text-center text-gray-400"
                >
                  No players yet. Start typing to join!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
