"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery, useZero } from "@rocicorp/zero/react"
import { ArrowLeftIcon, SendIcon, StarIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Frame, FramePanel } from "@/components/ui/frame"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { isEditableTarget } from "@/lib/keyboard"
import { isRecord, isString } from "@/lib/type-guards"
import { cn } from "@/lib/utils"
import { queries } from "@/zero/queries"
import { mutators } from "@/zero/mutators"

function parseAllocatedId(
  value: unknown,
  key: "ticketMessages" | "ticketFeedback",
) {
  if (!isRecord(value) || value.ok !== true) return null
  const ids = value.ids
  if (!isRecord(ids)) return null
  const raw = ids[key]
  if (!Array.isArray(raw)) return null
  const first = raw[0]
  if (typeof first === "number" && Number.isInteger(first) && first > 0) return first
  if (isString(first)) {
    const parsed = Number(first)
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) return null
    return parsed
  }
  return null
}

function formatLabel(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return value

  return trimmed
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0]!.toUpperCase() + word.slice(1))
    .join(" ")
}

function formatTimestamp(ms: number | null | undefined) {
  if (typeof ms !== "number" || !Number.isFinite(ms)) return "—"
  return new Date(ms).toLocaleString()
}

function getStatusDot(status: string | null | undefined) {
  const value = (status ?? "").toLowerCase()
  if (!value) return "bg-muted-foreground/50"
  if (value.includes("resolved") || value.includes("closed")) return "bg-emerald-500"
  if (value.includes("progress")) return "bg-amber-500"
  if (value.includes("hold") || value.includes("blocked")) return "bg-blue-500"
  if (value.includes("cancel")) return "bg-rose-500"
  return "bg-muted-foreground/50"
}

function getPriorityDot(priority: string | null | undefined) {
  const value = (priority ?? "").toLowerCase()
  if (!value) return "bg-muted-foreground/50"
  if (value.includes("urgent")) return "bg-rose-500"
  if (value.includes("high")) return "bg-amber-500"
  if (value.includes("medium")) return "bg-blue-500"
  if (value.includes("low")) return "bg-emerald-500"
  return "bg-muted-foreground/50"
}

type Rating = 1 | 2 | 3 | 4 | 5

function parseRating(value: unknown): Rating | null {
  if (typeof value !== "number" || !Number.isInteger(value)) return null
  if (value === 1 || value === 2 || value === 3 || value === 4 || value === 5) return value
  return null
}

export function TicketDetailsPageClient({
  ticketId,
  userType,
  internalRole,
  teamMemberId,
  clientId,
}: {
  ticketId: number
  userType: "internal" | "client"
  internalRole: "support_agent" | "manager" | "admin" | null
  teamMemberId: number | null
  clientId: number | null
}) {
  const router = useRouter()
  const z = useZero()

  const [ticket, ticketResult] = useQuery(queries.tickets.byId({ id: ticketId }))
  const [teamMembers] = useQuery(queries.teamMembers.internalList({ limit: 200 }))
  const [messages, messagesResult] = useQuery(
    queries.ticketMessages.byTicket({ ticketId, limit: 500 }),
  )
  const [feedback, feedbackResult] = useQuery(queries.ticketFeedback.byTicket({ ticketId }))

  const isInternal = userType === "internal"
  const isClient = userType === "client"

  const [reply, setReply] = React.useState("")
  const replyRef = React.useRef<HTMLTextAreaElement>(null)
  const [sendingReply, setSendingReply] = React.useState(false)
  const [replyError, setReplyError] = React.useState<string | null>(null)

  const canSendReply = React.useMemo(() => {
    if (!ticket) return false
    if (isInternal) return typeof teamMemberId === "number" && teamMemberId > 0
    return typeof clientId === "number" && clientId > 0
  }, [clientId, isInternal, teamMemberId, ticket])

  const sendReply = React.useCallback(async () => {
    if (!canSendReply || sendingReply) return
    const trimmed = reply.trim()
    if (!trimmed) return
    setReplyError(null)
    setSendingReply(true)

    try {
      const res = await fetch("/api/ids", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ticketMessages: 1 }),
      })
      if (!res.ok) throw new Error("Failed to send message.")
      const json: unknown = await res.json()
      const messageId = parseAllocatedId(json, "ticketMessages")
      if (!messageId) throw new Error("Failed to send message.")

      await z.mutate(
        mutators.ticketMessages.create({
          id: messageId,
          ticketId,
          fromClient: isClient,
          fromTeamMemberId: isInternal ? teamMemberId : null,
          messageText: trimmed,
        }),
      )

      setReply("")
      replyRef.current?.focus()
    } catch (caught) {
      setReplyError(caught instanceof Error ? caught.message : "Failed to send message.")
    } finally {
      setSendingReply(false)
    }
  }, [canSendReply, isClient, isInternal, reply, sendingReply, teamMemberId, ticketId, z])

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return
      if (event.key !== "Escape") return
      if (isEditableTarget(event.target)) return
      event.preventDefault()
      router.push("/tickets")
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [router])

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return
      if (event.key !== "Enter") return
      if (!event.metaKey && !event.ctrlKey) return
      if (document.activeElement !== replyRef.current) return
      event.preventDefault()
      void sendReply()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [sendReply])

  const [rating, setRating] = React.useState<Rating>(5)
  const [feedbackText, setFeedbackText] = React.useState("")
  const [submittingFeedback, setSubmittingFeedback] = React.useState(false)
  const [feedbackError, setFeedbackError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const existingRating = parseRating(isRecord(feedback) ? feedback.rating : null)
    setRating(existingRating ?? 5)
    const existingText =
      isRecord(feedback) && isString(feedback.feedbackText) ? feedback.feedbackText : ""
    setFeedbackText(existingText)
  }, [feedback])

  const submitFeedback = React.useCallback(async () => {
    if (!ticket) return
    if (!isClient) return
    if (ticket.status !== "resolved") return
    if (submittingFeedback) return

    setFeedbackError(null)
    setSubmittingFeedback(true)

    try {
      const res = await fetch("/api/ids", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ticketFeedback: 1 }),
      })
      if (!res.ok) throw new Error("Failed to submit feedback.")
      const json: unknown = await res.json()
      const feedbackId = parseAllocatedId(json, "ticketFeedback")
      if (!feedbackId) throw new Error("Failed to submit feedback.")

      await z.mutate(
        mutators.ticketFeedback.upsert({
          id: feedbackId,
          ticketId,
          rating,
          feedbackText: feedbackText.trim() ? feedbackText.trim() : undefined,
        }),
      )
    } catch (caught) {
      setFeedbackError(caught instanceof Error ? caught.message : "Failed to submit feedback.")
    } finally {
      setSubmittingFeedback(false)
    }
  }, [feedbackText, isClient, rating, submittingFeedback, ticket, ticketId, z])

  const ticketTitle = ticket ? ticket.title : `Ticket #${ticketId}`

  const ticketTypeLabel = React.useMemo(() => {
    if (!ticket) return "—"
    if ("ticketType" in ticket && isRecord(ticket.ticketType) && isString(ticket.ticketType.typeName)) {
      return ticket.ticketType.typeName
    }
    return `Type ${ticket.ticketTypeId}`
  }, [ticket])

  const assigneeLabel = React.useMemo(() => {
    if (!ticket) return "Unassigned"
    if ("assignee" in ticket && isRecord(ticket.assignee) && isString(ticket.assignee.username)) {
      return ticket.assignee.username
    }
    return ticket.assignedTo ? `User ${ticket.assignedTo}` : "Unassigned"
  }, [ticket])

  const clientLabel = React.useMemo(() => {
    if (!isInternal || !ticket) return null
    if (!("client" in ticket)) return null
    const client = ticket.client
    if (!isRecord(client) || !isString(client.clientName)) return null
    return client.clientName
  }, [isInternal, ticket])

  const [updateError, setUpdateError] = React.useState<string | null>(null)
  const [updatingField, setUpdatingField] = React.useState<"status" | "priority" | "assignee" | null>(null)

  const updateStatus = React.useCallback(
    async (nextStatus: "open" | "in_progress" | "resolved") => {
      if (!ticket) return
      if (!isInternal) return
      if (updatingField) return
      setUpdateError(null)
      setUpdatingField("status")

      try {
        const resolvedAt =
          nextStatus === "resolved"
            ? typeof ticket.resolvedAt === "number" && Number.isFinite(ticket.resolvedAt)
              ? ticket.resolvedAt
              : Date.now()
            : null

        await z.mutate(
          mutators.tickets.setStatus({
            id: ticketId,
            status: nextStatus,
            resolvedAt,
            closedAt: null,
          }),
        )
      } catch (caught) {
        setUpdateError(caught instanceof Error ? caught.message : "Failed to update status.")
      } finally {
        setUpdatingField(null)
      }
    },
    [isInternal, ticket, ticketId, updatingField, z],
  )

  const updatePriority = React.useCallback(
    async (next: "low" | "medium" | "high" | "urgent" | null) => {
      if (!ticket) return
      if (!isInternal) return
      if (updatingField) return
      setUpdateError(null)
      setUpdatingField("priority")

      try {
        await z.mutate(
          mutators.tickets.setPriority({
            id: ticketId,
            priority: next,
          }),
        )
      } catch (caught) {
        setUpdateError(caught instanceof Error ? caught.message : "Failed to update priority.")
      } finally {
        setUpdatingField(null)
      }
    },
    [isInternal, ticket, ticketId, updatingField, z],
  )

  const updateAssignee = React.useCallback(
    async (next: number | null) => {
      if (!ticket) return
      if (!isInternal) return
      if (updatingField) return
      setUpdateError(null)
      setUpdatingField("assignee")

      try {
        await z.mutate(
          mutators.tickets.setAssignedTo({
            id: ticketId,
            assignedTo: next,
          }),
        )
      } catch (caught) {
        setUpdateError(caught instanceof Error ? caught.message : "Failed to update assignee.")
      } finally {
        setUpdatingField(null)
      }
    },
    [isInternal, ticket, ticketId, updatingField, z],
  )

  return (
    <div className="w-full px-6 py-6">
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <div className="flex items-center justify-between gap-4">
          <Button variant="ghost" size="sm" render={<Link href="/tickets" />}>
            <ArrowLeftIcon className="size-4" aria-hidden="true" />
            Back
          </Button>
          <div className="text-muted-foreground text-xs">Esc to go back</div>
        </div>

        <Frame>
          <FramePanel className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-muted-foreground text-xs font-medium">Ticket #{ticketId}</div>
                <h1 className="truncate text-lg font-semibold">{ticketTitle}</h1>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  <span
                    aria-hidden="true"
                    className={cn("size-1.5 rounded-full", getStatusDot(ticket?.status))}
                  />
                  {ticket?.status ? formatLabel(ticket.status) : "—"}
                </Badge>
                <Badge variant="outline">
                  <span
                    aria-hidden="true"
                    className={cn("size-1.5 rounded-full", getPriorityDot(ticket?.priority))}
                  />
                  {ticket?.priority ? formatLabel(ticket.priority) : "—"}
                </Badge>
              </div>
            </div>

            <div className="grid gap-2 text-sm sm:grid-cols-2">
              {clientLabel ? (
                <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                  <span className="text-muted-foreground">Client</span>
                  <span className="font-medium">{clientLabel}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">{ticketTypeLabel}</span>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                <span className="text-muted-foreground">Assignee</span>
                <span className="font-medium">{assigneeLabel}</span>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium tabular-nums">{formatTimestamp(ticket?.createdAt ?? null)}</span>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                <span className="text-muted-foreground">Resolved</span>
                <span className="font-medium tabular-nums">{formatTimestamp(ticket?.resolvedAt ?? null)}</span>
              </div>
            </div>

            {isInternal && ticket ? (
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-md border px-3 py-2">
                  <div className="text-muted-foreground text-xs">Status</div>
                  <select
                    value={ticket.status ?? "open"}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === "open" || value === "in_progress" || value === "resolved") {
                        void updateStatus(value)
                      }
                    }}
                    disabled={updatingField !== null}
                    className={cn(
                      "mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-sm shadow-xs outline-none",
                      "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/24",
                    )}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                <div className="rounded-md border px-3 py-2">
                  <div className="text-muted-foreground text-xs">Priority</div>
                  <select
                    value={ticket.priority ?? ""}
                    onChange={(e) => {
                      const value = e.target.value
                      if (!value) {
                        void updatePriority(null)
                        return
                      }
                      if (value === "low" || value === "medium" || value === "high" || value === "urgent") {
                        void updatePriority(value)
                      }
                    }}
                    disabled={updatingField !== null}
                    className={cn(
                      "mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-sm shadow-xs outline-none",
                      "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/24",
                    )}
                  >
                    <option value="">—</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="rounded-md border px-3 py-2">
                  <div className="text-muted-foreground text-xs">Assignee</div>
                  <select
                    value={ticket.assignedTo ? String(ticket.assignedTo) : ""}
                    onChange={(e) => {
                      const value = e.target.value
                      if (!value) {
                        void updateAssignee(null)
                        return
                      }
                      const parsed = Number(value)
                      if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) return
                      void updateAssignee(parsed)
                    }}
                    disabled={updatingField !== null}
                    className={cn(
                      "mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-sm shadow-xs outline-none",
                      "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/24",
                    )}
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map((tm) => (
                      <option key={tm.id} value={String(tm.id)}>
                        {tm.username}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}

            {updateError ? <div className="text-destructive text-xs">{updateError}</div> : null}

            {ticketResult.type !== "complete" ? (
              <div className="text-muted-foreground text-xs">Loading ticket…</div>
            ) : !ticket ? (
              <div className="text-sm">
                <div className="font-semibold">Not found</div>
                <div className="text-muted-foreground text-sm">
                  You don’t have access to this ticket, or it doesn’t exist.
                </div>
              </div>
            ) : null}
          </FramePanel>
        </Frame>

        <Frame>
          <FramePanel className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Messages</div>
              <div className="text-muted-foreground text-xs">
                {messagesResult.type === "complete" ? `${messages.length} total` : "Loading…"}
              </div>
            </div>

            <div className="space-y-3">
              {messagesResult.type !== "complete" ? (
                <div className="text-muted-foreground text-sm">Loading messages…</div>
              ) : messages.length === 0 ? (
                <div className="text-muted-foreground text-sm">No messages yet.</div>
              ) : (
                messages.map((msg) => {
                  const isFromClient = Boolean(msg.fromClient)
                  const fromTeamMember =
                    "fromTeamMember" in msg ? msg.fromTeamMember : null
                  const author = isFromClient
                    ? isClient
                      ? "You"
                      : "Client"
                    : isRecord(fromTeamMember) && isString(fromTeamMember.username)
                      ? fromTeamMember.username
                      : "Team"
                  return (
                    <div key={msg.id} className="rounded-lg border bg-muted/20 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-semibold">{author}</div>
                        <div className="text-muted-foreground text-xs tabular-nums">
                          {formatTimestamp(msg.createdAt ?? null)}
                        </div>
                      </div>
                      <div className="mt-2 whitespace-pre-wrap text-sm">{msg.messageText}</div>
                    </div>
                  )
                })
              )}
            </div>
          </FramePanel>

          <FramePanel className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold">Reply</div>
              <div className="text-muted-foreground text-xs">Cmd/Ctrl + Enter to send</div>
            </div>

            <Textarea
              ref={replyRef}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Write a reply…"
              rows={4}
              disabled={!canSendReply}
            />

            {replyError ? <div className="text-destructive text-xs">{replyError}</div> : null}

            <div className="flex items-center justify-end">
              <Button onClick={() => void sendReply()} disabled={!canSendReply || sendingReply}>
                <SendIcon aria-hidden="true" className="size-4" />
                {sendingReply ? "Sending…" : "Send"}
              </Button>
            </div>
          </FramePanel>
        </Frame>

        {ticket && ticket.status === "resolved" ? (
          <Frame>
            <FramePanel className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold">Feedback</div>
                <div className="text-muted-foreground text-xs">
                  {feedbackResult.type === "complete" && feedback ? "Submitted" : "Not submitted"}
                </div>
              </div>

              {isClient ? (
                <>
                  <div className="flex items-center gap-1">
                    {([1, 2, 3, 4, 5] as const).map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={cn(
                          "inline-flex size-9 items-center justify-center rounded-md border transition-colors",
                          value <= rating
                            ? "border-amber-400/40 bg-amber-400/10 text-amber-500"
                            : "border-border bg-background text-muted-foreground hover:bg-muted/40",
                        )}
                        aria-label={`${value} star`}
                        onClick={() => setRating(value)}
                      >
                        <StarIcon className="size-4" aria-hidden="true" />
                      </button>
                    ))}
                    <span className="text-muted-foreground ml-2 text-xs">{rating}/5</span>
                  </div>

                  <Input
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Optional feedback…"
                    disabled={submittingFeedback}
                  />

                  {feedbackError ? <div className="text-destructive text-xs">{feedbackError}</div> : null}

                  <div className="flex items-center justify-end">
                    <Button onClick={() => void submitFeedback()} disabled={submittingFeedback}>
                      {submittingFeedback ? "Submitting…" : feedback ? "Update feedback" : "Submit feedback"}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-sm">
                  {feedback ? (
                    <div className="space-y-1">
                      <div className="text-muted-foreground text-xs">
                        Rating:{" "}
                        <span className="font-medium text-foreground">
                          {typeof feedback.rating === "number" ? feedback.rating : "—"}
                        </span>
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Feedback:{" "}
                        <span className="font-medium text-foreground">
                          {isString(feedback.feedbackText) && feedback.feedbackText.trim()
                            ? feedback.feedbackText
                            : "—"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground">No feedback yet.</div>
                  )}
                </div>
              )}
            </FramePanel>
          </Frame>
        ) : null}

        {isInternal ? (
          <div className="text-muted-foreground text-xs">
            Internal role: {internalRole ?? "—"}
          </div>
        ) : null}
      </div>
    </div>
  )
}
