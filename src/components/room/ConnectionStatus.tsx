"use client";

export function ConnectionStatus({ connected, team }: { connected: boolean; team?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black ${
        connected ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700 animate-pulse"
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-amber-500"}`} />
      {connected ? `● TERHUBUNG ${team ? `— ${team}` : ""}` : "⚠ CONNECTION LOST — reconnect..."}
    </div>
  );
}
