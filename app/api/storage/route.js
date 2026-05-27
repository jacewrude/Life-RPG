import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

const KEY = "life-rpg-data";

export async function GET() {
  try {
    const data = await kv.get(KEY);
    return NextResponse.json({ data: data || null });
  } catch (err) {
    return NextResponse.json({ data: null, error: err.message }, { status: 200 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    await kv.set(KEY, body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
