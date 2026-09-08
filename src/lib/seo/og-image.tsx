export type OgImageProps = {
  eyebrow?: string;
  title: string;
  subtitle: string;
  accent?: string;
  badge?: string;
};

export function OgImageLayout({
  eyebrow = "Send Studio",
  title,
  subtitle,
  accent = "#8ec5ff",
  badge,
}: OgImageProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1033 45%, #0f172a 100%)",
        color: "white",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 420,
          height: 420,
          borderRadius: "9999px",
          background: `radial-gradient(circle, ${accent}33 0%, transparent 70%)`,
        }}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
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
          <span style={{ fontSize: 28, opacity: 0.85 }}>{eyebrow}</span>
        </div>
        {badge ? (
          <div
            style={{
              fontSize: 18,
              padding: "10px 18px",
              borderRadius: 999,
              border: "1px solid #ffffff33",
              background: "#ffffff12",
            }}
          >
            {badge}
          </div>
        ) : null}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 980 }}>
        <div
          style={{
            fontSize: 68,
            fontWeight: 700,
            lineHeight: 1.02,
            background: "linear-gradient(90deg, #8ec5ff, #c4b5fd, #5eead4)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {title}
        </div>
        <p style={{ fontSize: 30, margin: 0, opacity: 0.78, lineHeight: 1.35, maxWidth: 900 }}>
          {subtitle}
        </p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 22, opacity: 0.55 }}>
        <span>Resend</span>
        <span>·</span>
        <span>Next.js</span>
        <span>·</span>
        <span>Turso</span>
      </div>
    </div>
  );
}

export const ogImageSize = { width: 1200, height: 630 } as const;
export const ogImageContentType = "image/png";
