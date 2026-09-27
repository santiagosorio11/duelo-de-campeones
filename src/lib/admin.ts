import "server-only";
import { getCampaign, getCatalog, getDishResults } from "@/lib/catalog";
import { supabaseAdmin } from "@/lib/supabase/server";

const PAGE_SIZE = 1000;

type Page<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

/** Trae todas las filas en páginas de 1000 (límite por defecto de la Data API). */
export async function fetchAll<T>(page: (from: number, to: number) => Page<T>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

export type RaffleEntryRow = {
  participantId: number;
  fullName: string;
  phone: string;
  dishesRated: number;
  firstRatingAt: string | null;
};

export async function getRaffleEntries(): Promise<RaffleEntryRow[]> {
  const rows = await fetchAll((from, to) =>
    supabaseAdmin()
      .from("raffle_entries")
      .select("participant_id, full_name, phone_e164, dishes_rated, first_rating_at")
      .order("first_rating_at")
      .order("participant_id")
      .range(from, to),
  );
  return rows.map((row) => ({
    participantId: row.participant_id ?? 0,
    fullName: row.full_name ?? "",
    phone: row.phone_e164 ?? "",
    dishesRated: row.dishes_rated ?? 0,
    firstRatingAt: row.first_rating_at,
  }));
}

export type DrawRow = {
  id: number;
  participantId: number;
  fullName: string;
  phone: string;
  /** Restaurante donde redime el premio. */
  restaurantSlug: string;
  poolSize: number;
  status: "pending" | "confirmed" | "rejected";
  drawnAt: string;
};

export async function getDraws(): Promise<DrawRow[]> {
  const { data, error } = await supabaseAdmin()
    .from("raffle_draws")
    .select(
      "id, participant_id, pool_size, status, drawn_at, participants(full_name, phone_e164), restaurants(slug)",
    )
    .order("drawn_at")
    .order("id");
  if (error) throw new Error(error.message);
  return data.map((row) => ({
    id: row.id,
    participantId: row.participant_id,
    fullName: row.participants.full_name,
    phone: row.participants.phone_e164,
    restaurantSlug: row.restaurants.slug,
    poolSize: row.pool_size,
    status: row.status as DrawRow["status"],
    drawnAt: row.drawn_at,
  }));
}

export type DeviceAlert = { deviceId: string; participants: number; ratings: number };

/** Dispositivos desde los que calificaron varios celulares distintos. */
export async function getDeviceAlerts(): Promise<DeviceAlert[]> {
  const rows = await fetchAll((from, to) =>
    supabaseAdmin()
      .from("ratings")
      .select("device_id, participant_id")
      .not("device_id", "is", null)
      .order("id")
      .range(from, to),
  );

  const byDevice = new Map<string, { participants: Set<number>; ratings: number }>();
  for (const row of rows) {
    if (!row.device_id) continue;
    const entry = byDevice.get(row.device_id) ?? { participants: new Set<number>(), ratings: 0 };
    entry.participants.add(row.participant_id);
    entry.ratings += 1;
    byDevice.set(row.device_id, entry);
  }

  return [...byDevice.entries()]
    .filter(([, entry]) => entry.participants.size > 1)
    .map(([deviceId, entry]) => ({ deviceId, participants: entry.participants.size, ratings: entry.ratings }))
    .sort((a, b) => b.participants - a.participants);
}

async function count(table: "participants" | "ratings"): Promise<number> {
  const { count: total, error } = await supabaseAdmin().from(table).select("*", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return total ?? 0;
}

export async function getAdminOverview() {
  const [campaign, catalog, results, entries, draws, alerts, participants, ratings] = await Promise.all([
    getCampaign(),
    getCatalog(),
    getDishResults(),
    getRaffleEntries(),
    getDraws(),
    getDeviceAlerts(),
    count("participants"),
    count("ratings"),
  ]);
  return { campaign, catalog, results, entries, draws, alerts, participants, ratings };
}

export type ExportRow = {
  id: number;
  fullName: string;
  phone: string;
  createdAt: string;
  stars: Record<string, number>;
  devices: number;
};

export async function getExportRows(): Promise<ExportRow[]> {
  const [participants, ratings] = await Promise.all([
    fetchAll((from, to) =>
      supabaseAdmin().from("participants").select("id, full_name, phone_e164, created_at").order("id").range(from, to),
    ),
    fetchAll((from, to) =>
      supabaseAdmin().from("ratings").select("participant_id, stars, device_id, dishes(slug)").order("id").range(from, to),
    ),
  ]);

  const byParticipant = new Map<number, { stars: Record<string, number>; devices: Set<string> }>();
  for (const rating of ratings) {
    const entry = byParticipant.get(rating.participant_id) ?? { stars: {}, devices: new Set<string>() };
    entry.stars[rating.dishes.slug] = rating.stars;
    if (rating.device_id) entry.devices.add(rating.device_id);
    byParticipant.set(rating.participant_id, entry);
  }

  return participants.map((participant) => {
    const entry = byParticipant.get(participant.id);
    return {
      id: participant.id,
      fullName: participant.full_name,
      phone: participant.phone_e164,
      createdAt: participant.created_at,
      stars: entry?.stars ?? {},
      devices: entry?.devices.size ?? 0,
    };
  });
}
