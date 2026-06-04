import { NextResponse } from "next/server";

const BASE_URL = process.env.KV_REST_API_URL;
const TOKEN = process.env.KV_REST_API_TOKEN;
const KEY = "life-rpg-data";

async function kvGet(key) {
  const res = await fetch(`${BASE_URL}/get/${key}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const json = await res.json();
  return json.result;
}

async function kvSet(key, value) {
  await fetch(`${BASE_URL}/set/${key}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(value),
  });
}

export async function GET() {
  try {
    const data = await kvGet(KEY);
    const result = data;
const parsed = typeof result === "string" ? JSON.parse(result) : result;
return NextResponse.json({ data: parsed || null });
  } catch (err) {
    return NextResponse.json({ data: null }, { status: 200 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
if (!body || !body.categories || !body.tasks) {
  console.error("Refusing to save invalid data:", JSON.stringify(body).slice(0, 100));
  return NextResponse.json({ ok: false, error: "Invalid data shape" });
}
await kvSet(KEY, body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
