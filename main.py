import os
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, CallbackQueryHandler, filters, ContextTypes
from dotenv import load_dotenv
from llm import rapiin_ide
from notion_helper import simpan_ide

load_dotenv()

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
NOTION_DB_URL = "https://www.notion.so/37096e7a5cf480209bc1cf2610ff260e"

KATEGORI = [
    "💡 Ide Konten",
    "📖 Buku NPC",
    "🎮 VEE",
    "🛠️ Tech / Dev",
    "🌀 Random"
]

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "Halo! Kirim ide kamu seadanya, aku yang rapiin "
    )

async def open_db(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        f"Buka Brain Dump Release:\n{NOTION_DB_URL}"
    )

async def terima_ide(update: Update, context: ContextTypes.DEFAULT_TYPE):
    teks_mentah = update.message.text
    await update.message.reply_text("⏳ Lagi ngeproses ide kamu...")

    try:
        hasil = rapiin_ide(teks_mentah)
        judul = hasil["judul"]
        deskripsi = hasil["deskripsi"]

        # Simpan sementara di context
        context.user_data["judul"] = judul
        context.user_data["deskripsi"] = deskripsi
        context.user_data["raw_input"] = teks_mentah

        # Buat inline keyboard kategori
        keyboard = [[InlineKeyboardButton(k, callback_data=k)] for k in KATEGORI]
        reply_markup = InlineKeyboardMarkup(keyboard)

        await update.message.reply_text(
            f"✅ Ide kamu udah dirapiin!\n\n"
            f"*Judul:* {judul}\n\n"
            f"*Deskripsi:* {deskripsi}\n\n"
            f"Pilih kategori:",
            reply_markup=reply_markup,
            parse_mode="Markdown"
        )

    except Exception as e:
        await update.message.reply_text(f"❌ Ada error: {str(e)}")

async def pilih_kategori(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    kategori = query.data
    judul = context.user_data.get("judul")
    deskripsi = context.user_data.get("deskripsi")
    raw_input = context.user_data.get("raw_input")

    try:
        simpan_ide(judul, deskripsi, kategori, raw_input)
        await query.edit_message_text(
            f"✅ Ide tersimpan di Notion!\n\n"
            f"*Judul:* {judul}\n"
            f"*Kategori:* {kategori}",
            parse_mode="Markdown"
        )
    except Exception as e:
        await query.edit_message_text(f"❌ Gagal simpan: {str(e)}")

def main():
    app = Application.builder().token(TELEGRAM_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, terima_ide))
    app.add_handler(CallbackQueryHandler(pilih_kategori))
    app.add_handler(CommandHandler("opendb", open_db))

    print("Bot jalan...")
    app.run_polling()

if __name__ == "__main__":
    main()