"use client";

import { XIcon } from "@phosphor-icons/react";
import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";

const SheetCloseContext = createContext<() => void>(() => {});

/** Cierra la hoja que contiene al componente, con su animación de salida. */
export function useSheetClose(): () => void {
  return useContext(SheetCloseContext);
}

type Props = {
  labelledBy: string;
  onClose: () => void;
  children: ReactNode;
};

/** Hoja inferior sobre <dialog> nativo: foco atrapado, Escape y fondo inerte. */
export function BottomSheet({ labelledBy, onClose, children }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const closing = useRef(false);

  const { contextSafe } = useGSAP(
    () => {
      const el = dialog.current;
      if (!el) return;
      if (!el.open) el.showModal();
      if (prefersReducedMotion()) return;
      gsap.fromTo(backdrop.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35 });
      gsap.fromTo(panel.current, { yPercent: 100 }, { yPercent: 0, duration: 0.6, ease: "expo.out" });
    },
    { scope: dialog },
  );

  useEffect(() => {
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = previous;
    };
  }, []);

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    const done = () => {
      dialog.current?.close();
      onClose();
    };
    if (prefersReducedMotion()) {
      done();
      return;
    }
    contextSafe(() => {
      gsap
        .timeline({ onComplete: done })
        .to(panel.current, { yPercent: 100, duration: 0.38, ease: "power3.in" })
        .to(backdrop.current, { autoAlpha: 0, duration: 0.32 }, 0);
    })();
  };

  return (
    <dialog
      ref={dialog}
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-transparent p-0 text-bone backdrop:bg-transparent"
    >
      <div ref={backdrop} className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" onClick={close} />

      <div
        ref={panel}
        className="absolute inset-x-0 bottom-0 mx-auto max-h-[92dvh] w-full max-w-[520px] overflow-y-auto overscroll-contain rounded-t-[24px] border border-b-0 border-white/10 bg-ink-900 pb-[max(24px,env(safe-area-inset-bottom))] shadow-[0_-24px_80px_rgb(0_0_0/0.6)]"
      >
        <div className="sticky top-0 z-10 flex items-center justify-center bg-ink-900/90 px-5 pt-3 pb-2 backdrop-blur">
          <span aria-hidden className="h-1 w-10 rounded-full bg-white/15" />
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar"
            className="absolute top-2 right-3 grid size-10 place-items-center rounded-full text-mist transition hover:bg-white/5 hover:text-bone active:scale-95"
          >
            <XIcon size={20} aria-hidden />
          </button>
        </div>
        <SheetCloseContext value={close}>{children}</SheetCloseContext>
      </div>
    </dialog>
  );
}
