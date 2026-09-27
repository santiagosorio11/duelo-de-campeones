"use client";

import { PhoneIcon, WarningCircleIcon } from "@phosphor-icons/react";
import clsx from "clsx";
import { useId, useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { submitRating, type PublicParticipant, type SubmitRatingResult } from "@/app/actions";
import { BottomSheet, useSheetClose } from "@/components/ui/BottomSheet";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { raffleMessage, type Dish, type Passport, type Restaurant } from "@/lib/passport";
import { formatNationalMobile, looksLikeColombianMobile, toNationalDigits } from "@/lib/phone-format";
import { CategoryIcon } from "./DishArt";
import { PassportSlots } from "./PassportSlots";
import { StarRating } from "./StarRating";
import { StarRow } from "./StarRow";

export type RatedResult = Extract<SubmitRatingResult, { ok: true }>;

type Props = {
  dish: Dish;
  restaurant: Restaurant;
  catalog: Restaurant[];
  identity: PublicParticipant | null;
  passport: Passport | null;
  entrySlug: string | null;
  votingOpen: boolean;
  onRated: (result: RatedResult) => void;
  onForget: () => void;
  onClose: () => void;
};

type Errors = Partial<Record<"stars" | "name" | "phone" | "consent" | "form", string>>;

const FIELD_FOR_CODE: Partial<Record<string, keyof Errors>> = {
  invalid_name: "name",
  name_mismatch: "name",
  invalid_phone: "phone",
  junk_phone: "phone",
  consent_required: "consent",
};

/** Hoja inferior para calificar un plato. */
export function RatingSheet(props: Props) {
  const { dish, restaurant, catalog, identity, passport, onClose } = props;
  const [result, setResult] = useState<RatedResult | null>(null);

  const alreadyStamped = identity ? passport?.stamps[dish.slug] : undefined;
  const view = result ? "done" : alreadyStamped ? "already" : "form";
  const shownPassport = result?.passport ?? passport;

  return (
    <BottomSheet labelledBy="sheet-title" onClose={onClose}>
      <header className="px-5 pt-1">
        <p className="text-sm text-mist">{restaurant.name}</p>
        <h2 id="sheet-title" className="font-display text-[40px] leading-[0.92] uppercase">
          {dish.name}
        </h2>
      </header>

      {view === "form" ? (
        <RatingForm
          {...props}
          onSuccess={(res) => {
            setResult(res);
            props.onRated(res);
          }}
        />
      ) : (
        <StampView
          dish={dish}
          catalog={catalog}
          passport={shownPassport}
          status={result?.status ?? "already_rated"}
          stars={shownPassport?.stamps[dish.slug] ?? 0}
          onOtherPerson={view === "already" ? props.onForget : undefined}
        />
      )}
    </BottomSheet>
  );
}

function RatingForm({
  dish,
  identity,
  entrySlug,
  votingOpen,
  onForget,
  onSuccess,
}: Props & { onSuccess: (result: RatedResult) => void }) {
  const ids = useId();
  const [stars, setStars] = useState(0);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [pending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;

    const next: Errors = {};
    if (!stars) next.stars = "Elige de 1 a 5 estrellas.";
    if (!identity) {
      if (fullName.replace(/\s+/g, " ").trim().length < 3) next.name = "Escribe tu nombre completo.";
      if (!looksLikeColombianMobile(toNationalDigits(phone))) next.phone = "Escribe un celular de 10 dígitos que empiece por 3.";
      if (!consent) next.consent = "Necesitamos tu autorización para registrar la calificación.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    startTransition(async () => {
      const res = await submitRating({
        dishSlug: dish.slug,
        stars,
        entrySlug,
        identity: identity ? { mode: "remembered" } : { mode: "new", fullName, phone, consent },
      });
      if (res.ok) {
        onSuccess(res);
        return;
      }
      if (res.code === "not_remembered") onForget();
      // Con identidad recordada no hay campos visibles: el error va al mensaje general.
      const field = identity ? "form" : (FIELD_FOR_CODE[res.code] ?? "form");
      setErrors({ [field]: res.message });
    });
  };

  if (!votingOpen) {
    return <p className="px-5 pt-6 pb-2 text-sm text-mist">La votación no está abierta en este momento.</p>;
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6 px-5 pt-6">
      <fieldset>
        <legend id={`${ids}-stars`} className="mb-3 w-full text-center text-sm font-medium text-bone/90">
          Tu veredicto, juez: ¿qué tal estuvo?
        </legend>
        <StarRating value={stars} onChange={setStars} labelledBy={`${ids}-stars`} error={errors.stars} />
      </fieldset>

      {identity ? (
        <div className="rounded-[16px] border border-white/10 bg-white/[0.03] p-4 text-sm leading-relaxed">
          Calificas como <strong className="font-semibold">{identity.name}</strong>{" "}
          <span className="text-mist">({identity.phoneMasked})</span>.{" "}
          <button type="button" onClick={onForget} className="text-gold-300 underline underline-offset-4">
            No soy yo
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <Field id={`${ids}-name`} label="Nombre completo" error={errors.name}>
            <input
              id={`${ids}-name`}
              name="fullName"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              autoComplete="name"
              autoCapitalize="words"
              enterKeyHint="next"
              maxLength={80}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? `${ids}-name-error` : undefined}
              className={inputClass}
            />
          </Field>

          <Field
            id={`${ids}-phone`}
            label="Celular"
            helper={
              <span className="flex items-start gap-2 rounded-[14px] bg-gold-400/10 px-3 py-2.5 text-xs leading-relaxed text-gold-200">
                <PhoneIcon size={16} weight="duotone" className="mt-px shrink-0 text-gold-400" aria-hidden />
                Usa un celular válido y activo: si ganas, te contactaremos a este número.
              </span>
            }
            error={errors.phone}
          >
            <div
              className={clsx(
                "flex h-12 items-stretch overflow-hidden rounded-[14px] border bg-ink-850 transition focus-within:border-gold-400/70 focus-within:ring-2 focus-within:ring-gold-400/25",
                errors.phone ? "border-danger/70" : "border-white/12",
              )}
            >
              <span className="grid place-items-center border-r border-white/10 px-3 text-base text-mist">+57</span>
              <input
                id={`${ids}-phone`}
                name="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                enterKeyHint="done"
                value={phone}
                onChange={(event) => setPhone(formatNationalMobile(event.target.value))}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={`${ids}-phone-helper${errors.phone ? ` ${ids}-phone-error` : ""}`}
                className="w-full min-w-0 bg-transparent px-3 text-base tracking-wide text-bone outline-none placeholder:text-dim"
                placeholder="3XX XXX XXXX"
              />
            </div>
          </Field>

          <div>
            <label className="flex items-start gap-3 text-sm leading-relaxed text-bone/90">
              <input
                type="checkbox"
                name="consent"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                aria-invalid={Boolean(errors.consent)}
                aria-describedby={errors.consent ? `${ids}-consent-error` : undefined}
                className="mt-0.5 size-5 shrink-0 accent-gold-400"
              />
              <span>
                Autorizo el tratamiento de mis datos personales para este concurso, según la{" "}
                <a href="/privacidad" target="_blank" className="text-gold-300 underline underline-offset-4">
                  política de datos
                </a>
                .
              </span>
            </label>
            {errors.consent ? (
              <p id={`${ids}-consent-error`} className="mt-2 text-sm text-danger">
                {errors.consent}
              </p>
            ) : null}
          </div>
        </div>
      )}

      {errors.form ? (
        <p role="alert" className="flex items-start gap-2 rounded-[14px] bg-danger/10 p-3 text-sm text-danger">
          <WarningCircleIcon size={18} className="mt-0.5 shrink-0" aria-hidden />
          {errors.form}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className={clsx(
          "relative w-full overflow-hidden rounded-full bg-gold-400 py-4 text-base font-semibold text-ink-950 transition active:scale-[0.99] disabled:cursor-wait",
          pending && "pending-shimmer",
        )}
      >
        {pending ? "Enviando…" : "Enviar calificación"}
      </button>
    </form>
  );
}

const inputClass =
  "h-12 w-full rounded-[14px] border border-white/12 bg-ink-850 px-4 text-base text-bone outline-none transition placeholder:text-dim focus:border-gold-400/70 focus:ring-2 focus:ring-gold-400/25 aria-[invalid=true]:border-danger/70";

function Field({
  id,
  label,
  helper,
  error,
  children,
}: {
  id: string;
  label: string;
  helper?: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-bone/90">
        {label}
      </label>
      {children}
      {helper ? <div id={`${id}-helper`}>{helper}</div> : null}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function StampView({
  dish,
  catalog,
  passport,
  status,
  stars,
  onOtherPerson,
}: {
  dish: Dish;
  catalog: Restaurant[];
  passport: Passport | null;
  status: "created" | "already_rated";
  stars: number;
  onOtherPerson?: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const close = useSheetClose();

  useGSAP(
    () => {
      if (prefersReducedMotion() || status !== "created") return;
      gsap
        .timeline()
        .fromTo(".stamp", { scale: 1.9, rotation: -32, autoAlpha: 0 }, { scale: 1, rotation: -8, autoAlpha: 1, duration: 0.6, ease: "slam" })
        .fromTo(
          ".stamp-ring",
          { scale: 0.8, autoAlpha: 0.8 },
          { scale: 1.9, autoAlpha: 0, duration: 0.8, ease: "power2.out", immediateRender: false },
          0.32,
        )
        .from(".stamp-copy > *", { y: 16, autoAlpha: 0, duration: 0.55, stagger: 0.07, ease: "expo.out" }, 0.4)
        .fromTo("[data-stamp=new]", { scale: 0.4 }, { scale: 1, duration: 0.55, ease: "back.out(3)" }, 0.7);
    },
    { scope: root },
  );

  const created = status === "created";

  return (
    <div ref={root} className="flex flex-col items-center px-5 pt-6 text-center">
      <div className="relative">
        <span aria-hidden className="stamp-ring absolute inset-0 rounded-full border-2 border-gold-300/70 opacity-0" />
        <div
          style={{ transform: "rotate(-8deg)" }}
          className="stamp grid size-28 place-items-center rounded-full bg-ink-850 ring-[3px] ring-gold-400/80 ring-offset-4 ring-offset-ink-900"
        >
          <div className="flex flex-col items-center gap-1.5">
            <CategoryIcon category={dish.category} size={38} weight="fill" className="text-gold-300" aria-hidden />
            <StarRow value={stars} size={11} />
          </div>
        </div>
      </div>

      <div className="stamp-copy flex w-full flex-col items-center">
        <h3 className="font-display mt-6 text-[40px] leading-none uppercase">{created ? "¡Sellado!" : "Ya estaba sellado"}</h3>
        <p className="mt-3 max-w-[36ch] text-sm leading-relaxed text-mist">
          {created
            ? raffleMessage(passport, catalog)
            : `Ya calificaste este plato con ${stars} ${stars === 1 ? "estrella" : "estrellas"}. ${raffleMessage(passport, catalog)}`}
        </p>
        <div className="mt-6 w-full">
          <PassportSlots
            catalog={catalog}
            passport={passport}
            highlight={created ? catalog.find((r) => r.dishes.some((d) => d.slug === dish.slug))?.slug : undefined}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={close}
        className="mt-6 w-full rounded-full bg-gold-400 py-4 text-base font-semibold text-ink-950 transition active:scale-[0.99]"
      >
        Listo
      </button>
      {onOtherPerson ? (
        <button type="button" onClick={onOtherPerson} className="mt-4 text-sm text-mist underline underline-offset-4">
          Soy otra persona y quiero calificar
        </button>
      ) : null}
    </div>
  );
}
