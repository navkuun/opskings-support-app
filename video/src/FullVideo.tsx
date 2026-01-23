import type { ReactNode } from "react"
import { AbsoluteFill } from "remotion"
import { TransitionSeries } from "@remotion/transitions"
import { fade } from "@remotion/transitions/fade"

import { Scene } from "./components/Scene"
import { IntroScene } from "./scenes/IntroScene"
import { OutroScene } from "./scenes/OutroScene"
import type { CaptureManifest } from "./types"
import { getIntroFrames, getOutroFrames, getTransitionTiming } from "./timing"

export type FullVideoProps = {
  manifestPath: string
  manifest?: CaptureManifest
}

const SCENE_META: Array<{ id: string; title: string; subtitle?: string }> = [
  { id: "dashboard", title: "Dashboard overview", subtitle: "Filters + KPI trends" },
  { id: "tickets", title: "Ticket command center", subtitle: "Search and triage fast" },
  { id: "response-time", title: "Response time", subtitle: "SLA performance at a glance" },
  { id: "teams", title: "Team performance", subtitle: "Agent output and quality" },
  { id: "clients", title: "Client analysis", subtitle: "Budget vs. support demand" },
  { id: "command-palette", title: "Command palette", subtitle: "Jump anywhere in seconds" },
  { id: "client-tickets", title: "Client view", subtitle: "A focused ticket list" },
]

export function FullVideo({ manifest }: FullVideoProps) {
  if (!manifest) {
    return <AbsoluteFill style={{ backgroundColor: "#0b0f14" }} />
  }

  const transitionTiming = getTransitionTiming(manifest.fps)
  const sequences: ReactNode[] = []

  sequences.push(
    <TransitionSeries.Sequence key="intro" durationInFrames={getIntroFrames(manifest.fps)}>
      <IntroScene />
    </TransitionSeries.Sequence>,
  )
  sequences.push(
    <TransitionSeries.Transition key="intro-transition" presentation={fade()} timing={transitionTiming} />,
  )

  manifest.segments.forEach((segment, index) => {
    const meta = SCENE_META.find((entry) => entry.id === segment.id)
    sequences.push(
      <TransitionSeries.Sequence key={segment.id} durationInFrames={segment.durationInFrames}>
        <Scene
          title={meta?.title ?? segment.id}
          subtitle={meta?.subtitle}
          file={segment.file}
          width={manifest.width}
          height={manifest.height}
          durationInFrames={segment.durationInFrames}
        />
      </TransitionSeries.Sequence>,
    )

    if (index < manifest.segments.length - 1) {
      sequences.push(
        <TransitionSeries.Transition
          key={`${segment.id}-transition`}
          presentation={fade()}
          timing={transitionTiming}
        />,
      )
    }
  })

  sequences.push(
    <TransitionSeries.Transition key="outro-transition" presentation={fade()} timing={transitionTiming} />,
  )
  sequences.push(
    <TransitionSeries.Sequence key="outro" durationInFrames={getOutroFrames(manifest.fps)}>
      <OutroScene />
    </TransitionSeries.Sequence>,
  )

  return (
    <AbsoluteFill>
      <TransitionSeries>{sequences}</TransitionSeries>
    </AbsoluteFill>
  )
}
