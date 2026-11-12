import { ImageResponse } from "next/og";

/** The card shown when someone shares the site. Built once at deploy time; the 93 is the site's real example result. */
export const alt = "Fishy: How Fishy is your link? An example result shows a risk of 93 out of 100 for paypa1-secure-update.com.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#0B1220";
const TITLE = "How Fishy is your link?";
const BODY = "Two machine learning models score a link and explain why. A CSIT375 student project.";

/**
 * Plus Jakarta Sans at one weight (only the letters used), fetched once at build time. Google serves a TTF (which the image renderer
 * needs) to plain server requests. If the fetch fails, the image falls back to the default font rather than
 * failing the deploy.
 */
async function loadFont(weight: number, text: string): Promise<ArrayBuffer | null> {
  try {
    const query = `family=Plus+Jakarta+Sans:wght@${weight}&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(`https://fonts.googleapis.com/css2?${query}`)).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    const response = await fetch(url);
    return response.ok ? await response.arrayBuffer() : null;
  } catch {
    return null;
  }
}

const CIRCUMFERENCE = 2 * Math.PI * 56;
const RISK = 93;

function LogoMark() {
  return (
    <svg width="62" height="36" viewBox="0 9 80 46">
      <path d="M15 33 3 21v24z" fill="#fff" stroke={INK} strokeWidth="3.2" strokeLinejoin="round" />
      <path d="M40 18c4-6 10-9 16-8-2 3-4 6-5 9" fill="#ccfbf1" stroke={INK} strokeWidth="3.2" strokeLinejoin="round" />
      <path d="M14 33c9-16 25-22 41-16 9 3.3 16 10 20 16-4 6-11 12.7-20 16-16 6-32 0-41-16z" fill="#fff" stroke={INK} strokeWidth="3.2" strokeLinejoin="round" />
      <path d="M52 29q3-3 6 0" stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M62 29q3-3 6 0" stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M57 38q3 2.6 6 0" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export default async function OpengraphImage() {
  const glyphs = `Fishy${TITLE}${BODY}93 risk out of 100 Dangerous paypa1-secure-update.com`;
  const [bold, regular] = await Promise.all([loadFont(800, glyphs), loadFont(500, glyphs)]);
  const fonts = [
    ...(bold ? [{ name: "Jakarta", data: bold, weight: 800 as const, style: "normal" as const }] : []),
    ...(regular ? [{ name: "Jakarta", data: regular, weight: 500 as const, style: "normal" as const }] : []),
  ];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", gap: 64, padding: "64px 80px", fontFamily: "Jakarta",
        background: "linear-gradient(180deg, #2a9fb3 0%, #5cc6cf 50%, #a8e8e3 100%)", color: INK }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <LogoMark />
            <span style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.04em" }}>Fishy</span>
          </div>
          <div style={{ fontSize: 72, lineHeight: 1, fontWeight: 800, letterSpacing: "-0.045em" }}>{TITLE}</div>
          <div style={{ fontSize: 28, lineHeight: 1.3, fontWeight: 500, color: "#1F2937" }}>{BODY}</div>
        </div>
        <div style={{ width: 360, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: 32,
          borderRadius: 24, background: "#fff", boxShadow: "0 40px 80px -40px rgba(11,40,50,0.5)" }}>
          <div style={{ position: "relative", width: 160, height: 160, display: "flex" }}>
            <svg width="160" height="160" viewBox="0 0 132 132">
              <circle cx="66" cy="66" r="56" fill="none" stroke="#F1F2F5" strokeWidth="11" />
              <circle cx="66" cy="66" r="56" fill="none" stroke="#E11D48" strokeWidth="11" strokeLinecap="round"
                strokeDasharray={`${(RISK / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`} transform="rotate(-90 66 66)" />
            </svg>
            <div style={{ position: "absolute", top: 0, left: 0, width: 160, height: 160, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 48, fontWeight: 800, color: "#BE123C", lineHeight: 1 }}>{RISK}</span>
              <span style={{ fontSize: 14, fontWeight: 500, color: "#5B6474" }}>risk out of 100</span>
            </div>
          </div>
          <span style={{ padding: "4px 12px", borderRadius: 9999, background: "#FFF1F2", color: "#BE123C", fontSize: 16, fontWeight: 600 }}>Dangerous</span>
          <span style={{ fontSize: 16, color: "#5B6474" }}>paypa1-secure-update.com</span>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
