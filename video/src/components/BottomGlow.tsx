import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion"

type BottomGlowProps = {
  heightPct?: number
  intensity?: number
}

export function BottomGlow({ heightPct = 0.18, intensity = 0.65 }: BottomGlowProps) {
  const frame = useCurrentFrame()
  const { fps, height, width } = useVideoConfig()
  const t = frame / fps
  const pulse = 0.55 + Math.sin(t * 1.1) * 0.12
  const glowHeight = Math.round(height * heightPct)
  const bandHeight = Math.max(1, Math.round(height * 0.06))

  const makeBlobPath = ({
    cx,
    cy,
    radius,
    variance,
    points,
    time,
    phase,
  }: {
    cx: number
    cy: number
    radius: number
    variance: number
    points: number
    time: number
    phase: number
  }) => {
    const pts: Array<{ x: number; y: number }> = []
    for (let i = 0; i < points; i += 1) {
      const angle = (i / points) * Math.PI * 2
      const wobble =
        1 +
        variance * Math.sin(angle * 2 + time * 1.1 + phase) +
        variance * 0.6 * Math.sin(angle * 3 - time * 0.8 + phase * 1.4)
      const r = radius * wobble
      pts.push({
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
      })
    }
    if (!pts.length) return ""
    return `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)} ${pts
      .slice(1)
      .map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(" ")} Z`
  }

  const blob1 = makeBlobPath({
    cx: width * 0.28 + Math.sin(t * 0.4) * width * 0.08,
    cy: glowHeight * 0.72 + Math.cos(t * 0.7) * 8,
    radius: glowHeight * 0.26,
    variance: 0.18,
    points: 9,
    time: t,
    phase: 0.2,
  })
  const blob2 = makeBlobPath({
    cx: width * 0.62 + Math.cos(t * 0.35 + 1.2) * width * 0.1,
    cy: glowHeight * 0.78 + Math.sin(t * 0.6) * 10,
    radius: glowHeight * 0.3,
    variance: 0.22,
    points: 10,
    time: t * 1.05,
    phase: 1.3,
  })
  const blob3 = makeBlobPath({
    cx: width * 0.5 + Math.sin(t * 0.5 + 2.1) * width * 0.05,
    cy: glowHeight * 0.9,
    radius: glowHeight * 0.2,
    variance: 0.14,
    points: 8,
    time: t * 0.9,
    phase: 2.2,
  })

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        justifyContent: "flex-end",
        alignItems: "stretch",
      }}
    >
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: bandHeight,
          opacity: 0.45,
          background:
            "linear-gradient(180deg, rgba(16,16,20,0) 0%, rgba(166,131,88,0.4) 70%, rgba(166,131,88,0.65) 100%)",
          filter: "blur(14px)",
        }}
      />
      <svg
        width={width}
        height={glowHeight}
        viewBox={`0 0 ${width} ${glowHeight}`}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          opacity: Math.max(0.15, intensity) * pulse,
          filter: "blur(18px)",
        }}
      >
        <path d={blob1} fill="rgba(166,131,88,0.55)" />
        <path d={blob2} fill="rgba(166,131,88,0.45)" />
        <path d={blob3} fill="rgba(166,131,88,0.35)" />
      </svg>
    </AbsoluteFill>
  )
}
