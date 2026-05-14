import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate, Sequence } from "remotion";
import { theme } from "../theme";
import { PhoneFrame } from "../components/PhoneFrame";

const fields = [
  { label: "Full name", typed: "Amani Wanjiru", delay: 5 },
  { label: "Phone", typed: "+254 712 345 678", delay: 35 },
  { label: "Pickup", typed: "Isiolo town", delay: 70 },
  { label: "Seats", typed: "2", delay: 100 },
];

function TypedField({ label, typed, delay, frame, fps }: { label: string; typed: string; delay: number; frame: number; fps: number }) {
  const labelIn = spring({ frame: frame - delay, fps, config: { damping: 18 } });
  const localFrame = frame - delay - 4;
  const chars = Math.max(0, Math.min(typed.length, Math.floor(localFrame * 0.9)));
  const shown = typed.slice(0, chars);
  const showCursor = localFrame > 0 && chars < typed.length;
  return (
    <div
      style={{
        opacity: labelIn,
        transform: `translateY(${interpolate(labelIn, [0, 1], [20, 0])}px)`,
        marginBottom: 24,
      }}
    >
      <div style={{ fontSize: 20, color: theme.inkSoft, fontWeight: 500, marginBottom: 10 }}>{label}</div>
      <div
        style={{
          background: "white",
          borderRadius: 18,
          padding: "22px 26px",
          fontFamily: "Inter, sans-serif",
          fontSize: 28,
          fontWeight: 500,
          color: theme.ink,
          border: `2px solid ${chars > 0 ? theme.accent : "rgba(10,22,40,0.08)"}`,
          minHeight: 30,
        }}
      >
        {shown}
        {showCursor && <span style={{ color: theme.accent }}>|</span>}
      </div>
    </div>
  );
}

export const SceneForm = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const buttonPress = spring({ frame: frame - 130, fps, config: { damping: 14, stiffness: 200 } });
  const totalIn = spring({ frame: frame - 115, fps, config: { damping: 18 } });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <PhoneFrame>
        <div style={{ padding: "30px 40px", fontFamily: "Inter, sans-serif" }}>
          <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 40, fontWeight: 700, color: theme.ink }}>
            Reserve your seat
          </div>
          <div style={{ fontSize: 22, color: theme.inkSoft, marginTop: 4, marginBottom: 30 }}>
            Isiolo → Nairobi · 6:30 AM
          </div>
          {fields.map((f) => (
            <TypedField key={f.label} {...f} frame={frame} fps={fps} />
          ))}
          <div
            style={{
              opacity: totalIn,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "20px 0",
              borderTop: "1px solid rgba(10,22,40,0.1)",
              marginTop: 10,
            }}
          >
            <span style={{ fontSize: 22, color: theme.inkSoft }}>Total · pay on board</span>
            <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 38, fontWeight: 700, color: theme.ink }}>
              KES 3,000
            </span>
          </div>
          <div
            style={{
              marginTop: 24,
              transform: `scale(${1 - buttonPress * 0.08 + Math.max(0, buttonPress - 0.5) * 0.08})`,
              background: theme.accent,
              borderRadius: 22,
              padding: "30px 0",
              textAlign: "center",
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 32,
              fontWeight: 700,
              color: "white",
              boxShadow: `0 20px 40px ${theme.accent}55`,
            }}
          >
            Reserve seat
          </div>
        </div>
      </PhoneFrame>
    </AbsoluteFill>
  );
};
