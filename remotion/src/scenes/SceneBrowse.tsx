import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";
import { theme } from "../theme";
import { PhoneFrame } from "../components/PhoneFrame";

const trips = [
  { route: "Isiolo → Nairobi", time: "Today · 6:30 AM", price: "KES 1,500", seats: "8 seats left" },
  { route: "Nairobi → Isiolo", time: "Today · 2:00 PM", price: "KES 1,500", seats: "5 seats left" },
  { route: "Isiolo → Nanyuki", time: "Today · 4:15 PM", price: "KES 600", seats: "3 seats left" },
];

export const SceneBrowse = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phoneIn = spring({ frame, fps, config: { damping: 18, stiffness: 90 } });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ transform: `scale(${0.95 + phoneIn * 0.05}) translateY(${interpolate(phoneIn, [0, 1], [80, 0])}px)`, opacity: phoneIn }}>
        <PhoneFrame>
          <div style={{ padding: "30px 40px", fontFamily: "Inter, sans-serif" }}>
            <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 44, fontWeight: 700, color: theme.ink }}>
              Available trips
            </div>
            <div style={{ fontSize: 24, color: theme.inkSoft, marginTop: 8 }}>
              Pay on board · No upfront fee
            </div>
            <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 24 }}>
              {trips.map((t, i) => {
                const cardIn = spring({ frame: frame - 12 - i * 14, fps, config: { damping: 16 } });
                return (
                  <div
                    key={i}
                    style={{
                      transform: `translateX(${interpolate(cardIn, [0, 1], [400, 0])}px)`,
                      opacity: cardIn,
                      background: "white",
                      borderRadius: 28,
                      padding: 30,
                      boxShadow: "0 10px 30px rgba(10,22,40,0.08)",
                      border: i === 0 ? `2px solid ${theme.accent}` : "2px solid transparent",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 32, fontWeight: 700, color: theme.ink }}>
                          {t.route}
                        </div>
                        <div style={{ fontSize: 22, color: theme.inkSoft, marginTop: 6 }}>{t.time}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 30, fontWeight: 700, color: theme.accent }}>
                          {t.price}
                        </div>
                        <div style={{ fontSize: 18, color: theme.inkSoft, marginTop: 4 }}>{t.seats}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </PhoneFrame>
      </div>
    </AbsoluteFill>
  );
};
