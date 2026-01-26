import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion"
import { ibmPlexSans } from "../fonts"

const fontFamily = ibmPlexSans

const INTRO_LINE = "At OpsKings you told us..."
const PROBLEM_LINES = ["Clients were churning.", "You're team was suffering.", "Deals were being lost."]
const RED_WORDS = ["suffering", "lost"]
const ORANGE_WORDS: string[] = []

function getWordColor(word: string) {
  const normalized = word.toLowerCase().replace(/[^a-z]/g, "")
  if (normalized.startsWith("churn") || RED_WORDS.includes(normalized)) {
    return "#ff2b2b"
  }
  if (ORANGE_WORDS.includes(normalized)) {
    return "#1f1208"
  }
  return undefined
}

export function TextScene() {
  const frame = useCurrentFrame()
  const { fps, width } = useVideoConfig()
  const scale = width / 1280
  const logoWidth = width * 0.09
  const logoPad = width * 0.02
  const wordStagger = Math.round(fps * 0.06)
  const wordDuration = Math.round(fps * 0.28)
  const lineHold = Math.round(fps * 0.5)
  const lineOut = Math.round(fps * 0.18)
  const lineGap = Math.round(fps * 0.08)
  const baseStart = Math.round(fps * 0.1)
  const getInDuration = (words: string[]) => wordDuration + Math.max(0, words.length - 1) * wordStagger

  const introWords = INTRO_LINE.split(" ")
  const introInDuration = getInDuration(introWords)
  const introStart = baseStart
  const introInEnd = introStart + introInDuration
  const introHoldEnd = introInEnd + lineHold
  const introOutEnd = introHoldEnd + lineOut

  const groupStart = introOutEnd + lineGap
  const groupStagger = Math.round(fps * 0.7)
  const groupWords = PROBLEM_LINES.map((line) => line.split(" "))
  const groupStarts = PROBLEM_LINES.map((_, index) => groupStart + index * groupStagger)
  const groupInEnds = groupWords.map((words, index) => groupStarts[index] + getInDuration(words))
  const groupHoldEnd = Math.max(...groupInEnds) + Math.round(fps * 0.5)
  const groupOutEnd = groupHoldEnd + lineOut

  const p2 = interpolate(frame, [groupStarts[1], groupInEnds[1]], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  })
  const p3 = interpolate(frame, [groupStarts[2], groupInEnds[2]], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  })
  const lineSpacing = 62 * scale
  const baseY = [
    -lineSpacing * 0.5 * p2 - lineSpacing * 0.5 * p3,
    lineSpacing * 0.5 * p2 - lineSpacing * 0.5 * p3,
    lineSpacing * p3,
  ]

  const renderLine = ({
    line,
    words,
    start,
    inEnd,
    outStart,
    outEnd,
    centerOffset = 0,
  }: {
    line: string
    words: string[]
    start: number
    inEnd: number
    outStart: number
    outEnd: number
    centerOffset?: number
  }) => {
    const enterProgress = interpolate(frame, [start, inEnd], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    })
    const exitProgress = interpolate(frame, [outStart, outEnd], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.in(Easing.cubic),
    })
    const exitProgressInv = 1 - exitProgress
    const translateY = interpolate(enterProgress, [0, 1], [26 * scale, 0])
    const exitLift = interpolate(exitProgressInv, [0, 1], [0, -16 * scale])
    const opacity = Math.min(enterProgress, exitProgress)

    return (
      <div
        key={`${line}-${start}`}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) translateY(${centerOffset + translateY + exitLift}px)`,
          opacity,
          whiteSpace: "nowrap",
          maxWidth: "100%",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "baseline",
            gap: 12 * scale,
            whiteSpace: "nowrap",
          }}
        >
          {words.map((word, wordIndex) => {
            const wordStart = start + wordIndex * wordStagger
            const wordProgress = interpolate(frame, [wordStart, wordStart + wordDuration], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            })
            const wordTranslate = interpolate(wordProgress, [0, 1], [20 * scale, 0])
            const wordOpacity = Math.min(wordProgress, exitProgress)
            const color = getWordColor(word)

            return (
              <span
                key={`${word}-${wordIndex}`}
                style={{
                  display: "inline-block",
                  transform: `translateY(${wordTranslate}px)`,
                  opacity: wordOpacity,
                  color,
                }}
              >
                {word}
              </span>
            )
          })}
        </span>
      </div>
    )
  }


  return (
    <AbsoluteFill style={{ backgroundColor: "#ffffff" }}>
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
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 8%",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            fontSize: 52 * scale,
            fontWeight: 600,
            fontFamily,
            color: "#000000",
            textAlign: "center",
          }}
        >
        {renderLine({
          line: INTRO_LINE,
          words: introWords,
          start: introStart,
          inEnd: introInEnd,
            outStart: introHoldEnd,
            outEnd: introOutEnd,
          })}

          {PROBLEM_LINES.map((line, index) =>
            renderLine({
              line,
              words: groupWords[index],
              start: groupStarts[index],
              inEnd: groupInEnds[index],
              outStart: groupHoldEnd,
              outEnd: groupOutEnd,
              centerOffset: baseY[index],
            }),
          )}

      </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
