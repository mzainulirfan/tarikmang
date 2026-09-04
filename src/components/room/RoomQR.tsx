"use client";

export function RoomQR({ code }: { code: string }) {
  const url = typeof window !== "undefined" ? `${window.location.origin}/join/${code}` : `/join/${code}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}`;

  return (
    <div className="flex flex-col items-center gap-3 bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm">
      <div className="text-xs font-black tracking-widest text-slate-500">SCAN UNTUK BERGABUNG</div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qrUrl} alt={`QR ${code}`} width={220} height={220} className="rounded-2xl border border-slate-100" />
      <div className="text-center">
        <div className="text-xs font-black tracking-widest text-slate-400">GAME CODE</div>
        <div className="text-3xl font-black tracking-widest text-slate-900">{code}</div>
        <div className="text-xs font-mono text-slate-500 break-all mt-1">{url}</div>
      </div>
    </div>
  );
}
