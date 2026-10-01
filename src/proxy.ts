import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESI, tokenSah } from "@/lib/auth";

/**
 * Semua halaman dashboard butuh login. Webhook Telegram dikecualikan karena
 * Telegram tidak bisa login - jalur itu dijaga oleh secret token tersendiri
 * di dalam route handler-nya.
 */
export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/telegram") || pathname === "/masuk") {
    return NextResponse.next();
  }

  const rahasia = process.env.AUTH_SECRET;
  if (!rahasia) {
    return new NextResponse(
      "AUTH_SECRET belum diisi. Dashboard dikunci sampai environment variable itu diset.",
      { status: 500 },
    );
  }

  if (await tokenSah(req.cookies.get(COOKIE_SESI)?.value, rahasia)) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/masuk";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
