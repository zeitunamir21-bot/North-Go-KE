import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";
import { theme } from "../theme";

export const SceneConfirmed = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const ringIn = spring({ frame, fps, config: { damping: 14, stiffness: 110 } });
  const checkLen = interpolate(frame, [12, 32], [0, 100], { extrapolateRight: "clamp" });
  const t1 = spring({ frame: frame - 30, fps, config: { damping: 18 } });
  const t2 = spring({ frame: frame - 48, fps, config: { damping: 18 } });
  const t3 = spring({ frame: frame - 70, fps, config: { damping: 18 } });
  const pulse = 1 + Math.sin(frame / 6) * 0.04;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      {/* Ring */}
      <div
        style={{
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${theme.success}33, transparent 70%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${ringIn * pulse})`,
        }}
      >
        <div
          style={{
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: theme.success,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 30px 80px ${theme.success}66`,
          }}
        >
          <svg width="140" height="140" viewBox="0 0 100 100">
            <path
              d="M 25 52 L 44 70 L 78 32"
              fill="none"
              stroke="white"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="100"
              strokeDashoffset={100 - checkLen}
            />
          </svg>
        </div>
      </div>

      <div
        style={{
          opacity: t1,
          transform: `translateY(${interpolate(t1, [0, 1], [30, 0])}px)`,
          fontFamily: "Space Grotesk, sans-serif",
          fontSize: 96,
          fontWeight: 700,
          color: "white",
          marginTop: 80,
          letterSpacing: -2,
          textAlign: "center",
        }}
      >
        Booked.
      </div>
      <div
        style={{
          opacity: t2,
          transform: `translateY(${interpolate(t2, [0, 1], [20, 0])}px)`,
          fontFamily: "Inter, sans-serif",
          fontSize: 38,
          fontWeight: 400,
          color: theme.accentSoft,
          marginTop: 16,
        }}
      >
        Seat #4 · Pay on board
      </div>

      {/* Driver pill */}
      <div
        style={{
          opacity: t3,
          transform: `translateY(${interpolate(t3, [0, 1], [30, 0])}px)`,
          marginTop: 60,
          display: "flex",
          alignItems: "center",
          gap: 20,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 60,
          padding: "20px 36px",
          backdropFilter: "blur(0)",
        }}
      >
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${theme.accent}, #FF8E53)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: 28,
            fontWeight: 700,
          }}
        >
          J
        </div>
        <div style={{ fontFamily: "Inter, sans-serif", color: "white" }}>
          <div style={{ fontSize: 26, fontWeight: 600 }}>Driver Joseph is on the way</div>
          <div style={{ fontSize: 20, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>
            ★ 4.9 · arriving 6:25 AM
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
