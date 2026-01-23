import { linearTiming } from "@remotion/transitions"

export function getIntroFrames(fps: number) {
  return Math.round(fps * 2.0)
}

export function getOutroFrames(fps: number) {
  return Math.round(fps * 2.0)
}

export function getTransitionTiming(fps: number) {
  return linearTiming({ durationInFrames: Math.round(fps * 0.4) })
}
