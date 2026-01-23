import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion"
import { ibmPlexMono } from "../fonts"

export function OutroScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const fadeIn = interpolate(frame, [0, fps * 0.6], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  })
  const fadeOut = interpolate(frame, [fps * 2.0, fps * 2.6], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  })

  const opacity = Math.min(fadeIn, fadeOut)

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0b0f14",
        color: "#f8f8f8",
        fontFamily: ibmPlexMono,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ textAlign: "center", opacity }}>
        <Img
          src={staticFile("logo-full.png")}
          alt="OpsKings"
          style={{ width: 280, height: "auto", margin: "0 auto" }}
        />
        <div style={{ marginTop: 20, fontSize: 20, fontWeight: 600, color: "#e6e2db" }}>
          Built for teams who move fast
        </div>
        <div
          style={{
            marginTop: 12,
            width: 100,
            height: 4,
            borderRadius: 999,
            backgroundColor: "#a68358",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        />
      </div>
    </AbsoluteFill>
  )
}
