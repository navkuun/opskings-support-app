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

  if (stills.length === 0) {
    return <AbsoluteFill style={{ backgroundColor: "#DDDDDD" }} />
  }

  const timing = getStackedTiming(stills.length, fps)
  let cardWidth = width * 0.74
  let cardHeight = cardWidth * (9 / 16)
  const maxHeight = height * 0.7
  if (cardHeight > maxHeight) {
    cardHeight = maxHeight
    cardWidth = cardHeight * (16 / 9)
  }
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
  const expandProgress = interpolate(frame, [timing.spreadStart, timing.spreadEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  })
  const triptychHeightTarget = height * 0.42
  const triptychWidthTarget = triptychHeightTarget * (16 / 9)
  const triptychWidth = Math.min(width * 0.78, triptychWidthTarget)
  const triptychHeight = triptychWidth * (9 / 16)
  const triptychGapTarget = triptychHeight * 0.1
  const triptychGap = interpolate(expandProgress, [0, 1], [triptychGapTarget * 0.7, triptychGapTarget], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  const triptychCenterY = height * 0.53
  const triptychCenterX = width / 2
  const carouselFrame = frame - timing.carouselStart
  const stepIndex = Math.max(0, Math.floor(carouselFrame / timing.carouselStep))
  const carouselStartIndex = Math.max(0, maxCount - 2)
  const centerIndex = (carouselStartIndex + stepIndex) % maxCount
  const topIndex = (centerIndex - 1 + maxCount) % maxCount
  const bottomIndex = (centerIndex + 1) % maxCount

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
        const isLastThree = index >= Math.max(0, maxCount - 3)
        const slot = index - Math.max(0, maxCount - 3)
        const slotOffset = slot - 1

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

        const x = isLastThree ? offsetX : interpolate(spread, [0, 1], [offsetX, spreadOffsetX])
        const y = isLastThree ? offsetY : interpolate(spread, [0, 1], [offsetY, spreadOffsetY])

        const lift = interpolate(enter, [0, 1], [height * 1.05, 0])
        const scale = interpolate(enter, [0, 1], [0.98, 1])
        const perCardScale = 0.92 + (index / Math.max(1, maxCount - 1)) * 0.1
        const tilt = interpolate(enter, [0, 1], [18, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
        const visible = enter > 0 ? 1 : 0
        const baseScale = scale * stackScale * perCardScale
        const targetScale = (triptychWidth / cardWidth) * (0.94 + expandProgress * 0.06)
        const finalScale = isLastThree
          ? interpolate(expandProgress, [0, 1], [baseScale, targetScale], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          : baseScale
        const targetX = triptychCenterX - baseX
        const targetY = triptychCenterY + slotOffset * (triptychHeight + triptychGap) - baseY
        const finalX = isLastThree
          ? interpolate(expandProgress, [0, 1], [x, targetX], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          : x
        const finalY = isLastThree
          ? interpolate(expandProgress, [0, 1], [y, targetY], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          : y
        const finalTilt = isLastThree
          ? interpolate(expandProgress, [0, 1], [tilt, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          : tilt
        const fadeOut = isLastThree
          ? 1
          : interpolate(expandProgress, [0, 1], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })

        const displayIndex =
          isLastThree && frame >= timing.carouselStart
            ? slot === 0
              ? topIndex
              : slot === 1
                ? centerIndex
                : bottomIndex
            : index
        const zIndex = isLastThree
          ? expandProgress > 0.01
            ? slot === 1
              ? maxCount + 3
              : maxCount + 2
            : index
          : index

        return (
          <div
            key={still}
            style={{
              position: "absolute",
              left: baseX,
              top: baseY,
              width: cardWidth,
              height: cardHeight,
              transform: `translate(-50%, -50%) translate(${finalX}px, ${finalY + lift}px) rotateX(${finalTilt}deg) scale(${finalScale})`,
              transformOrigin: "center center",
              opacity: visible * fadeOut,
              borderRadius: 0,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
              backgroundColor: "#0e0f12",
              zIndex,
            }}
          >
            <Img
              src={staticFile(stills[displayIndex])}
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
