"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getRaffleEntries } from "@/lib/admin";
import { pickWeighted, totalTickets } from "@/lib/raffle";
import { checkAdminPassword, endAdminSession, isAdmin, startAdminSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { bogotaLocalToIso } from "@/lib/time";

export type AdminActionState = { ok: boolean; message: string } | null;

async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function login(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const password = String(formData.get("password") ?? "");
  if (!password || !checkAdminPassword(password)) {
    // Pequeña pausa para frenar intentos automáticos.
    await new Promise((resolve) => setTimeout(resolve, 700));
    return { ok: false, message: "Contraseña incorrecta." };
  }
  await startAdminSession();
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await endAdminSession();
  redirect("/admin/login");
}

const campaignSchema = z.object({
  isOpen: z.boolean(),
  resultsPublished: z.boolean(),
  startsAt: z.string(),
  endsAt: z.string(),
});

export async function updateCampaign(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();

  const parsed = campaignSchema.safeParse({
    isOpen: formData.get("isOpen") === "on",
    resultsPublished: formData.get("resultsPublished") === "on",
    startsAt: String(formData.get("startsAt") ?? ""),
    endsAt: String(formData.get("endsAt") ?? ""),
  });
  if (!parsed.success) return { ok: false, message: "Datos inválidos." };

  const startsAt = parsed.data.startsAt ? bogotaLocalToIso(parsed.data.startsAt) : null;
  const endsAt = parsed.data.endsAt ? bogotaLocalToIso(parsed.data.endsAt) : null;
  if ((parsed.data.startsAt && !startsAt) || (parsed.data.endsAt && !endsAt)) {
    return { ok: false, message: "Revisa el formato de las fechas." };
  }
  if (startsAt && endsAt && Date.parse(endsAt) <= Date.parse(startsAt)) {
    return { ok: false, message: "El cierre debe ser posterior a la apertura." };
  }

  const { error } = await supabaseAdmin()
    .from("campaign")
    .update({
      is_open: parsed.data.isOpen,
      results_published: parsed.data.resultsPublished,
      starts_at: startsAt,
      ends_at: endsAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);

  if (error) return { ok: false, message: `No se pudo guardar: ${error.message}` };

  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true, message: "Campaña actualizada." };
}

export async function drawWinner(): Promise<AdminActionState> {
  await requireAdmin();

  const { data: draws, error: drawsError } = await supabaseAdmin().from("raffle_draws").select("participant_id, status");
  if (drawsError) return { ok: false, message: drawsError.message };
  if (draws.some((draw) => draw.status === "pending")) {
    return { ok: false, message: "Primero confirma o descarta el ganador pendiente." };
  }
  if (draws.some((draw) => draw.status === "confirmed")) {
    return { ok: false, message: "Ya hay un ganador confirmado." };
  }

  // Quien ya salió sorteado (y fue descartado) no vuelve a participar.
  const excluded = new Set(draws.map((draw) => draw.participant_id));
  const pool = (await getRaffleEntries()).filter((entry) => !excluded.has(entry.participantId) && entry.tickets > 0);
  const winner = pickWeighted(pool, (max) => randomInt(max));
  if (!winner) return { ok: false, message: "No hay participantes habilitados para el sorteo." };

  const { error } = await supabaseAdmin().from("raffle_draws").insert({
    participant_id: winner.participantId,
    tickets: winner.tickets,
    total_tickets: totalTickets(pool),
    pool_size: pool.length,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin");
  return { ok: true, message: `Ganador sorteado entre ${pool.length} participantes.` };
}

export async function resolveDraw(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = Number(formData.get("id"));
  const status = formData.get("status");
  if (!Number.isInteger(id) || (status !== "confirmed" && status !== "rejected")) return;

  const { error } = await supabaseAdmin()
    .from("raffle_draws")
    .update({ status, resolved_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending");
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
}
