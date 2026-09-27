import { DuelApp, type CampaignView } from "@/components/duel/DuelApp";
import { getCampaign, getCatalog, getDishResults, getRatingsForPhone, type CampaignState } from "@/lib/catalog";
import { buildPassport } from "@/lib/passport";
import { maskPhone } from "@/lib/phone-format";
import { readParticipant } from "@/lib/session";

const dateLabel = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "America/Bogota",
});

function campaignView(campaign: CampaignState): CampaignView {
  if (campaign.isOpen) return { state: "open", opensAtLabel: null };
  const upcoming = campaign.isOpenFlag && campaign.startsAt !== null && Date.parse(campaign.startsAt) > Date.now();
  if (upcoming && campaign.startsAt) {
    return { state: "upcoming", opensAtLabel: dateLabel.format(new Date(campaign.startsAt)) };
  }
  return { state: "closed", opensAtLabel: null };
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const [catalog, campaign, participant] = await Promise.all([getCatalog(), getCampaign(), readParticipant()]);

  const passport = participant ? buildPassport(catalog, await getRatingsForPhone(participant.phone)) : null;
  // Los resultados solo salen del servidor cuando el admin los publica.
  const results = campaign.resultsPublished ? await getDishResults() : null;
  const entrySlug = typeof params.r === "string" && catalog.some((r) => r.slug === params.r) ? params.r : null;

  return (
    <DuelApp
      catalog={catalog}
      campaign={campaignView(campaign)}
      entrySlug={entrySlug}
      remembered={participant ? { name: participant.name, phoneMasked: maskPhone(participant.phone) } : null}
      initialPassport={passport}
      results={results}
      skipIntro={params.skipIntro === "1"}
    />
  );
}
