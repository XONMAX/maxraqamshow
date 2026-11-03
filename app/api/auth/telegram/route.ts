import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

const MAX_AGE_S = 24 * 60 * 60;

/**
 * Verifies a Telegram Login Widget payload.
 * https://core.telegram.org/widgets/login#checking-authorization
 *   secret_key = SHA256(bot_token)
 *   hash       = HMAC_SHA256(data_check_string, secret_key)  (hex)
 */
export async function POST(req: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return NextResponse.json({ error: "telegram_login_not_configured" }, { status: 501 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const { hash, ...fields } = body;
  if (typeof hash !== "string" || !/^[a-f0-9]{64}$/.test(hash)) {
    return NextResponse.json({ error: "bad_hash" }, { status: 400 });
  }

  const dataCheckString = Object.keys(fields)
    .filter((k) => fields[k] !== undefined && fields[k] !== null)
    .sort()
    .map((k) => `${k}=${fields[k]}`)
    .join("\n");

  const secret = createHash("sha256").update(token).digest();
  const expected = createHmac("sha256", secret).update(dataCheckString).digest();
  if (!timingSafeEqual(expected, Buffer.from(hash, "hex"))) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  const authDate = Number(fields.auth_date);
  if (!Number.isFinite(authDate) || Date.now() / 1000 - authDate > MAX_AGE_S) {
    return NextResponse.json({ error: "expired" }, { status: 401 });
  }

  const user = {
    id: Number(fields.id),
    first_name: String(fields.first_name ?? ""),
    last_name: fields.last_name ? String(fields.last_name) : undefined,
    username: fields.username ? String(fields.username) : undefined,
    photo_url: fields.photo_url ? String(fields.photo_url) : undefined,
  };

  // Signed session cookie (HttpOnly). A production escrow backend would issue a server-side session instead.
  const payload = Buffer.from(JSON.stringify({ id: user.id, iat: Math.floor(Date.now() / 1000) })).toString("base64url");
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  const res = NextResponse.json({ user });
  res.cookies.set("nb_session", `${payload}.${sig}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
  return res;
}
