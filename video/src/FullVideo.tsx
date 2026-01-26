import type { ReactNode } from "react"
import { AbsoluteFill, Sequence, staticFile } from "remotion"
import { Audio } from "@remotion/media"

import { IntroScene } from "./scenes/IntroScene"
import { OutroScene } from "./scenes/OutroScene"
import { TextScene } from "./scenes/TextScene"
import { DashboardMetricsIntroScene } from "./scenes/DashboardMetricsIntroScene"
import { StackedStillsScene } from "./scenes/StackedStillsScene"
import { DashboardMetricsScene, DASHBOARD_METRICS_COUNT } from "./scenes/DashboardMetricsScene"
import { TicketsIntroScene } from "./scenes/TicketsIntroScene"
import { TicketsScene } from "./scenes/TicketsScene"
import { ViewDocsScene } from "./scenes/ViewDocsScene"
import { BuiltScene } from "./scenes/BuiltScene"
import type { CaptureManifest } from "./types"
import { getStackedTiming } from "./stackedTiming"
import { getMetricsTiming } from "./metricsTiming"

export type FullVideoProps = {
  manifestPath: string
  manifest?: CaptureManifest
}

const INTRO_FRAMES = 60
const TEXT_FRAMES = 120
const BUILT_FRAMES = 54
const METRICS_INTRO_FRAMES = 60
const TICKETS_INTRO_FRAMES = 60
const TICKETS_FRAMES = 210
const VIEW_DOCS_FRAMES = 60
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

  sequences.push(
    <Sequence key="built" from={from} durationInFrames={BUILT_FRAMES}>
      <BuiltScene />
    </Sequence>,
  )
  from += BUILT_FRAMES

  const stackedCount = manifest.segments.filter((segment) => segment.kind !== "tool" && segment.still).length
  const stackedTiming = getStackedTiming(stackedCount, manifest.fps ?? 30)
  sequences.push(
    <Sequence key="stacked" from={from} durationInFrames={stackedTiming.totalFrames}>
      <StackedStillsScene manifest={manifest} />
    </Sequence>,
  )
  from += stackedTiming.totalFrames

  sequences.push(
    <Sequence key="metrics-intro" from={from} durationInFrames={METRICS_INTRO_FRAMES}>
      <DashboardMetricsIntroScene />
    </Sequence>,
  )
  from += METRICS_INTRO_FRAMES

  const metricsTiming = getMetricsTiming(DASHBOARD_METRICS_COUNT, manifest.fps ?? 30)
  sequences.push(
    <Sequence key="metrics" from={from} durationInFrames={metricsTiming.totalFrames}>
      <DashboardMetricsScene />
    </Sequence>,
  )
  from += metricsTiming.totalFrames

  sequences.push(
    <Sequence key="tickets-intro" from={from} durationInFrames={TICKETS_INTRO_FRAMES}>
      <TicketsIntroScene />
    </Sequence>,
  )
  from += TICKETS_INTRO_FRAMES

  sequences.push(
    <Sequence key="tickets" from={from} durationInFrames={TICKETS_FRAMES}>
      <TicketsScene />
    </Sequence>,
  )
  from += TICKETS_FRAMES

  sequences.push(
    <Sequence key="view-docs" from={from} durationInFrames={VIEW_DOCS_FRAMES}>
      <ViewDocsScene />
    </Sequence>,
  )
  from += VIEW_DOCS_FRAMES

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
