import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion"
import { ibmPlexMono } from "../fonts"

export function IntroScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const fadeIn = interpolate(frame, [0, fps * 0.6], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  })
  const scale = interpolate(frame, [0, fps * 0.6], [0.95, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  })

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
      <div style={{ textAlign: "center", opacity: fadeIn, transform: `scale(${scale})` }}>
        <Img
          src={staticFile("logo-full.png")}
          alt="OpsKings"
          style={{ width: 360, height: "auto", margin: "0 auto" }}
        />
        <div
          style={{
            marginTop: 24,
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: 0.5,
            color: "#e6e2db",
          }}
        >
          Support analytics in real time
        </div>
        <div
          style={{
            marginTop: 12,
            width: 140,
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
