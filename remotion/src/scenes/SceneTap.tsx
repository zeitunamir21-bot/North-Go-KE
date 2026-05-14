import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";
import { theme } from "../theme";
import { PhoneFrame } from "../components/PhoneFrame";

export const SceneTap = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Cursor moves to card and taps
  const cursorX = interpolate(frame, [0, 30], [600, 380], { extrapolateRight: "clamp" });
  const cursorY = interpolate(frame, [0, 30], [200, 700], { extrapolateRight: "clamp" });
  const tap = spring({ frame: frame - 35, fps, config: { damping: 12, stiffness: 250 } });
  const ripple = interpolate(frame, [38, 70], [0, 1], { extrapolateRight: "clamp" });
  const cardLift = interpolate(frame, [38, 55], [1, 1.04], { extrapolateRight: "clamp" });
  const labelIn = spring({ frame: frame - 50, fps, config: { damping: 16 } });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative" }}>
        <PhoneFrame>
          <div style={{ padding: "30px 40px", fontFamily: "Inter, sans-serif" }}>
            <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 44, fontWeight: 700, color: theme.ink }}>
              Available trips
            </div>
            <div style={{ fontSize: 24, color: theme.inkSoft, marginTop: 8 }}>
              Pay on board · No upfront fee
            </div>
            <div style={{ marginTop: 40 }}>
              <div
                style={{
                  transform: `scale(${cardLift})`,
                  background: "white",
                  borderRadius: 28,
                  padding: 30,
                  boxShadow: `0 ${20 + ripple * 30}px ${50 + ripple * 30}px rgba(255,107,53,${0.15 + ripple * 0.25})`,
                  border: `2px solid ${theme.accent}`,
                  position: "relative",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 32, fontWeight: 700, color: theme.ink }}>
                      Isiolo → Nairobi
                    </div>
                    <div style={{ fontSize: 22, color: theme.inkSoft, marginTop: 6 }}>Today · 6:30 AM</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 30, fontWeight: 700, color: theme.accent }}>
                      KES 1,500
                    </div>
                    <div style={{ fontSize: 18, color: theme.inkSoft, marginTop: 4 }}>8 seats left</div>
                  </div>
                </div>
                {/* Ripple */}
                <div
                  style={{
                    position: "absolute",
                    left: 200,
                    top: 80,
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    background: theme.accent,
                    opacity: 0.4 - ripple * 0.4,
                    transform: `translate(-50%,-50%) scale(${1 + ripple * 8})`,
                  }}
                />
              </div>
              {/* Tap label */}
              <div
                style={{
                  marginTop: 40,
                  textAlign: "center",
                  opacity: labelIn,
                  transform: `translateY(${interpolate(labelIn, [0, 1], [20, 0])}px)`,
                  fontFamily: "Space Grotesk, sans-serif",
                  fontSize: 32,
                  fontWeight: 500,
                  color: theme.ink,
                }}
              >
                Tap to reserve →
              </div>
            </div>
          </div>
        </PhoneFrame>
        {/* Cursor */}
        <div
          style={{
            position: "absolute",
            left: cursorX,
            top: cursorY,
            transform: `scale(${1 - tap * 0.25})`,
            width: 80,
            height: 80,
            pointerEvents: "none",
          }}
        >
          <svg viewBox="0 0 24 24" width="80" height="80">
            <path d="M5 3 L5 19 L9 15 L11.5 21 L14 20 L11.5 14 L17 14 Z" fill="white" stroke="#0A1628" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};
