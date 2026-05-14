import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";
import { theme } from "../theme";

export const SceneHook = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoIn = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const t1 = spring({ frame: frame - 18, fps, config: { damping: 18 } });
  const t2 = spring({ frame: frame - 32, fps, config: { damping: 18 } });
  const float = Math.sin(frame / 12) * 8;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          transform: `scale(${logoIn}) translateY(${float}px)`,
          width: 220,
          height: 220,
          borderRadius: 60,
          background: `linear-gradient(135deg, ${theme.accent}, #FF8E53)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Space Grotesk, sans-serif",
          color: "white",
          fontSize: 130,
          fontWeight: 700,
          boxShadow: `0 30px 80px ${theme.accent}55`,
          marginBottom: 80,
        }}
      >
        N
      </div>
      <div
        style={{
          opacity: t1,
          transform: `translateY(${interpolate(t1, [0, 1], [40, 0])}px)`,
          fontFamily: "Space Grotesk, sans-serif",
          fontSize: 110,
          fontWeight: 700,
          color: "white",
          letterSpacing: -2,
          textAlign: "center",
        }}
      >
        Book a ride
      </div>
      <div
        style={{
          opacity: t2,
          transform: `translateY(${interpolate(t2, [0, 1], [30, 0])}px)`,
          fontFamily: "Inter, sans-serif",
          fontSize: 44,
          fontWeight: 400,
          color: theme.accentSoft,
          marginTop: 20,
          letterSpacing: 1,
        }}
      >
        in 30 seconds.
      </div>
    </AbsoluteFill>
  );
};
