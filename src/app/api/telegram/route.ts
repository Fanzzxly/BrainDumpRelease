import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { balasUntuk } from "@/lib/telegram/handlers";
import { kirimPesan } from "@/lib/telegram/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Update = {
  message?: {
    chat?: { id: number };
    text?: string;
    from?: { id: number; first_name?: string };
  };
  edited_message?: unknown;
};

export async function POST(req: Request) {
  // 1. Hanya Telegram yang tahu secret ini (didaftarkan lewat setWebhook).
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== env.webhookSecret()) {
    return new NextResponse("tidak diizinkan", { status: 401 });
  }

  let update: Update;
  try {
    update = (await req.json()) as Update;
  } catch {
    return NextResponse.json({ ok: true });
  }

  const pesan = update.message;
  const chatId = pesan?.chat?.id;
  const teks = pesan?.text?.trim();

  // Bukan pesan teks (sticker, foto, edit) - abaikan tanpa membuat Telegram
  // mengirim ulang update yang sama.
  if (!chatId || !teks) return NextResponse.json({ ok: true });

  // 2. Hanya chat yang terdaftar boleh menulis data usaha.
  const diizinkan = env.allowedChatIds();
  if (diizinkan.length > 0 && !diizinkan.includes(String(chatId))) {
    await kirimPesan(
      chatId,
      `Chat ini belum diizinkan.\nChat ID kamu: <code>${chatId}</code>\n\n` +
        "Tambahkan ID itu ke environment variable <code>TELEGRAM_ALLOWED_CHAT_IDS</code> lalu deploy ulang.",
    );
    return NextResponse.json({ ok: true });
  }

  await kirimPesan(chatId, await balasUntuk(teks));
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, layanan: "webhook telegram zenofarm" });
}
