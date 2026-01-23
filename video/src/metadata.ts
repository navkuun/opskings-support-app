import fs from "node:fs/promises"
import path from "node:path"
import { CalculateMetadataFunction } from "remotion"

import type { CaptureManifest } from "./types"
import type { FullVideoProps } from "./FullVideo"
import { getIntroFrames, getOutroFrames, getTransitionTiming } from "./timing"

async function readManifest(manifestPath: string) {
  const resolved = path.resolve(process.cwd(), "public", manifestPath)
  return fs.readFile(resolved, "utf8")
}

export const calculateMetadata: CalculateMetadataFunction<FullVideoProps> = async ({ props }) => {
  const raw = await readManifest(props.manifestPath)
  const manifest = JSON.parse(raw) as CaptureManifest

  const fps = manifest.fps || 30
  const introFrames = getIntroFrames(fps)
  const outroFrames = getOutroFrames(fps)
  const transitionTiming = getTransitionTiming(fps)
  const transitionFrames = transitionTiming.getDurationInFrames({ fps })

  const segmentFrames = manifest.segments.reduce((sum, segment) => sum + segment.durationInFrames, 0)
  const sequenceCount = manifest.segments.length + 2
  const totalFrames = introFrames + outroFrames + segmentFrames - transitionFrames * (sequenceCount - 1)

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
