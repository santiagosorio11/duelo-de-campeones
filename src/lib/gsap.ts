import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CustomEase } from "gsap/CustomEase";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(useGSAP, SplitText, CustomEase);

// Golpe con un rebote corto: para el título y los sellos que "caen".
CustomEase.create("slam", "M0,0 C0.12,0 0.2,1.18 0.4,1.06 0.55,0.97 0.7,1 1,1");

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export { gsap, useGSAP, SplitText };
