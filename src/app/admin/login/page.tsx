import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/brand/Wordmark";
import { isAdmin } from "@/lib/session";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Admin | Duelo de Campeones" };

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[400px] flex-col justify-center gap-8 px-6">
      <Wordmark className="self-start text-[30px]" />
      <div>
        <h1 className="font-display text-4xl leading-none uppercase">Panel del duelo</h1>
        <p className="mt-2 text-sm text-mist">Resultados, participantes y sorteo.</p>
      </div>
      <LoginForm />
    </main>
  );
}
