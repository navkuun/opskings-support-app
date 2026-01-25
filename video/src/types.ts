export type CaptureSegment = {
  id: string
  file: string
  still?: string
  durationMs: number
  durationInFrames: number
}

export type CaptureManifest = {
  fps: number
  width: number
  height: number
  createdAt: string
  segments: CaptureSegment[]
}
