import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion"

import type { CaptureManifest } from "../types"
import { getStackedTiming } from "../stackedTiming"

export type StackedStillsProps = {
  manifestPath?: string
  manifest?: CaptureManifest
}

export function StackedStillsScene({ manifest }: StackedStillsProps) {
  const frame = useCurrentFrame()
  const { fps, width, height } = useVideoConfig()
  const stills = (manifest?.segments ?? [])
    .filter((segment) => segment.kind !== "tool")
    .map((segment) => segment.still)
    .filter((still): still is string => Boolean(still))

  const timing = getStackedTiming(stills.length, fps)
  const cardWidth = width * 0.74
  const cardHeight = Math.min(height * 0.62, cardWidth * (9 / 16))
  const baseX = width / 2
  const baseY = height * 0.25 + cardHeight * 0.25
  const maxCount = Math.max(1, stills.length)
  const buildEnd = (maxCount - 1) * timing.stagger + timing.inDuration
  const buildProgress = interpolate(frame, [0, buildEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  const targetScale = interpolate(maxCount, [1, 3, 5], [1, 0.92, 0.86], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  const stackScale = interpolate(buildProgress, [0, 1], [1, targetScale], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })

  return (
    <AbsoluteFill style={{ backgroundColor: "#DDDDDD", perspective: 1400 }}>
      {stills.map((still, index) => {
        const start = index * timing.stagger
        const inEnd = start + timing.inDuration
        const enter = interpolate(frame, [start, inEnd], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
        const spread = interpolate(frame, [timing.spreadStart, timing.spreadEnd], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })

        const offsetX = 0
        const liftPerStack = 10
        let stackLift = 0
        for (let j = index + 1; j < maxCount; j += 1) {
          const jStart = j * timing.stagger
          const jEnd = jStart + timing.inDuration
          const jEnter = interpolate(frame, [jStart, jEnd], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          })
          stackLift += jEnter * liftPerStack
        }
        const offsetY = index * 64 - stackLift

        const spreadOffsetX = 0
        const spreadOffsetY = index * 170

        const x = interpolate(spread, [0, 1], [offsetX, spreadOffsetX])
        const y = interpolate(spread, [0, 1], [offsetY, spreadOffsetY])

        const lift = interpolate(enter, [0, 1], [height * 1.05, 0])
        const scale = interpolate(enter, [0, 1], [0.98, 1])
        const perCardScale = 0.92 + (index / Math.max(1, maxCount - 1)) * 0.1
        const tilt = interpolate(enter, [0, 1], [18, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
        const visible = enter > 0 ? 1 : 0

        return (
          <div
            key={still}
            style={{
              position: "absolute",
              left: baseX,
              top: baseY,
              width: cardWidth,
              height: cardHeight,
              transform: `translate(-50%, -50%) translate(${x}px, ${y + lift}px) rotateX(${tilt}deg) scale(${
                scale * stackScale * perCardScale
              })`,
              transformOrigin: "center center",
              opacity: visible,
              borderRadius: 0,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
              backgroundColor: "#0e0f12",
              zIndex: index,
            }}
          >
            <Img
              src={staticFile(still)}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        )
      })}
    </AbsoluteFill>
  )
}
