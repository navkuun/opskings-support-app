import { CalculateMetadataFunction, staticFile } from "remotion"

import type { CaptureManifest } from "./types"
import type { FullVideoProps } from "./FullVideo"
import { getStackedTiming } from "./stackedTiming"
import type { StackedStillsProps } from "./scenes/StackedStillsScene"
import { getMetricsTiming } from "./metricsTiming"
import { DASHBOARD_METRICS_COUNT } from "./scenes/DashboardMetricsScene"

async function loadManifest(manifestPath: string) {
  const response = await fetch(staticFile(manifestPath))
  return (await response.json()) as CaptureManifest
}

export const calculateMetadata: CalculateMetadataFunction<FullVideoProps> = async ({ props }) => {
  const manifest = await loadManifest(props.manifestPath)

  const fps = manifest.fps || 30

  const introFrames = 60
  const textFrames = 120
  const builtFrames = 54
  const metricsIntroFrames = 60
  const ticketsIntroFrames = 60
  const ticketsFrames = 210
  const viewDocsFrames = 60
  const outroFrames = 60
  const metricsFrames = getMetricsTiming(DASHBOARD_METRICS_COUNT, fps).totalFrames
  const stackedCount = manifest.segments.filter((segment) => segment.kind !== "tool" && segment.still).length
  const stackedFrames = getStackedTiming(stackedCount, fps).totalFrames
  const totalFrames =
    introFrames +
    textFrames +
    builtFrames +
    metricsIntroFrames +
    metricsFrames +
    stackedFrames +
    ticketsIntroFrames +
    ticketsFrames +
    viewDocsFrames +
    outroFrames

  return {
    durationInFrames: Math.max(1, totalFrames),
    fps,
    width: manifest.width,
    height: manifest.height,
    props: {
      ...props,
      manifest,
    },
  }
}

export const calculateStackedMetadata: CalculateMetadataFunction<StackedStillsProps> = async ({ props }) => {
  const manifest =
    props.manifest ?? (props.manifestPath ? await loadManifest(props.manifestPath) : undefined)
  if (!manifest) {
    throw new Error("StackedStillsScene requires a manifest or manifestPath.")
  }
  const fps = manifest.fps || 30
  const stackedCount = manifest.segments.filter((segment) => segment.kind !== "tool" && segment.still).length
  const stackedFrames = getStackedTiming(stackedCount, fps).totalFrames

  return {
    durationInFrames: Math.max(1, stackedFrames),
    fps,
    width: manifest.width,
    height: manifest.height,
    props: {
      ...props,
      manifest,
    },
  }
}
