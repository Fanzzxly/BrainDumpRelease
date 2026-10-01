import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_SESI, buatToken, passwordCocok } from "@/lib/auth";
import { env } from "@/lib/env";
import { IkonBebek } from "@/components/ikon";
import { Input, Label, Pesan, Tombol } from "@/components/ui";

export default async function Masuk({
  searchParams,
}: {
  searchParams: Promise<{ galat?: string }>;
}) {
  const sp = await searchParams;

  async function masuk(formData: FormData) {
    "use server";
    const password = String(formData.get("password") ?? "");
    if (!(await passwordCocok(password, env.appPassword()))) {
      redirect("/masuk?galat=1");
    }
    const jar = await cookies();
    jar.set(COOKIE_SESI, await buatToken(env.authSecret()), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    redirect("/");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="kartu w-full max-w-sm p-7">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1d1d20]">
            <IkonBebek />
          </div>
          <div>
            <p className="text-[19px] font-extrabold leading-none tracking-wide">ZENOFARM</p>
            <p className="eyebrow mt-1.5">Jurnal ternak petelur</p>
          </div>
        </div>

        <form action={masuk} className="mt-7 flex flex-col gap-4">
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              name="password"
              autoFocus
              required
              autoComplete="current-password"
              placeholder="Masukkan password"
            />
          </div>
          <Pesan jenis="galat" teks={sp.galat ? "Password salah." : undefined} />
          <Tombol type="submit">Masuk</Tombol>
        </form>
      </div>
    </main>
  );
}
