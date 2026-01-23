import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion"
import { ibmPlexMono } from "../fonts"

export function SceneTitle({
  title,
  subtitle,
  durationInFrames,
}: {
  title: string
  subtitle?: string
  durationInFrames: number
}) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const introDuration = Math.min(Math.round(fps * 0.6), Math.max(12, Math.floor(durationInFrames * 0.25)))
  const outroDuration = Math.min(Math.round(fps * 0.5), Math.max(10, Math.floor(durationInFrames * 0.2)))
  const outroStart = Math.max(durationInFrames - outroDuration, introDuration + 1)

  const introProgress = interpolate(frame, [0, introDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  })
  const outroProgress = interpolate(frame, [outroStart, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  })

  const opacity = Math.min(introProgress, outroProgress)
  const translateY = interpolate(introProgress, [0, 1], [12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: 36,
          left: 40,
          right: 40,
          display: "flex",
          alignItems: "center",
          gap: 16,
          opacity,
          transform: `translateY(${translateY}px)`,
          padding: "12px 20px",
          borderRadius: 14,
          background: "linear-gradient(90deg, rgba(11,15,20,0.88) 0%, rgba(11,15,20,0.55) 55%, rgba(11,15,20,0) 100%)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        }}
      >
        <div
          style={{
            width: 6,
            height: subtitle ? 56 : 44,
            borderRadius: 999,
            backgroundColor: "#a68358",
          }}
        />
        <div style={{ color: "#f8f8f8", fontFamily: ibmPlexMono }}>
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: 0.5 }}>{title}</div>
          {subtitle ? (
            <div style={{ marginTop: 4, fontSize: 18, fontWeight: 400, color: "#e6e2db" }}>
              {subtitle}
            </div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  )
}
