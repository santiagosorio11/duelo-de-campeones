import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#07070a",
          borderRadius: 16,
          border: "4px solid #efc25a",
          color: "#f6d68a",
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: -1,
        }}
      >
        VS
      </div>
    ),
    { ...size },
  );
}
