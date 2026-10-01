function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Environment variable ${name} belum diisi.`);
  return v;
}

export const env = {
  supabaseUrl: () => need("SUPABASE_URL"),
  supabaseKey: () => need("SUPABASE_SERVICE_ROLE_KEY"),
  appPassword: () => need("APP_PASSWORD"),
  authSecret: () => need("AUTH_SECRET"),
  botToken: () => need("TELEGRAM_BOT_TOKEN"),
  webhookSecret: () => need("TELEGRAM_WEBHOOK_SECRET"),
  allowedChatIds: (): string[] =>
    (process.env.TELEGRAM_ALLOWED_CHAT_IDS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
};
