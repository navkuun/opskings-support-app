import { Audio } from "@remotion/media"
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion"
import { ibmPlexSans } from "../fonts"

const fontFamily = ibmPlexSans

const THEME = {
  background: "oklch(1 0 0)",
  foreground: "oklch(0.145 0 0)",
  muted: "oklch(0.97 0 0)",
  mutedForeground: "oklch(0.556 0 0)",
  border: "oklch(0.922 0 0)",
  primary: "oklch(0.5668 0.118 69.82)",
  primaryForeground: "oklch(0.985 0 0)",
  success: "#16a34a",
}

const STATUS_COLORS: Record<string, string> = {
  resolved: "#10b981",
  closed: "#10b981",
  in_progress: "#f59e0b",
  blocked: "#3b82f6",
  open: "#9ca3af",
  cancelled: "#f43f5e",
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "#f43f5e",
  high: "#f59e0b",
  medium: "#3b82f6",
  low: "#10b981",
}

const TABLE_ROWS = [
  {
    id: 2043,
    title: "Billing: Invoice mismatch for Q3 renewal",
    client: "Lumen Health",
    type: "Billing",
    status: "in_progress",
    priority: "high",
    created: "Nov 12, 9:14 AM",
  },
  {
    id: 2038,
    title: "Onboarding: invite new workspace admins",
    client: "Riverstone Labs",
    type: "Onboarding",
    status: "open",
    priority: "medium",
    created: "Nov 11, 4:42 PM",
  },
  {
    id: 2031,
    title: "Bug: Slack notifications not delivering",
    client: "Polar Analytics",
    type: "Bug",
    status: "blocked",
    priority: "urgent",
    created: "Nov 11, 11:08 AM",
  },
  {
    id: 2024,
    title: "Feature: Usage export for weekly reports",
    client: "Catalyst Partners",
    type: "Feature",
    status: "open",
    priority: "low",
    created: "Nov 10, 6:20 PM",
  },
  {
    id: 2017,
    title: "Security: MFA reset and account recovery",
    client: "Nova Grid",
    type: "Security",
    status: "resolved",
    priority: "high",
    created: "Nov 9, 2:05 PM",
  },
]

const TITLE_TEXT = "Billing: Invoice mismatch for Q3 renewal"
const BODY_TEXT = "Customers report 500 errors when downloading invoices.\nNeed hotfix before upcoming renewals."
const TABLE_HEADLINE = "Tickets organized at a glance"
const MODAL_HEADLINE = "Create tickets in seconds"

export function TicketsScene() {
  const frame = useCurrentFrame()
  const { fps, width, height, durationInFrames } = useVideoConfig()
  const scale = width / 1280
  const logoWidth = width * 0.09
  const logoPad = width * 0.02

  const columnWidths = [28, 80, 320, 180, 160, 150, 140, 200].map((value) => value * scale)
  const tableWidth = columnWidths.reduce((sum, value) => sum + value, 0)
  const tableLeft = (width - tableWidth) / 2
  const tableTop = height * 0.2
  const headlineTop = height * 0.12
  const headlineSize = 34 * scale
  const framePad = 4 * scale
  const frameRadius = 18 * scale
  const panelRadius = 14 * scale

  const rowInStart = Math.round(fps * 0.1)
  const rowStagger = Math.round(fps * 0.12)
  const rowInDuration = Math.round(fps * 0.35)
  const rowInEnd = rowInStart + rowStagger * (TABLE_ROWS.length - 1) + rowInDuration
  const tableHoldEnd = rowInEnd + Math.round(fps * 0.8)

  const modalInStart = tableHoldEnd
  const modalInEnd = modalInStart + Math.round(fps * 0.5)

  const typingStart = modalInEnd + Math.round(fps * 0.2)
  const titleTypingDuration = Math.round(fps * 0.6)
  const bodyTypingDuration = Math.round(fps * 0.9)
  const typingGap = Math.round(fps * 0.2)
  const bodyTypingStart = typingStart + titleTypingDuration + typingGap
  const typingEnd = bodyTypingStart + bodyTypingDuration
  const typingSfxDuration = Math.max(1, typingEnd - typingStart)

  const cursorStart = typingEnd + Math.round(fps * 0.2)
  const cursorMoveEnd = cursorStart + Math.round(fps * 0.6)
  const clickStart = cursorMoveEnd + Math.round(fps * 0.1)
  const clickEnd = clickStart + Math.round(fps * 0.15)
  const successStart = clickEnd + Math.round(fps * 0.1)
  const successEnd = successStart + Math.round(fps * 0.5)

  const wordStagger = Math.round(fps * 0.06)
  const wordDuration = Math.round(fps * 0.28)
  const tableHeadlineStart = Math.max(0, rowInStart - Math.round(fps * 0.05))
  const tableHeadlineOutStart = modalInStart - Math.round(fps * 0.2)
  const tableHeadlineOutEnd = modalInStart
  const modalHeadlineStart = modalInEnd + Math.round(fps * 0.1)
  const modalHeadlineOutStart = durationInFrames - Math.round(fps * 0.35)
  const modalHeadlineOutEnd = durationInFrames - Math.round(fps * 0.1)

  const tableFade = interpolate(frame, [modalInStart, modalInEnd], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  })
  const modalOpacity = interpolate(frame, [modalInStart, modalInEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  })
  const modalScale = interpolate(frame, [modalInStart, modalInEnd], [0.96, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  const overlayOpacity = 0

  const modalWidth = Math.min(width * 0.7, 760 * scale)
  const modalHeight = 300 * scale
  const modalLeft = width / 2 - modalWidth / 2
  const modalTop = height / 2 - modalHeight / 2
  const footerHeight = 56 * scale
  const footerPadX = 18 * scale
  const buttonWidth = 150 * scale
  const buttonHeight = 30 * scale
  const modalCenterX = modalLeft + modalWidth / 2
  const modalCenterY = modalTop + modalHeight / 2
  const buttonCenterX = modalLeft + modalWidth - footerPadX - buttonWidth / 2
  const buttonCenterY = modalTop + modalHeight - footerHeight / 2

  const zoomProgress = interpolate(frame, [cursorMoveEnd - Math.round(fps * 0.2), clickEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  const zoomScale = interpolate(zoomProgress, [0, 1], [1, 1.6])
  const zoomShiftX = (width / 2 - buttonCenterX) * zoomProgress
  const zoomShiftY = (height / 2 - buttonCenterY) * zoomProgress
  const modalScaleTotal = modalScale * zoomScale
  const buttonOffsetX = (buttonCenterX - modalCenterX) * modalScaleTotal
  const buttonOffsetY = (buttonCenterY - modalCenterY) * modalScaleTotal
  const displayButtonX = modalCenterX + buttonOffsetX + zoomShiftX
  const displayButtonY = modalCenterY + buttonOffsetY + zoomShiftY

  const titleText = getTypedText(frame, typingStart, titleTypingDuration, TITLE_TEXT)
  const bodyText = getTypedText(frame, bodyTypingStart, bodyTypingDuration, BODY_TEXT)

  const cursorProgress = interpolate(frame, [cursorStart, cursorMoveEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  })
  const cursorOpacity = interpolate(frame, [cursorStart, cursorStart + Math.round(fps * 0.12)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  const cursorStartX = modalLeft + modalWidth * 0.36
  const cursorStartY = modalTop + modalHeight * 0.36
  const cursorX = interpolate(cursorProgress, [0, 1], [cursorStartX, displayButtonX])
  const cursorY = interpolate(cursorProgress, [0, 1], [cursorStartY, displayButtonY])

  const clickProgress = interpolate(frame, [clickStart, clickEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  const buttonPress = interpolate(clickProgress, [0, 1], [1, 0.94])
  const successProgress = interpolate(frame, [successStart, successEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  const buttonColor = successProgress > 0.4 ? THEME.success : THEME.primary

  const chromeFade = interpolate(zoomProgress, [0, 0.25], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })

  const renderHeadline = ({
    text,
    start,
    outStart,
    outEnd,
    top,
    fontSize,
    fade = 1,
  }: {
    text: string
    start: number
    outStart: number
    outEnd: number
    top: number
    fontSize: number
    fade?: number
  }) => {
    const words = text.split(" ")
    const inEnd = start + wordDuration + Math.max(0, words.length - 1) * wordStagger
    const enterProgress = interpolate(frame, [start, inEnd], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    })
    const exitProgress = interpolate(frame, [outStart, outEnd], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.in(Easing.cubic),
    })
    const translateY = interpolate(enterProgress, [0, 1], [18 * scale, 0])
    const exitLift = interpolate(1 - exitProgress, [0, 1], [0, -12 * scale])
    const opacity = Math.min(enterProgress, exitProgress) * fade

    return (
      <div
        style={{
          position: "absolute",
          left: "50%",
          top,
          transform: `translate(-50%, 0) translateY(${translateY + exitLift}px)`,
          opacity,
          whiteSpace: "nowrap",
          maxWidth: "90%",
          textAlign: "center",
          fontSize,
          fontWeight: 600,
          color: "#0b0b0b",
          letterSpacing: "-0.02em",
          zIndex: 6,
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "baseline", gap: 10 * scale, whiteSpace: "nowrap" }}>
          {words.map((word, index) => {
            const wordStart = start + index * wordStagger
            const wordProgress = interpolate(frame, [wordStart, wordStart + wordDuration], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            })
            const wordTranslate = interpolate(wordProgress, [0, 1], [16 * scale, 0])
    const wordOpacity = Math.min(wordProgress, exitProgress) * fade

            return (
              <span
                key={`${word}-${index}`}
                style={{
                  display: "inline-block",
                  transform: `translateY(${wordTranslate}px)`,
                  opacity: wordOpacity,
                }}
              >
                {word}
              </span>
            )
          })}
        </span>
      </div>
    )
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#ffffff", fontFamily }}>
      <Img
        src={staticFile("opskings-full-black.svg")}
        alt="OpsKings"
        style={{
          position: "absolute",
          top: logoPad,
          left: logoPad,
          width: logoWidth,
          height: "auto",
          opacity: 0.9 * chromeFade,
          zIndex: 5,
        }}
      />

      <Sequence from={typingStart}>
        <Audio src={staticFile("sfx/typing_text.mp3")} volume={0.16} trimAfter={typingSfxDuration} />
      </Sequence>

      {renderHeadline({
        text: TABLE_HEADLINE,
        start: tableHeadlineStart,
        outStart: tableHeadlineOutStart,
        outEnd: tableHeadlineOutEnd,
        top: headlineTop,
        fontSize: headlineSize,
        fade: chromeFade,
      })}

      {renderHeadline({
        text: MODAL_HEADLINE,
        start: modalHeadlineStart,
        outStart: modalHeadlineOutStart,
        outEnd: modalHeadlineOutEnd,
        top: headlineTop,
        fontSize: headlineSize,
        fade: chromeFade,
      })}

      <div style={{ position: "absolute", left: tableLeft, top: tableTop, width: tableWidth, opacity: tableFade }}>
        <div
          style={{
            borderRadius: frameRadius,
            backgroundColor: "#ffffff",
            padding: framePad,
          }}
        >
          <div
            style={{
              borderRadius: panelRadius,
              border: `1px solid ${THEME.border}`,
              backgroundColor: THEME.background,
              overflow: "hidden",
              boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: columnWidths.map((w) => `${w}px`).join(" "),
                padding: `${10 * scale}px ${14 * scale}px`,
                fontSize: 12 * scale,
                fontWeight: 600,
                color: THEME.mutedForeground,
                backgroundColor: "oklch(0.97 0 0 / 0.65)",
                borderBottom: `1px solid ${THEME.border}`,
              }}
            >
              <CheckboxMini scale={scale} />
              <span>ID</span>
              <span>Title</span>
              <span>Client</span>
              <span>Type</span>
              <span>Status</span>
              <span>Priority</span>
              <span>Created</span>
            </div>

            {TABLE_ROWS.map((row, index) => {
              const rowStart = rowInStart + index * rowStagger
              const rowProgress = interpolate(frame, [rowStart, rowStart + rowInDuration], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.cubic),
              })
              const rowOpacity = rowProgress
              const rowTranslate = interpolate(rowProgress, [0, 1], [12 * scale, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })

              return (
                <div
                  key={row.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: columnWidths.map((w) => `${w}px`).join(" "),
                    padding: `${12 * scale}px ${14 * scale}px`,
                    fontSize: 13 * scale,
                    borderBottom: index === TABLE_ROWS.length - 1 ? "none" : `1px solid ${THEME.border}`,
                    backgroundColor: index === 1 ? "oklch(0.97 0 0 / 0.6)" : "transparent",
                    transform: `translateY(${rowTranslate}px)`,
                    opacity: rowOpacity,
                  }}
                >
                  <CheckboxMini checked={index === 1} scale={scale} />
                  <span style={{ color: THEME.mutedForeground, fontFamily: "monospace" }}>#{row.id}</span>
                  <span style={{ fontWeight: 600 }}>{row.title}</span>
                  <span style={{ fontWeight: 600 }}>{row.client}</span>
                  <span style={{ color: THEME.mutedForeground }}>{row.type}</span>
                  <Badge label={formatLabel(row.status)} dotColor={getStatusColor(row.status)} scale={scale} />
                  <Badge label={formatLabel(row.priority)} dotColor={getPriorityColor(row.priority)} scale={scale} />
                  <span style={{ color: THEME.mutedForeground }}>{row.created}</span>
                </div>
              )
            })}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: `${10 * scale}px ${14 * scale}px`,
                fontSize: 12 * scale,
                color: THEME.mutedForeground,
                borderTop: `1px solid ${THEME.border}`,
              }}
            >
              <span>
                Showing <strong style={{ color: THEME.foreground }}>1-20</strong> of{" "}
                <strong style={{ color: THEME.foreground }}>128</strong>
              </span>
              <div style={{ display: "flex", gap: 8 * scale }}>
                <NavButton label="Prev" scale={scale} />
                <NavButton label="Next" scale={scale} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.65)",
          opacity: overlayOpacity,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: modalLeft,
          top: modalTop,
          width: modalWidth,
          height: modalHeight,
          transform: `translate(${zoomShiftX}px, ${zoomShiftY}px) scale(${modalScale * zoomScale})`,
          transformOrigin: "center center",
          opacity: modalOpacity,
          backgroundColor: THEME.background,
          borderRadius: 16 * scale,
          border: `1px solid ${THEME.border}`,
          boxShadow: "0 30px 80px rgba(0,0,0,0.2)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: `${14 * scale}px ${16 * scale}px`,
            borderBottom: `1px solid ${THEME.border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 * scale }}>
            <span style={{ fontSize: 12 * scale, color: THEME.mutedForeground }}>▶</span>
            <span style={{ fontSize: 14 * scale, fontWeight: 600, color: THEME.mutedForeground }}>
              New ticket
            </span>
          </div>
          <span style={{ fontSize: 14 * scale, color: THEME.mutedForeground }}>✕</span>
        </div>

        <div style={{ padding: `${14 * scale}px ${18 * scale}px` }}>
          <div style={{ fontSize: 17 * scale, fontWeight: 600, color: THEME.foreground, marginBottom: 10 * scale }}>
            {titleText.length ? titleText : "Ticket title"}
          </div>
          <div
            style={{
              height: 90 * scale,
              borderRadius: 10 * scale,
              border: `1px solid ${THEME.border}`,
              padding: 12 * scale,
              color: titleText.length ? THEME.foreground : THEME.mutedForeground,
              fontSize: 15 * scale,
              whiteSpace: "pre-wrap",
              lineHeight: 1.4,
              marginBottom: 12 * scale,
            }}
          >
            {bodyText.length ? bodyText : "Add description…"}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 * scale }}>
            {[
              "Open",
              "Client",
              "Ticket type",
              "Priority",
              "Assignee",
            ].map((label) => (
              <Pill key={label} label={label} scale={scale} />
            ))}
          </div>
        </div>

        <div
          style={{
            height: footerHeight,
            padding: `${12 * scale}px ${18 * scale}px`,
            borderTop: `1px solid ${THEME.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 * scale }}>
            <SwitchMini scale={scale} />
            <span style={{ fontSize: 12 * scale, color: THEME.mutedForeground }}>Create more</span>
          </div>
          <div style={{ position: "relative" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: buttonWidth,
                height: buttonHeight,
                borderRadius: 8 * scale,
                backgroundColor: buttonColor,
                color: THEME.primaryForeground,
                fontSize: 12 * scale,
                fontWeight: 600,
                boxShadow: "0 10px 20px rgba(0,0,0,0.12)",
                transform: `scale(${buttonPress})`,
                transition: "none",
              }}
            >
              {successProgress > 0.4 ? "Created" : "Create ticket"}
            </div>
            {successProgress > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: buttonWidth + 24 * scale,
                  height: buttonHeight + 24 * scale,
                  transform: "translate(-50%, -50%)",
                  borderRadius: 12 * scale,
                  border: `1px solid rgba(22,163,74,${0.4 * (1 - successProgress)})`,
                  opacity: 1 - successProgress,
                }}
              />
            ) : null}
          </div>
        </div>
      </div>

      <Img
        src={staticFile("cursor.svg")}
        alt="Cursor"
        style={{
          position: "absolute",
          width: 40 * scale,
          height: 40 * scale,
          left: cursorX - 6 * scale,
          top: cursorY - 4 * scale,
          opacity: cursorOpacity * modalOpacity,
          filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.25))",
          pointerEvents: "none",
        }}
      />

      <Sequence from={clickStart}>
        <Audio src={staticFile("sfx/click_create.mp3")} volume={0.35} />
      </Sequence>

      <div
        style={{
          position: "absolute",
          left: displayButtonX - 14 * scale,
          top: displayButtonY - 14 * scale,
          width: 28 * scale,
          height: 28 * scale,
          borderRadius: "50%",
          border: `2px solid rgba(255,255,255,${0.6 * (1 - clickProgress)})`,
          opacity: clickProgress > 0 ? 1 - clickProgress : 0,
          transform: `scale(${0.6 + clickProgress * 1.4})`,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  )
}

function CheckboxMini({ checked, scale }: { checked?: boolean; scale: number }) {
  return (
    <div
      style={{
        width: 16 * scale,
        height: 16 * scale,
        borderRadius: 4 * scale,
        border: `1px solid ${THEME.border}`,
        backgroundColor: checked ? THEME.primary : "transparent",
      }}
    />
  )
}

function Badge({ label, dotColor, scale }: { label: string; dotColor: string; scale: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6 * scale,
        padding: `${2 * scale}px ${8 * scale}px`,
        borderRadius: 999,
        border: `1px solid ${THEME.border}`,
        fontSize: 12 * scale,
        color: THEME.foreground,
        width: "fit-content",
      }}
    >
      <span style={{ width: 6 * scale, height: 6 * scale, borderRadius: 999, backgroundColor: dotColor }} />
      {label}
    </span>
  )
}

function Pill({ label, scale }: { label: string; scale: number }) {
  return (
    <div
      style={{
        padding: `${4 * scale}px ${8 * scale}px`,
        borderRadius: 8 * scale,
        border: `1px solid ${THEME.border}`,
        backgroundColor: "oklch(0.97 0 0 / 0.6)",
        fontSize: 12 * scale,
        color: THEME.mutedForeground,
      }}
    >
      {label}
    </div>
  )
}

function SwitchMini({ scale }: { scale: number }) {
  return (
    <div
      style={{
        width: 28 * scale,
        height: 16 * scale,
        borderRadius: 999,
        backgroundColor: "oklch(0.97 0 0 / 0.8)",
        border: `1px solid ${THEME.border}`,
        position: "relative",
      }}
    >
      <div
        style={{
          width: 12 * scale,
          height: 12 * scale,
          borderRadius: 999,
          backgroundColor: THEME.background,
          position: "absolute",
          top: 1.5 * scale,
          left: 2 * scale,
          boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
        }}
      />
    </div>
  )
}

function NavButton({ label, scale }: { label: string; scale: number }) {
  return (
    <div
      style={{
        padding: `${4 * scale}px ${10 * scale}px`,
        borderRadius: 8 * scale,
        border: `1px solid ${THEME.border}`,
        fontSize: 12 * scale,
        color: THEME.foreground,
        backgroundColor: THEME.background,
      }}
    >
      {label}
    </div>
  )
}

function getTypedText(frame: number, start: number, duration: number, text: string) {
  if (frame < start) return ""
  const progress = interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.linear,
  })
  const count = Math.floor(progress * text.length)
  return text.slice(0, count)
}

function formatLabel(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ")
}

function getStatusColor(status: string) {
  return STATUS_COLORS[status] ?? "#9ca3af"
}

function getPriorityColor(priority: string) {
  return PRIORITY_COLORS[priority] ?? "#9ca3af"
}
