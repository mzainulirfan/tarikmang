import { NextResponse } from "next/server";
// PRD #37: POST /api/game/join — placeholder
// Body: { code, team: "A"|"B", playerToken }
// Server harus validasi token unik per team, cek room status, return player

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { code, team, playerToken } = body;
  if (!code || !team || !playerToken) {
    return NextResponse.json({ error: "code, team, playerToken required" }, { status: 400 });
  }
  return NextResponse.json({
    code,
    team,
    playerToken,
    note: "Placeholder — validasi dilakukan client-side via joinTeam(). Untuk Supabase: SELECT game_rooms, INSERT game_players dengan team unique constraint.",
  });
}
