import { CalculateMetadataFunction, staticFile } from "remotion"

import type { CaptureManifest } from "./types"
import type { FullVideoProps } from "./FullVideo"

export const calculateMetadata: CalculateMetadataFunction<FullVideoProps> = async ({ props }) => {
  const response = await fetch(staticFile(props.manifestPath))
  const manifest = (await response.json()) as CaptureManifest

  const fps = manifest.fps || 30

  const segmentFrames = manifest.segments.reduce((sum, segment) => sum + segment.durationInFrames, 0)

  return {
    durationInFrames: Math.max(1, segmentFrames),
    fps,
    width: manifest.width,
    height: manifest.height,
    props: {
      ...props,
      manifest,
    },
  }
}
