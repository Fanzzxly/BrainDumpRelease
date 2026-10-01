import { NextResponse } from "next/server";
import { COOKIE_SESI } from "@/lib/auth";

export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL("/masuk", req.url), { status: 303 });
  res.cookies.set(COOKIE_SESI, "", { path: "/", maxAge: 0 });
  return res;
}
