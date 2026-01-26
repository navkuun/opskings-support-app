import { loadFont } from "@remotion/google-fonts/Inter"
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion"
import type { ReactNode } from "react"
import { useId } from "react"

import { getMetricsTiming } from "../metricsTiming"

const { fontFamily } = loadFont("normal", { weights: ["500", "600", "700"], subsets: ["latin"] })

const THEME = {
  background: "oklch(1 0 0)",
  foreground: "oklch(0.145 0 0)",
  muted: "oklch(0.97 0 0)",
  mutedForeground: "oklch(0.556 0 0)",
  border: "oklch(0.922 0 0)",
  chart1: "oklch(0.79 0.15 72)",
  chart2: "oklch(0.71 0.17 66)",
  chart3: "oklch(0.63 0.19 60)",
  chart4: "oklch(0.55 0.18 54)",
  chart5: "oklch(0.48 0.16 48)",
}

const OVER_TIME_DATA = [
  { label: "Jan", created: 220, resolved: 180 },
  { label: "Feb", created: 260, resolved: 210 },
  { label: "Mar", created: 280, resolved: 240 },
  { label: "Apr", created: 310, resolved: 270 },
  { label: "May", created: 360, resolved: 300 },
  { label: "Jun", created: 390, resolved: 340 },
  { label: "Jul", created: 420, resolved: 370 },
  { label: "Aug", created: 455, resolved: 390 },
  { label: "Sep", created: 470, resolved: 410 },
  { label: "Oct", created: 520, resolved: 450 },
]

const TYPE_DATA = [
  { label: "Bug", count: 320 },
  { label: "Feature", count: 260 },
  { label: "Billing", count: 180 },
  { label: "Onboarding", count: 140 },
  { label: "Security", count: 90 },
  { label: "Other", count: 70 },
]

const PRIORITY_DATA = [
  { label: "Urgent", count: 68, color: THEME.chart1 },
  { label: "High", count: 148, color: THEME.chart2 },
  { label: "Medium", count: 210, color: THEME.chart3 },
  { label: "Low", count: 132, color: THEME.chart4 },
  { label: "Unknown", count: 24, color: THEME.chart5 },
]

const DASHBOARD_SECTIONS = [
  {
    id: "tickets-over-time",
    title: "Tickets over time",
    subtitle: "Created vs resolved by month.",
    description: "Spot growth, compare created vs resolved, and highlight momentum month to month.",
  },
  {
    id: "tickets-by-type",
    title: "Tickets by type",
    subtitle: "Top ticket types by volume.",
    description: "See where customers need the most help and double down on key categories.",
  },
  {
    id: "tickets-by-priority",
    title: "Tickets by priority",
    subtitle: "Priority breakdown across your queue.",
    description: "Understand urgency mix and track how open vs resolved tickets are trending.",
  },
] as const

export const DASHBOARD_METRICS_COUNT = DASHBOARD_SECTIONS.length

export function DashboardMetricsScene() {
  const frame = useCurrentFrame()
  const { fps, width, height } = useVideoConfig()
  const scale = width / 1280
  const timing = getMetricsTiming(DASHBOARD_SECTIONS.length, fps)
  const logoWidth = width * 0.09
  const logoPad = width * 0.02

  const sectionWidth = width * 0.86
  const chartWidth = sectionWidth * 0.6
  const textWidth = sectionWidth * 0.34
  const rowGap = sectionWidth * 0.06

  return (
    <AbsoluteFill style={{ backgroundColor: "#DDDDDD", fontFamily }}>
      <Img
        src={staticFile("opskings-full-black.svg")}
        alt="OpsKings"
        style={{
          position: "absolute",
          top: logoPad,
          left: logoPad,
          width: logoWidth,
          height: "auto",
          opacity: 0.9,
          zIndex: 5,
        }}
      />

      {DASHBOARD_SECTIONS.map((section, index) => {
        const start = timing.intro + index * timing.sectionDuration
        const end = start + timing.sectionDuration
        const enter = interpolate(frame, [start, start + timing.enterDuration], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
        const exit = interpolate(frame, [end - timing.exitDuration, end], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.in(Easing.cubic),
        })
        const sectionOpacity = Math.min(enter, 1 - exit)
        const slideIn = interpolate(enter, [0, 1], [26 * scale, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
        const slideOut = interpolate(exit, [0, 1], [0, -18 * scale], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
        const sectionTranslate = slideIn + slideOut
        const chartProgress = interpolate(
          frame,
          [start, start + timing.sectionDuration * 0.7],
          [0, 1],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          },
        )

        return (
          <div
            key={section.id}
            style={{
              position: "absolute",
              top: height * 0.22,
              left: "50%",
              width: sectionWidth,
              transform: `translate(-50%, 0) translateY(${sectionTranslate}px)`,
              opacity: sectionOpacity,
              display: "flex",
              gap: rowGap,
              alignItems: "center",
            }}
          >
            <div style={{ width: chartWidth }}>
              {section.id === "tickets-over-time" ? (
                <TicketsOverTimeCard progress={chartProgress} scale={scale} />
              ) : null}
              {section.id === "tickets-by-type" ? (
                <TicketsByTypeCard progress={chartProgress} scale={scale} />
              ) : null}
              {section.id === "tickets-by-priority" ? (
                <TicketsByPriorityCard progress={chartProgress} scale={scale} />
              ) : null}
            </div>
            <div style={{ width: textWidth }}>
              <div
                style={{
                  fontSize: 30 * scale,
                  fontWeight: 600,
                  color: "#0b0b0b",
                  marginBottom: 12 * scale,
                }}
              >
                {section.title}
              </div>
              <div
                style={{
                  fontSize: 16 * scale,
                  color: "rgba(0,0,0,0.55)",
                  marginBottom: 12 * scale,
                }}
              >
                {section.subtitle}
              </div>
              <div
                style={{
                  fontSize: 18 * scale,
                  color: "#1f1f1f",
                  lineHeight: 1.45,
                }}
              >
                {section.description}
              </div>
            </div>
          </div>
        )
      })}
    </AbsoluteFill>
  )
}

function TicketsOverTimeCard({ progress, scale }: { progress: number; scale: number }) {
  return (
    <ChartCardShell scale={scale}>
      <CardHeader
        title="Tickets over time"
        subtitle="Created vs resolved by month."
        right={
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 * scale }}>
            <SegmentedControl scale={scale} activeIndex={0} items={["All", "Created", "Resolved"]} />
            <div style={{ display: "flex", alignItems: "center", gap: 6 * scale }}>
              <span style={{ fontSize: 11 * scale, color: THEME.mutedForeground }}>Year</span>
              <SelectPill scale={scale} label="2025" />
            </div>
          </div>
        }
        scale={scale}
      />
      <Legend
        scale={scale}
        items={[
          { label: "Created", color: THEME.chart1, gradient: true },
          { label: "Resolved", color: THEME.chart4 },
        ]}
      />
      <div style={{ position: "relative", height: 240 * scale, marginTop: 6 * scale }}>
        <TicketsOverTimeChart progress={progress} />
        <ChartShine progress={progress} scale={scale} />
      </div>
    </ChartCardShell>
  )
}

function TicketsOverTimeChart({ progress }: { progress: number }) {
  const id = useId()
  const viewWidth = 520
  const viewHeight = 240
  const padding = { left: 46, right: 16, top: 14, bottom: 28 }
  const chartWidth = viewWidth - padding.left - padding.right
  const chartHeight = viewHeight - padding.top - padding.bottom
  const maxValue = Math.max(...OVER_TIME_DATA.map((row) => row.created + row.resolved))
  const barCount = OVER_TIME_DATA.length
  const barGap = (chartWidth / barCount) * 0.3
  const barWidth = (chartWidth - barGap * (barCount - 1)) / barCount
  const tickCount = 4
  const gridLines = Array.from({ length: tickCount }, (_, idx) => idx / (tickCount - 1))

  return (
    <svg
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <defs>
        <linearGradient id={`${id}-created`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={THEME.chart1} />
          <stop offset="100%" stopColor={THEME.chart2} />
        </linearGradient>
      </defs>

      {gridLines.map((t) => {
        const y = padding.top + chartHeight * t
        const labelValue = Math.round((1 - t) * maxValue)
        return (
          <g key={`grid-${t}`}>
            <line
              x1={padding.left}
              y1={y}
              x2={viewWidth - padding.right}
              y2={y}
              stroke="rgba(0,0,0,0.08)"
              strokeDasharray="3 3"
            />
            <text
              x={padding.left - 8}
              y={y + 4}
              textAnchor="end"
              fontSize="11"
              fill="rgba(0,0,0,0.45)"
            >
              {formatCompactNumber(labelValue)}
            </text>
          </g>
        )
      })}

      {OVER_TIME_DATA.map((row, index) => {
        const delay = index * 0.06
        const localProgress = clamp01((progress - delay) / (1 - delay))
        const createdHeight = (row.created / maxValue) * chartHeight * localProgress
        const resolvedHeight = (row.resolved / maxValue) * chartHeight * localProgress
        const x = padding.left + index * (barWidth + barGap)
        const resolvedY = padding.top + chartHeight - resolvedHeight
        const createdY = resolvedY - createdHeight
        const isHighlight = index === OVER_TIME_DATA.length - 1
        const glow = isHighlight ? 0.25 + localProgress * 0.35 : 0

        return (
          <g key={row.label}>
            <rect x={x} y={resolvedY} width={barWidth} height={resolvedHeight} fill={THEME.chart4} rx={3} />
            <rect
              x={x}
              y={createdY}
              width={barWidth}
              height={createdHeight}
              fill={`url(#${id}-created)`}
              rx={3}
            />
            {isHighlight ? (
              <rect
                x={x - 1}
                y={createdY - 1}
                width={barWidth + 2}
                height={createdHeight + resolvedHeight + 2}
                fill="none"
                stroke={`rgba(255,255,255,${glow})`}
                strokeWidth={2}
                rx={4}
              />
            ) : null}
          </g>
        )
      })}

      {OVER_TIME_DATA.map((row, index) => {
        if (index % 2 !== 0) return null
        const x = padding.left + index * (barWidth + barGap) + barWidth / 2
        return (
          <text
            key={`label-${row.label}`}
            x={x}
            y={viewHeight - 8}
            textAnchor="middle"
            fontSize="11"
            fill="rgba(0,0,0,0.55)"
          >
            {row.label}
          </text>
        )
      })}
    </svg>
  )
}

function TicketsByTypeCard({ progress, scale }: { progress: number; scale: number }) {
  return (
    <ChartCardShell scale={scale}>
      <CardHeader
        title="Tickets by type"
        subtitle="Top ticket types by volume."
        right={
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 * scale }}>
            <SegmentedControl scale={scale} activeIndex={0} items={["Top 5", "Top 8", "Top 12"]} />
            <SegmentedControl scale={scale} activeIndex={0} items={["#", "%"]} />
          </div>
        }
        scale={scale}
      />
      <div style={{ position: "relative", height: 240 * scale, marginTop: 6 * scale }}>
        <TicketsByTypeChart progress={progress} />
        <ChartShine progress={progress} scale={scale} />
      </div>
      <Legend
        scale={scale}
        items={TYPE_DATA.slice(0, 5).map((slice, idx) => ({ label: slice.label, color: getChartColor(idx) }))}
      />
    </ChartCardShell>
  )
}

function TicketsByTypeChart({ progress }: { progress: number }) {
  const total = TYPE_DATA.reduce((sum, row) => sum + row.count, 0)
  const viewSize = 240
  const cx = viewSize / 2
  const cy = viewSize / 2
  const radius = 90
  let startAngle = -90

  return (
    <svg viewBox={`0 0 ${viewSize} ${viewSize}`} style={{ width: "100%", height: "100%" }}>
      {TYPE_DATA.map((row, idx) => {
        const sliceAngle = total ? (row.count / total) * 360 : 0
        const delay = idx * 0.12
        const localProgress = clamp01((progress - delay) / (1 - delay))
        const endAngle = startAngle + sliceAngle * localProgress
        const path = describeArc(cx, cy, radius, startAngle, endAngle)
        const midAngle = startAngle + (sliceAngle * Math.max(0.2, localProgress)) / 2
        const labelPos = polarToCartesian(cx, cy, radius * 0.62, midAngle)
        const color = getChartColor(idx)
        const showLabel = localProgress > 0.6

        const element = (
          <g key={row.label}>
            <path d={path} fill={color} />
            {showLabel ? (
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="11"
                fontWeight={600}
                fill="rgba(0,0,0,0.78)"
              >
                {formatCompactNumber(row.count)}
              </text>
            ) : null}
          </g>
        )

        startAngle += sliceAngle
        return element
      })}
    </svg>
  )
}

function TicketsByPriorityCard({ progress, scale }: { progress: number; scale: number }) {
  const total = PRIORITY_DATA.reduce((sum, row) => sum + row.count, 0)

  return (
    <ChartCardShell scale={scale}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12 * scale,
        }}
      >
        <div>
          <div style={{ fontSize: 14 * scale, fontWeight: 600, color: THEME.foreground }}>
            Tickets by priority
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 * scale }}>
            <div style={{ fontSize: 22 * scale, fontWeight: 600, color: THEME.foreground }}>
              {formatCompactNumber(total)}
            </div>
            <span style={{ fontSize: 11 * scale, color: THEME.mutedForeground }}>Total</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 * scale }}>
          <SegmentedControl scale={scale} activeIndex={0} items={["All", "Open", "Resolved"]} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 * scale, justifyContent: "flex-end" }}>
            {PRIORITY_DATA.map((segment) => (
              <div key={segment.label} style={{ display: "flex", alignItems: "center", gap: 6 * scale }}>
                <span
                  style={{
                    width: 6 * scale,
                    height: 6 * scale,
                    borderRadius: 3 * scale,
                    backgroundColor: segment.color,
                  }}
                />
                <span style={{ fontSize: 11 * scale, color: "rgba(0,0,0,0.6)" }}>{segment.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ height: 220 * scale, marginTop: 14 * scale }}>
        <div
          style={{
            position: "relative",
            height: 18 * scale,
            borderRadius: 8 * scale,
            overflow: "hidden",
            backgroundColor: "rgba(0,0,0,0.06)",
            display: "flex",
          }}
        >
          {PRIORITY_DATA.map((segment, idx) => {
            const delay = idx * 0.1
            const localProgress = clamp01((progress - delay) / (1 - delay))
            const widthPct = total ? (segment.count / total) * 100 : 0
            return (
              <div
                key={segment.label}
                style={{
                  width: `${widthPct * localProgress}%`,
                  backgroundColor: segment.color,
                }}
              />
            )
          })}
          <ChartShine progress={progress} scale={scale} />
        </div>
        <div style={{ marginTop: 18 * scale }}>
          {PRIORITY_DATA.map((segment) => (
            <div
              key={segment.label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 13 * scale,
                color: "rgba(0,0,0,0.65)",
                padding: `${4 * scale}px 0`,
                borderBottom: `1px solid ${THEME.border}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 * scale }}>
                <span
                  style={{
                    width: 8 * scale,
                    height: 8 * scale,
                    borderRadius: "999px",
                    backgroundColor: segment.color,
                  }}
                />
                <span>{segment.label} priority tickets</span>
              </div>
              <span style={{ color: THEME.foreground, fontWeight: 600 }}>
                {segment.count.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </ChartCardShell>
  )
}

function ChartCardShell({ scale, children }: { scale: number; children: ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: THEME.background,
        border: `1px solid ${THEME.border}`,
        borderRadius: 14 * scale,
        padding: 16 * scale,
        boxShadow: "0 20px 45px rgba(0,0,0,0.08)",
        color: THEME.foreground,
        fontSize: 12 * scale,
        lineHeight: 1.4,
      }}
    >
      {children}
    </div>
  )
}

function CardHeader({
  title,
  subtitle,
  right,
  scale,
}: {
  title: string
  subtitle: string
  right: ReactNode
  scale: number
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 * scale }}>
      <div>
        <div style={{ fontSize: 14 * scale, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 11 * scale, color: THEME.mutedForeground }}>{subtitle}</div>
      </div>
      {right}
    </div>
  )
}

function Legend({ items, scale }: { items: Array<{ label: string; color: string; gradient?: boolean }>; scale: number }) {
  return (
    <div style={{ display: "flex", gap: 16 * scale, marginTop: 12 * scale, flexWrap: "wrap" }}>
      {items.map((item) => (
        <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 * scale }}>
          <span
            style={{
              width: 10 * scale,
              height: 10 * scale,
              borderRadius: 3 * scale,
              background: item.gradient
                ? `linear-gradient(180deg, ${THEME.chart1}, ${THEME.chart2})`
                : item.color,
            }}
          />
          <span style={{ fontSize: 11 * scale, color: THEME.mutedForeground }}>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

function SegmentedControl({ items, activeIndex, scale }: { items: string[]; activeIndex: number; scale: number }) {
  return (
    <div
      style={{
        display: "inline-flex",
        padding: 2 * scale,
        borderRadius: 8 * scale,
        border: `1px solid ${THEME.border}`,
        backgroundColor: "oklch(0.97 0 0 / 0.6)",
        gap: 2 * scale,
      }}
    >
      {items.map((item, index) => {
        const isActive = index === activeIndex
        return (
          <div
            key={item}
            style={{
              padding: `${2 * scale}px ${8 * scale}px`,
              borderRadius: 6 * scale,
              fontSize: 11 * scale,
              color: isActive ? THEME.foreground : THEME.mutedForeground,
              backgroundColor: isActive ? THEME.background : "transparent",
              boxShadow: isActive ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
              border: isActive ? `1px solid ${THEME.border}` : "1px solid transparent",
            }}
          >
            {item}
          </div>
        )
      })}
    </div>
  )
}

function SelectPill({ label, scale }: { label: string; scale: number }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4 * scale,
        padding: `${2 * scale}px ${8 * scale}px`,
        borderRadius: 6 * scale,
        border: `1px solid ${THEME.border}`,
        fontSize: 11 * scale,
        color: THEME.foreground,
        backgroundColor: THEME.background,
        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
      }}
    >
      <span>{label}</span>
      <span style={{ fontSize: 10 * scale, color: THEME.mutedForeground }}>▾</span>
    </div>
  )
}

function ChartShine({ progress, scale }: { progress: number; scale: number }) {
  const shineProgress = clamp01((progress - 0.2) / 0.8)
  const translateX = interpolate(shineProgress, [0, 1], [-120 * scale, 220 * scale], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  const opacity = interpolate(shineProgress, [0, 0.2, 0.8, 1], [0, 0.55, 0.55, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })

  return (
    <div
      style={{
        position: "absolute",
        inset: -40 * scale,
        background:
          "linear-gradient(120deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 45%, rgba(255,255,255,0) 70%)",
        transform: `translateX(${translateX}px)`,
        opacity,
        mixBlendMode: "screen",
        pointerEvents: "none",
      }}
    />
  )
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"

  return ["M", start.x, start.y, "A", r, r, 0, largeArcFlag, 0, end.x, end.y, "L", cx, cy, "Z"].join(
    " ",
  )
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180
  return {
    x: cx + r * Math.cos(radians),
    y: cy + r * Math.sin(radians),
  }
}

function clamp01(value: number) {
  if (value <= 0) return 0
  if (value >= 1) return 1
  return value
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

function getChartColor(index: number) {
  const key = `chart${Math.min(index + 1, 5)}` as keyof typeof THEME
  return THEME[key]
}
