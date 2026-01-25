import type { ReactNode } from "react"
import { AbsoluteFill, Img, Sequence, staticFile } from "remotion"
import { Audio } from "@remotion/media"

import { VideoClip } from "./components/VideoClip"
import type { CaptureManifest } from "./types"

export type FullVideoProps = {
  manifestPath: string
  manifest?: CaptureManifest
  useStills?: boolean
}

export function FullVideo({ manifest, useStills = false }: FullVideoProps) {
  if (!manifest) {
    return <AbsoluteFill style={{ backgroundColor: "#0b0f14" }} />
  }

  const sequences: ReactNode[] = []
  let from = 0

  manifest.segments.forEach((segment) => {
    const still = useStills ? segment.still : undefined
    sequences.push(
      <Sequence key={segment.id} from={from} durationInFrames={segment.durationInFrames}>
        {still ? (
          <Img
            src={staticFile(still)}
            style={{ width: manifest.width, height: manifest.height, objectFit: "cover" }}
          />
        ) : (
          <VideoClip file={segment.file} width={manifest.width} height={manifest.height} />
        )}
      </Sequence>,
    )
    from += segment.durationInFrames
  })
  const totalFrames = from

  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0f14" }}>
      <Audio src={staticFile("music.mp3")} volume={0.25} trimAfter={totalFrames} />
      {sequences}
    </AbsoluteFill>
  )
}
