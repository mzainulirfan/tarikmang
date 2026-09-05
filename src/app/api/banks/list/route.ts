import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const owner_token = searchParams.get("owner_token");
  if (!owner_token) return NextResponse.json({ error: "owner_token required" }, { status: 400 });

  const supa = getServiceClient();
  if (!supa) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const { data, error } = await supa
    .from("game_question_banks")
    .select("id,name,category,question_count,created_at")
    .eq("owner_token", owner_token)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ banks: data });
}
