import { Audio } from "@remotion/media"
import { AbsoluteFill, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion"
import { ibmPlexSans } from "../fonts"

const fontFamily = ibmPlexSans

const LINE = "View our docs for a full view of things!"

export function ViewDocsScene() {
  const frame = useCurrentFrame()
  const { fps, width, durationInFrames } = useVideoConfig()
  const scale = width / 1280
  const logoWidth = width * 0.09
  const logoPad = width * 0.02

  const enter = interpolate(frame, [0, fps * 0.4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  })
  const exit = interpolate(frame, [durationInFrames - fps * 0.35, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  })
  const opacity = Math.min(enter, 1 - exit)
  const translateY = interpolate(enter, [0, 1], [18 * scale, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  const typingDuration = Math.round(fps * 1.2)

  return (
    <AbsoluteFill style={{ backgroundColor: "#ffffff", fontFamily }}>
      <Sequence from={0}>
        <Audio src={staticFile("sfx/typing_text.mp3")} volume={0.18} trimAfter={typingDuration} />
      </Sequence>
      <Img
        src={staticFile("opskings-full-black.svg")}
        alt="OpsKings"
        style={{
          position: "absolute",
          top: logoPad,
          left: logoPad,
          width: logoWidth,
          height: "auto",
          opacity: 0.9,
          zIndex: 5,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "0 12%",
          transform: `translateY(${translateY}px)`,
          opacity,
          fontSize: 46 * scale,
          fontWeight: 600,
          color: "#0b0b0b",
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
        }}
      >
        <TypingLine text={LINE} startFrame={0} durationInFrames={typingDuration} fps={fps} />
      </div>
    </AbsoluteFill>
  )
}

function TypingLine({
  text,
  startFrame,
  durationInFrames,
  fps,
}: {
  text: string
  startFrame: number
  durationInFrames: number
  fps: number
}) {
  const frame = useCurrentFrame()
  const progress = interpolate(frame, [startFrame, startFrame + durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.linear,
  })
  const visibleChars = Math.floor(progress * text.length)
  const displayText = text.slice(0, visibleChars)
  const cursorOn = Math.floor(frame / Math.max(1, fps * 0.2)) % 2 === 0
  const showCursor = progress < 1

  return (
    <span>
      {displayText}
      {showCursor ? <span style={{ marginLeft: 2 }}>{cursorOn ? "|" : " "}</span> : null}
    </span>
  )
}
