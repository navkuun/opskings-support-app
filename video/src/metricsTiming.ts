export type MetricsTiming = {
  intro: number
  sectionDuration: number
  enterDuration: number
  exitDuration: number
  endHold: number
  totalFrames: number
}

export function getMetricsTiming(count: number, fps: number): MetricsTiming {
  const intro = Math.round(fps * 0.35)
  const sectionDuration = Math.round(fps * 2.0)
  const enterDuration = Math.round(fps * 0.25)
  const exitDuration = Math.round(fps * 0.25)
  const endHold = Math.round(fps * 0.3)
  const safeCount = Math.max(1, count)
  const totalFrames = intro + sectionDuration * safeCount + endHold

  return {
    intro,
    sectionDuration,
    enterDuration,
    exitDuration,
    endHold,
    totalFrames,
  }
}
