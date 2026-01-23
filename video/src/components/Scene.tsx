import { AbsoluteFill } from "remotion"
import { SceneTitle } from "./SceneTitle"
import { VideoClip } from "./VideoClip"

export function Scene({
  title,
  subtitle,
  file,
  width,
  height,
  durationInFrames,
}: {
  title: string
  subtitle?: string
  file: string
  width: number
  height: number
  durationInFrames: number
}) {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0f14" }}>
      <VideoClip file={file} width={width} height={height} />
      <SceneTitle title={title} subtitle={subtitle} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  )
}
