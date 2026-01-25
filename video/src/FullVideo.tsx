import type { ReactNode } from "react"
import { AbsoluteFill, Sequence, staticFile } from "remotion"
import { Audio } from "@remotion/media"

import { IntroScene } from "./scenes/IntroScene"
import { OutroScene } from "./scenes/OutroScene"
import { TextScene } from "./scenes/TextScene"
import { StackedStillsScene } from "./scenes/StackedStillsScene"
import type { CaptureManifest } from "./types"
import { getStackedTiming } from "./stackedTiming"

export type FullVideoProps = {
  manifestPath: string
  manifest?: CaptureManifest
}

const INTRO_FRAMES = 60
const TEXT_FRAMES = 180
const OUTRO_FRAMES = 60

export function FullVideo({ manifest }: FullVideoProps) {
  if (!manifest) {
    return <AbsoluteFill style={{ backgroundColor: "#0b0f14" }} />
  }

  const sequences: ReactNode[] = []
  let from = 0

  sequences.push(
    <Sequence key="intro" from={from} durationInFrames={INTRO_FRAMES}>
      <IntroScene />
    </Sequence>,
  )
  from += INTRO_FRAMES

  sequences.push(
    <Sequence key="text" from={from} durationInFrames={TEXT_FRAMES}>
      <TextScene />
    </Sequence>,
  )
  from += TEXT_FRAMES

  const stackedCount = manifest.segments.filter((segment) => segment.kind !== "tool" && segment.still).length
  const stackedTiming = getStackedTiming(stackedCount, manifest.fps ?? 30)
  sequences.push(
    <Sequence key="stacked" from={from} durationInFrames={stackedTiming.totalFrames}>
      <StackedStillsScene manifest={manifest} />
    </Sequence>,
  )
  from += stackedTiming.totalFrames

  sequences.push(
    <Sequence key="outro" from={from} durationInFrames={OUTRO_FRAMES}>
      <OutroScene />
    </Sequence>,
  )
  from += OUTRO_FRAMES
  const totalFrames = from

  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0f14" }}>
      <Audio src={staticFile("music.mp3")} volume={0.25} trimAfter={totalFrames} />
      {sequences}
    </AbsoluteFill>
  )
}
