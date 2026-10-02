import { ImageResponse } from "next/og";
import { LOGO_BARS } from "@/components/ui/Logo";

// Imaginea afisata cand linkul aplicatiei e trimis pe retele sociale sau in mesaje; generata la build
export const alt = "UniProject Hub: student project management platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NAVY = "#1e3a5f";
const unit = 120 / 32;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: NAVY, padding: "72px 80px", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
          <div style={{ width: 120, height: 120, borderRadius: 30, background: "white", position: "relative", display: "flex" }}>
            {LOGO_BARS.map(b => (
              <div key={b.y} style={{ position: "absolute", left: b.x * unit, top: b.y * unit, width: b.w * unit, height: 4 * unit, borderRadius: 2 * unit, background: NAVY }} />
            ))}
          </div>
          <div style={{ fontSize: 76, fontWeight: 700 }}>UniProject Hub</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 44, lineHeight: 1.25 }}>Student projects, from proposal to evaluation</div>
          <div style={{ fontSize: 28, color: "#c3d3e6" }}>Milestones · Tasks · Teams & chat · Rubric evaluations · PDF reports</div>
        </div>
        <div style={{ width: 160, height: 8, borderRadius: 4, background: "#d9a066" }} />
      </div>
    ),
    size,
  );
}
