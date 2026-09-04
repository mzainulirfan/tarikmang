import { NextResponse } from "next/server";
// PRD #37: POST /api/game/create — placeholder, sekarang room dibuat client-side via src/lib/room/store.ts
// Untuk Supabase: buat row di `game_rooms` + generate code + return { code, room }

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { difficulty = "mudah", operation = "campuran", totalRounds = 10, durationSec = 10 } = body;
  // Simulasi: generate code (real impl: check uniqueness di DB)
  const code = Array.from({ length: 5 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
  return NextResponse.json({
    code,
    config: { difficulty, operation, totalRounds, durationSec },
    note: "Placeholder — gunakan src/lib/room/store.createRoomState() client-side. Untuk Supabase, implement INSERT ke tabel game_rooms.",
  });
}
