import { Video } from "@remotion/media"
import { staticFile } from "remotion"

export function VideoClip({
  file,
  width,
  height,
  muted = true,
}: {
  file: string
  width: number
  height: number
  muted?: boolean
}) {
  return (
    <Video
      src={staticFile(file)}
      muted={muted}
      style={{
        width,
        height,
        objectFit: "cover",
      }}
    />
  )
}
