"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CACHE_TAGS } from "@/lib/catalog";
import { checkAdminPassword, endAdminSession, isAdmin, requestFingerprint, startAdminSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { bogotaLocalToIso } from "@/lib/time";

export type AdminActionState = { ok: boolean; message: string } | null;

const LOGIN_WINDOW_SECONDS = 15 * 60;

async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}

/** Máximo 5 intentos por IP y 100 en total cada 15 minutos. Si la base no responde, no deja pasar. */
async function loginAllowed(): Promise<boolean> {
  const { ipHash } = await requestFingerprint();
  const buckets: [string, number][] = [["login:global", 100]];
  if (ipHash) buckets.push([`login:ip:${ipHash}`, 5]);

  for (const [bucket, limit] of buckets) {
    const { data, error } = await supabaseAdmin().rpc("hit_rate_limit", {
      p_bucket: bucket,
      p_limit: limit,
      p_window_seconds: LOGIN_WINDOW_SECONDS,
    });
    if (error || data !== true) return false;
  }
  return true;
}

export async function login(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  if (!(await loginAllowed())) {
    return { ok: false, message: "Demasiados intentos. Espera 15 minutos e inténtalo de nuevo." };
  }

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

  // La página pública ve el cambio de inmediato (sin esperar la caché).
  updateTag(CACHE_TAGS.campaign);
  updateTag(CACHE_TAGS.results);
  revalidatePath("/admin");
  return { ok: true, message: "Campaña actualizada." };
}

/**
 * Sortea los ganadores que falten para un restaurante. La base de datos hace el
 * sorteo de forma atómica: nadie gana dos veces y no se supera el cupo.
 */
export async function drawWinners(restaurantSlug: string): Promise<AdminActionState> {
  await requireAdmin();

  const { data: drawn, error } = await supabaseAdmin().rpc("draw_raffle_winners", { p_restaurant_slug: restaurantSlug });
  if (error) return { ok: false, message: `No se pudo sortear: ${error.message}` };

  revalidatePath("/admin");
  if (drawn === 0) {
    return { ok: false, message: "No hay más participantes disponibles o el cupo ya está completo." };
  }
  return { ok: true, message: drawn === 1 ? "Salió 1 ganador." : `Salieron ${drawn} ganadores.` };
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
