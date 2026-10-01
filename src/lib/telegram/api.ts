import { env } from "../env";

/** Kirim balasan ke Telegram. Dipanggil dari webhook handler. */
export async function kirimPesan(chatId: number | string, teks: string) {
  const res = await fetch(
    `https://api.telegram.org/bot${env.botToken()}/sendMessage`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: teks,
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
      }),
    },
  );
  if (!res.ok) {
    // Dicatat saja: Telegram tidak perlu tahu, dan update tetap dianggap selesai
    // supaya tidak dikirim ulang terus-menerus.
    console.error("sendMessage gagal", res.status, await res.text());
  }
}
