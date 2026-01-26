import { Audio } from "@remotion/media"
import { AbsoluteFill, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion"
import { ibmPlexSans } from "../fonts"

export function OutroScene() {
  const frame = useCurrentFrame()
  const { fps, width } = useVideoConfig()
  const scale = width / 1280

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
        backgroundColor: "#101014",
        color: "#ffffff",
        fontFamily: ibmPlexSans,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Sequence from={0}>
        <Audio src={staticFile("sfx/swoosh_out.mp3")} volume={0.24} />
      </Sequence>
      <div style={{ textAlign: "center", opacity }}>
        <Img
          src={staticFile("opskings-full-white.svg")}
          alt="OpsKings"
          style={{ width: 280 * scale, height: "auto", margin: "0 auto" }}
        />
        <div
          style={{
            marginTop: 20 * scale,
            fontSize: 20 * scale,
            fontWeight: 600,
            color: "#ffffff",
            textShadow: "0 8px 20px rgba(0,0,0,0.25), 0 0 14px rgba(255,255,255,0.12)",
          }}
        >
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
