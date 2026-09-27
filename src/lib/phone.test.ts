import { describe, expect, it } from "vitest";
import { checkColombianMobile, isJunkNumber } from "./phone";
import { formatNationalMobile, looksLikeColombianMobile, maskPhone, toNationalDigits } from "./phone-format";

describe("toNationalDigits", () => {
  it("quita espacios, guiones y el indicativo 57", () => {
    expect(toNationalDigits("+57 315 482 7391")).toBe("3154827391");
    expect(toNationalDigits("57-315-482-7391")).toBe("3154827391");
    expect(toNationalDigits("(315) 482 7391")).toBe("3154827391");
  });
});

describe("looksLikeColombianMobile", () => {
  it("exige 10 dígitos que empiezan por 3", () => {
    expect(looksLikeColombianMobile("3154827391")).toBe(true);
    expect(looksLikeColombianMobile("6014827391")).toBe(false);
    expect(looksLikeColombianMobile("315482739")).toBe(false);
  });
});

describe("formatNationalMobile", () => {
  it("agrupa 3-3-4 mientras se escribe", () => {
    expect(formatNationalMobile("315")).toBe("315");
    expect(formatNationalMobile("3154")).toBe("315 4");
    expect(formatNationalMobile("3154827391")).toBe("315 482 7391");
    expect(formatNationalMobile("+57 3154827391999")).toBe("315 482 7391");
  });
});

describe("isJunkNumber", () => {
  it("detecta dígitos repetidos y secuencias", () => {
    expect(isJunkNumber("3000000000")).toBe(true);
    expect(isJunkNumber("3151111111")).toBe(true);
    expect(isJunkNumber("3001234567")).toBe(true);
    expect(isJunkNumber("3157654321")).toBe(true);
  });

  it("acepta números normales", () => {
    expect(isJunkNumber("3154827391")).toBe(false);
    expect(isJunkNumber("3204519086")).toBe(false);
  });
});

describe("checkColombianMobile", () => {
  it("normaliza un celular válido a E.164", () => {
    expect(checkColombianMobile("315 482 7391")).toEqual({ ok: true, e164: "+573154827391", national: "3154827391" });
    expect(checkColombianMobile("+573204519086")).toMatchObject({ ok: true, e164: "+573204519086" });
  });

  it("rechaza formatos que no son celulares", () => {
    expect(checkColombianMobile("6014827391")).toEqual({ ok: false, reason: "format" });
    expect(checkColombianMobile("31548")).toEqual({ ok: false, reason: "format" });
  });

  it("rechaza prefijos de operador que no existen", () => {
    expect(checkColombianMobile("3994827391")).toEqual({ ok: false, reason: "not_mobile" });
  });

  it("rechaza números basura", () => {
    expect(checkColombianMobile("3000000000")).toEqual({ ok: false, reason: "junk" });
    expect(checkColombianMobile("3001234567")).toEqual({ ok: false, reason: "junk" });
  });
});

describe("maskPhone", () => {
  it("muestra solo los últimos 4 dígitos", () => {
    expect(maskPhone("+573154827391")).toBe("••• 7391");
  });
});
