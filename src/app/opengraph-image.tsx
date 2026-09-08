import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
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
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1033 45%, #0f172a 100%)",
          color: "white",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "linear-gradient(135deg, #8ec5ff, #a78bfa)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
          <span style={{ fontSize: 28, opacity: 0.85 }}>Send Studio</span>
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.05,
            maxWidth: 900,
            background: "linear-gradient(90deg, #8ec5ff, #c4b5fd, #5eead4)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Email CRM for modern teams
        </div>
        <p style={{ fontSize: 28, marginTop: 24, opacity: 0.75, maxWidth: 820 }}>
          Templates, campaigns, and delivery analytics — powered by Resend
        </p>
      </div>
    ),
    { ...size },
  );
}
