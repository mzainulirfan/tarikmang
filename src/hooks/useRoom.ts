"use client";
import { useEffect, useState, useCallback } from "react";
import { loadRoom } from "@/lib/room/store";
import type { RoomState } from "@/lib/room/store";

export function useRoom(code: string | null) {
  const [room, setRoom] = useState<RoomState | null>(null);

  const refresh = useCallback(() => {
    if (!code) return;
    const r = loadRoom(code);
    setRoom(r);
  }, [code]);

  useEffect(() => {
    if (!code) return;
    refresh();
    // poll localStorage every 400ms + BroadcastChannel
    const id = setInterval(refresh, 400);

    let ch: BroadcastChannel | null = null;
    try {
      ch = new BroadcastChannel(`tarikmang:${code}`);
      ch.onmessage = (ev) => {
        if (ev.data?.type === "ROOM_UPDATED") setRoom(ev.data.state);
      };
    } catch {}

    const onStorage = (e: StorageEvent) => {
      if (e.key === `tarikmang:room:${code}`) refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      clearInterval(id);
      window.removeEventListener("storage", onStorage);
      ch?.close();
    };
  }, [code, refresh]);

  return { room, refresh };
}
