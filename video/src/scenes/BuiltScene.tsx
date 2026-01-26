import { Audio } from "@remotion/media"
import { AbsoluteFill, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion"
import { ibmPlexSans } from "../fonts"

const fontFamily = ibmPlexSans

const BASE_TEXT = "So this is what we built"
const HIGHLIGHT_TEXT = " for you"
const HIGHLIGHT_COLOR = "#ff7a00"

export function BuiltScene() {
  const frame = useCurrentFrame()
  const { fps, width, durationInFrames } = useVideoConfig()
  const scale = width / 1280
  const logoWidth = width * 0.09
  const logoPad = width * 0.02
  const typingDuration = Math.round(fps * 1.2)

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
        <TypingLine baseText={BASE_TEXT} highlightText={HIGHLIGHT_TEXT} durationInFrames={typingDuration} fps={fps} />
      </div>
    </AbsoluteFill>
  )
}

function TypingLine({
  baseText,
  highlightText,
  durationInFrames,
  fps,
}: {
  baseText: string
  highlightText: string
  durationInFrames: number
  fps: number
}) {
  const frame = useCurrentFrame()
  const fullText = `${baseText}${highlightText}`
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.linear,
  })
  const visibleChars = Math.floor(progress * fullText.length)
  const baseChars = Math.min(visibleChars, baseText.length)
  const highlightChars = Math.max(0, visibleChars - baseText.length)
  const baseDisplay = baseText.slice(0, baseChars)
  const highlightDisplay = highlightText.slice(0, highlightChars)
  const cursorOn = Math.floor(frame / Math.max(1, fps * 0.2)) % 2 === 0
  const showCursor = progress < 1

  return (
    <span>
      {baseDisplay}
      {highlightDisplay ? <span style={{ color: HIGHLIGHT_COLOR }}>{highlightDisplay}</span> : null}
      {showCursor ? <span style={{ marginLeft: 2 }}>{cursorOn ? "|" : " "}</span> : null}
    </span>
  )
}
