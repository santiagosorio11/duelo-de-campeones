import { ImageResponse } from "next/og";

export const alt = "Duelo de Campeones: Machete Burger vs Coliseo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background:
            "radial-gradient(70% 90% at 0% 0%, rgba(229,72,77,0.45), transparent 60%), radial-gradient(70% 90% at 100% 100%, rgba(62,99,221,0.45), transparent 60%), #07070a",
          color: "#f4f2ee",
        }}
      >
        <div style={{ fontSize: 34, letterSpacing: 14, textTransform: "uppercase", opacity: 0.85 }}>Duelo de</div>
        <div style={{ fontSize: 132, fontWeight: 900, lineHeight: 1, color: "#efc25a", textTransform: "uppercase" }}>
          Campeones
        </div>
        <div style={{ marginTop: 40, fontSize: 44, fontWeight: 700 }}>Machete Burger vs Coliseo</div>
        <div style={{ marginTop: 16, fontSize: 30, opacity: 0.75 }}>
          Califica los platos y participa por 1 mes de hamburguesas gratis
        </div>
      </div>
    ),
    { ...size },
  );
}
