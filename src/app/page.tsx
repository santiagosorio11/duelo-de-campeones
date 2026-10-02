import { DuelApp, type CampaignView } from "@/components/duel/DuelApp";
import { getCampaign, getCatalog, getRatingsForPhone, type CampaignState } from "@/lib/catalog";
import { buildPassport } from "@/lib/passport";
import { maskPhone } from "@/lib/phone-format";
import { readParticipant } from "@/lib/session";

const dateLabel = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "America/Bogota",
});

function campaignView(campaign: CampaignState): CampaignView {
  const base = { winnersPerRestaurant: campaign.winnersPerRestaurant, opensAtLabel: null };
  if (campaign.isOpen) return { ...base, state: "open" };
  const upcoming = campaign.isOpenFlag && campaign.startsAt !== null && Date.parse(campaign.startsAt) > Date.now();
  if (upcoming && campaign.startsAt) {
    return { ...base, state: "upcoming", opensAtLabel: dateLabel.format(new Date(campaign.startsAt)) };
  }
  return { ...base, state: "closed" };
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const [catalog, campaign, participant] = await Promise.all([getCatalog(), getCampaign(), readParticipant()]);

  const passport = participant ? buildPassport(catalog, await getRatingsForPhone(participant.phone)) : null;
  const entrySlug = typeof params.r === "string" && catalog.some((r) => r.slug === params.r) ? params.r : null;

  return (
    <DuelApp
      catalog={catalog}
      campaign={campaignView(campaign)}
      entrySlug={entrySlug}
      remembered={participant ? { name: participant.name, phoneMasked: maskPhone(participant.phone) } : null}
      initialPassport={passport}
      skipIntro={params.skipIntro === "1"}
    />
  );
}
