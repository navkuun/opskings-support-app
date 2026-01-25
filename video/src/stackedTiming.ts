export type StackedTiming = {
  stagger: number
  inDuration: number
  hold: number
  spread: number
  spreadStart: number
  spreadEnd: number
  endHold: number
  totalFrames: number
}

export function getStackedTiming(count: number, fps: number): StackedTiming {
  const stagger = Math.round(fps * 0.9)
  const inDuration = Math.round(fps * 1.3)
  const hold = Math.round(fps * 0.9)
  const spread = Math.round(fps * 0.8)
  const endHold = Math.round(fps * 0.3)
  const safeCount = Math.max(1, count)
  const lastInEnd = (safeCount - 1) * stagger + inDuration
  const spreadStart = lastInEnd + hold
  const spreadEnd = spreadStart + spread
  const totalFrames = spreadEnd + endHold

  return { stagger, inDuration, hold, spread, spreadStart, spreadEnd, endHold, totalFrames }
}
