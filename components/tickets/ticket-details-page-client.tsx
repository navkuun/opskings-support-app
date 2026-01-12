"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery, useZero } from "@rocicorp/zero/react"
import {
  ArrowLeftIcon,
  CaretRightIcon,
  CheckCircleIcon,
  CubeIcon,
  FlagIcon,
  HexagonIcon,
  PaperPlaneRightIcon,
  StarIcon,
  UserCircleIcon,
} from "@phosphor-icons/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Kbd } from "@/components/ui/kbd"
import { toastManager } from "@/components/ui/toast"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatTeamMemberLabel } from "@/lib/dashboard/utils"
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

function getStatusTextColor(status: string | null | undefined) {
  const value = (status ?? "").toLowerCase()
  if (!value) return "text-muted-foreground/70"
  if (value.includes("resolved") || value.includes("closed")) return "text-emerald-500"
  if (value.includes("progress")) return "text-amber-500"
  if (value.includes("hold") || value.includes("blocked")) return "text-blue-500"
  if (value.includes("cancel")) return "text-rose-500"
  return "text-muted-foreground/70"
}

function getPriorityTextColor(priority: string | null | undefined) {
  const value = (priority ?? "").toLowerCase()
  if (!value) return "text-muted-foreground/70"
  if (value.includes("urgent")) return "text-rose-500"
  if (value.includes("high")) return "text-amber-500"
  if (value.includes("medium")) return "text-blue-500"
  if (value.includes("low")) return "text-emerald-500"
  return "text-muted-foreground/70"
}

type Rating = 1 | 2 | 3 | 4 | 5

function parseRating(value: unknown): Rating | null {
  if (typeof value !== "number" || !Number.isInteger(value)) return null
  if (value === 1 || value === 2 || value === 3 || value === 4 || value === 5) return value
  return null
}

function SidebarSection({
  title,
  children,
  border = true,
}: {
  title: string
  children: React.ReactNode
  border?: boolean
}) {
  return (
    <div className={cn("py-3", border ? "border-b border-border/40" : "")}>
      <h3 className="px-5 text-[11px] font-medium text-muted-foreground mb-1 hover:text-foreground cursor-pointer transition-colors">
        {title}
      </h3>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  )
}

function SidebarPropertyRow({
  label,
  icon,
  value,
}: {
  label: string
  icon: React.ReactNode
  value: React.ReactNode
}) {
  return (
    <div className="flex min-h-[34px] items-center justify-between gap-3 px-5 py-1.5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        <span className="whitespace-nowrap">{label}</span>
      </div>
      <div className="flex justify-end min-w-0">{value}</div>
    </div>
  )
}

function SidebarValueBadge({ children }: { children: React.ReactNode }) {
  return (
    <Badge variant="outline" className="h-6 max-w-[150px] min-w-0 px-2.5 text-xs">
      <span className="min-w-0 truncate">{children}</span>
    </Badge>
  )
}

export function TicketDetailsPageClient({
  ticketId,
  userType,
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
  const [isEditingFeedback, setIsEditingFeedback] = React.useState(false)

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

      toastManager.add({
        title: feedback ? "Feedback updated" : "Feedback submitted",
        description: "Thanks for the feedback.",
        type: "success",
      })
      setIsEditingFeedback(false)
    } catch (caught) {
      setFeedbackError(caught instanceof Error ? caught.message : "Failed to submit feedback.")
    } finally {
      setSubmittingFeedback(false)
    }
  }, [feedback, feedbackText, isClient, rating, submittingFeedback, ticket, ticketId, z])

  const cancelFeedbackEdit = React.useCallback(() => {
    const existingRating = parseRating(isRecord(feedback) ? feedback.rating : null)
    setRating(existingRating ?? 5)
    const existingText =
      isRecord(feedback) && isString(feedback.feedbackText) ? feedback.feedbackText : ""
    setFeedbackText(existingText)
    setFeedbackError(null)
    setIsEditingFeedback(false)
  }, [feedback])

  const hasSubmittedFeedback = feedbackResult.type === "complete" && Boolean(feedback)
  const submittedRating = parseRating(isRecord(feedback) ? feedback.rating : null) ?? 5
  const submittedFeedbackText =
    isRecord(feedback) && isString(feedback.feedbackText) ? feedback.feedbackText : ""

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
      return formatTeamMemberLabel(ticket.assignee.username)
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

  type TicketMessage = (typeof messages)[number]

  const getMessageAuthor = React.useCallback(
    (msg: TicketMessage) => {
      const isFromClient = Boolean(msg.fromClient)
      const fromTeamMember = "fromTeamMember" in msg ? msg.fromTeamMember : null

      if (isFromClient) {
        return isClient ? "You" : "Client"
      }

      if (isRecord(fromTeamMember) && isString(fromTeamMember.username)) {
        return formatTeamMemberLabel(fromTeamMember.username)
      }

      return "Team"
    },
    [isClient],
  )

  const descriptionMessage = messages[0] ?? null
  const commentMessages = messages.length > 1 ? messages.slice(1) : []

  return (
    <div className="flex w-full flex-1 min-h-0 bg-background text-foreground overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-h-[50px] items-center justify-between gap-4 border-b border-border/40 px-6 py-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Button variant="ghost" size="xs" render={<Link href="/tickets" />} aria-label="Back to tickets">
              <ArrowLeftIcon className="size-4" aria-hidden="true" />
              Tickets
            </Button>
            <CaretRightIcon className="size-3.5 text-muted-foreground/60" aria-hidden="true" />
            <span className="font-medium text-foreground/80">#{ticketId}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Back</span>
            <Kbd>Esc</Kbd>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 bg-background">
          <div className="mx-auto w-full max-w-[850px] px-6 pb-24 pt-6 sm:px-8 lg:px-12">
            {ticketResult.type !== "complete" ? (
              <div className="text-muted-foreground text-sm">Loading ticket…</div>
            ) : !ticket ? (
              <div className="space-y-2">
                <div className="text-lg font-semibold">Not found</div>
                <div className="text-muted-foreground text-sm">
                  You don’t have access to this ticket, or it doesn’t exist.
                </div>
              </div>
            ) : (
              <>
                <h1 className="mb-6 text-[23px] leading-[1.35] font-semibold tracking-tight text-foreground">
                  {ticketTitle}
                </h1>

                <div className="mb-6 text-[13px] font-medium text-muted-foreground">
                  {ticketTypeLabel}
                  {clientLabel ? ` • ${clientLabel}` : ""}
                  {assigneeLabel ? ` • ${assigneeLabel}` : ""}
                </div>

                <div className="space-y-5 text-[15px] leading-[1.6] text-foreground/90">
                  {messagesResult.type !== "complete" ? (
                    <div className="text-muted-foreground">Loading…</div>
                  ) : !descriptionMessage ? (
                    <p className="text-muted-foreground">No description.</p>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
                        <span className="font-medium">{getMessageAuthor(descriptionMessage)}</span>
                        <span className="tabular-nums">
                          {formatTimestamp(descriptionMessage.createdAt ?? null)}
                        </span>
                      </div>
                      <div className="whitespace-pre-wrap">{descriptionMessage.messageText}</div>
                    </>
                  )}
                </div>

                <div className="mt-12">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-[11px] font-medium text-muted-foreground">
                      Activity
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {messagesResult.type === "complete" ? `${commentMessages.length} messages` : "Loading…"}
                    </div>
                  </div>

                  {messagesResult.type !== "complete" ? (
                    <div className="text-muted-foreground text-sm">Loading messages…</div>
                  ) : commentMessages.length === 0 ? (
                    <div className="text-muted-foreground text-sm">No messages yet.</div>
                  ) : (
                    <div className="max-h-[420px] overflow-y-auto pr-2">
                      <div className="space-y-8">
                        {commentMessages.map((msg) => {
                          const author = getMessageAuthor(msg)
                          const initial = author.trim() ? author.trim()[0]!.toUpperCase() : "?"
                          return (
                            <div key={msg.id} className="flex gap-3">
                              <div
                                className="mt-0.5 flex size-8 items-center justify-center rounded-full border bg-muted/10 text-xs font-semibold text-muted-foreground"
                                aria-hidden="true"
                              >
                                {initial}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="text-[13px] font-semibold text-foreground/90">{author}</div>
                                  <div className="text-muted-foreground text-xs tabular-nums">
                                    {formatTimestamp(msg.createdAt ?? null)}
                                  </div>
                                </div>
                                <div className="mt-2 whitespace-pre-wrap text-[15px] leading-[1.6] text-foreground/90">
                                  {msg.messageText}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-12 border-t border-border/40 pt-8">
                  <div className="mb-3 flex items-center justify-between gap-3">
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

                  {replyError ? <div className="mt-2 text-destructive text-xs">{replyError}</div> : null}

                  <div className="mt-3 flex items-center justify-end">
                    <Button onClick={() => void sendReply()} disabled={!canSendReply || sendingReply}>
                      <PaperPlaneRightIcon aria-hidden="true" className="size-4" />
                      {sendingReply ? "Sending…" : "Send"}
                    </Button>
                  </div>
                </div>

                {ticket.status === "resolved" ? (
                  <div className="mt-12 border-t border-border/40 pt-8">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold">Feedback</div>
                      <div className="text-muted-foreground text-xs">
                        {feedbackResult.type !== "complete"
                          ? "Loading…"
                          : hasSubmittedFeedback
                            ? "Submitted"
                            : "Not submitted"}
                      </div>
                    </div>

                    {isClient ? (
                      hasSubmittedFeedback && !isEditingFeedback ? (
                        <Card size="sm">
                          <CardHeader className="border-b border-border/40">
                            <CardTitle>Your feedback</CardTitle>
                            <CardAction>
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => setIsEditingFeedback(true)}
                                disabled={submittingFeedback}
                              >
                                Edit
                              </Button>
                            </CardAction>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center gap-1 text-foreground">
                              {([1, 2, 3, 4, 5] as const).map((value) => (
                                <StarIcon
                                  key={value}
                                  weight={value <= submittedRating ? "fill" : "regular"}
                                  className="size-5"
                                  aria-hidden="true"
                                />
                              ))}
                              <span className="text-muted-foreground ml-2 text-xs">{submittedRating}/5</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {submittedFeedbackText.trim() ? submittedFeedbackText : "No written feedback."}
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <>
                          <div className="flex items-center gap-1 mb-3">
                            {([1, 2, 3, 4, 5] as const).map((value) => (
                              <button
                                key={value}
                                type="button"
                                className={cn(
                                  "inline-flex size-8 items-center justify-center rounded-md text-foreground transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
                                  submittingFeedback ? "pointer-events-none opacity-60" : "",
                                )}
                                aria-label={`${value} star`}
                                onClick={() => setRating(value)}
                              >
                                <StarIcon
                                  weight={value <= rating ? "fill" : "regular"}
                                  className="size-5"
                                  aria-hidden="true"
                                />
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

                          {feedbackError ? <div className="mt-2 text-destructive text-xs">{feedbackError}</div> : null}

                          <div className="mt-3 flex items-center justify-end gap-2">
                            {hasSubmittedFeedback ? (
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => cancelFeedbackEdit()}
                                disabled={submittingFeedback}
                              >
                                Cancel
                              </Button>
                            ) : null}
                            <Button onClick={() => void submitFeedback()} disabled={submittingFeedback}>
                              {submittingFeedback
                                ? "Submitting…"
                                : hasSubmittedFeedback
                                  ? "Update feedback"
                                  : "Submit feedback"}
                            </Button>
                          </div>
                        </>
                      )
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
                  </div>
                ) : null}

                <div className="h-20" />
              </>
            )}
          </div>
        </div>
      </div>

      <aside className="hidden h-full w-[280px] shrink-0 border-l border-border/40 bg-muted/10 lg:flex lg:flex-col">
        <div className="flex flex-col overflow-y-auto">
          <SidebarSection title="Properties" border={false}>
            {ticket ? (
              <>
                {clientLabel ? (
                  <SidebarPropertyRow
                    label="Client"
                    icon={<CubeIcon className="size-4 text-muted-foreground" aria-hidden="true" />}
                    value={
                      <SidebarValueBadge>{clientLabel}</SidebarValueBadge>
                    }
                  />
                ) : null}

                <SidebarPropertyRow
                  label="Type"
                  icon={<HexagonIcon className="size-4 text-muted-foreground" aria-hidden="true" />}
                  value={
                    <SidebarValueBadge>{ticketTypeLabel}</SidebarValueBadge>
                  }
                />

                <SidebarPropertyRow
                  label="Status"
                  icon={
                    <CheckCircleIcon
                      className={cn("size-4", getStatusTextColor(ticket.status))}
                      aria-hidden="true"
                    />
                  }
                  value={
                    isInternal ? (
                      <Select
                        value={ticket.status ?? "open"}
                        onValueChange={(value) => {
                          if (value === "open" || value === "in_progress" || value === "resolved") {
                            void updateStatus(value)
                          }
                        }}
                      >
                        <SelectTrigger
                          size="sm"
                          className={cn(
                            "h-6 max-w-[150px] rounded-full px-2.5 py-0 shadow-none [&>svg]:hidden",
                            updatingField ? "pointer-events-none opacity-80" : "",
                          )}
                          disabled={updatingField !== null}
                        >
                          <SelectValue className="flex-none">
                            {() => (
                              <span className="truncate">
                                {formatLabel(ticket.status ?? "open")}
                              </span>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent align="start" alignItemWithTrigger={false} className="min-w-[220px]">
                          <SelectGroup>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    ) : (
                      <SidebarValueBadge>
                        {ticket.status ? formatLabel(ticket.status) : "—"}
                      </SidebarValueBadge>
                    )
                  }
                />

                <SidebarPropertyRow
                  label="Priority"
                  icon={
                    <FlagIcon
                      className={cn("size-4", getPriorityTextColor(ticket.priority))}
                      aria-hidden="true"
                    />
                  }
                  value={
                    isInternal ? (
                      <Select
                        value={ticket.priority ?? "none"}
                        onValueChange={(value) => {
                          if (value === "none") {
                            void updatePriority(null)
                            return
                          }
                          if (value === "low" || value === "medium" || value === "high" || value === "urgent") {
                            void updatePriority(value)
                          }
                        }}
                      >
                        <SelectTrigger
                          size="sm"
                          className={cn(
                            "h-6 max-w-[150px] rounded-full px-2.5 py-0 shadow-none [&>svg]:hidden",
                            updatingField ? "pointer-events-none opacity-80" : "",
                          )}
                          disabled={updatingField !== null}
                        >
                          <SelectValue className="flex-none">
                            {() => (
                              <span className="truncate">
                                {ticket.priority ? formatLabel(ticket.priority) : "—"}
                              </span>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent align="start" alignItemWithTrigger={false} className="min-w-[220px]">
                          <SelectGroup>
                            <SelectItem value="none">No priority</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    ) : (
                      <SidebarValueBadge>
                        {ticket.priority ? formatLabel(ticket.priority) : "—"}
                      </SidebarValueBadge>
                    )
                  }
                />

                <SidebarPropertyRow
                  label="Assignee"
                  icon={<UserCircleIcon className="size-4 text-muted-foreground" aria-hidden="true" />}
                  value={
                    isInternal ? (
                      <Select
                        value={ticket.assignedTo ? String(ticket.assignedTo) : "none"}
                        onValueChange={(value) => {
                          if (value === "none") {
                            void updateAssignee(null)
                            return
                          }
                          const parsed = Number(value)
                          if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) return
                          void updateAssignee(parsed)
                        }}
                      >
                        <SelectTrigger
                          size="sm"
                          className={cn(
                            "h-6 max-w-[150px] rounded-full px-2.5 py-0 shadow-none [&>svg]:hidden",
                            updatingField ? "pointer-events-none opacity-80" : "",
                          )}
                          disabled={updatingField !== null}
                        >
                          <SelectValue className="flex-none">
                            {() => (
                              <span className="truncate">
                                {ticket.assignedTo ? assigneeLabel : "Unassigned"}
                              </span>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent align="start" alignItemWithTrigger={false} className="min-w-[220px]">
                          <SelectGroup>
                            <SelectItem value="none">Unassigned</SelectItem>
                            {teamMembers.map((tm) => (
                              <SelectItem key={tm.id} value={String(tm.id)}>
                                {formatTeamMemberLabel(tm.username)}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    ) : (
                      <SidebarValueBadge>{assigneeLabel}</SidebarValueBadge>
                    )
                  }
                />
              </>
            ) : (
              <div className="px-5 py-2 text-sm text-muted-foreground">Loading…</div>
            )}
          </SidebarSection>

          {updateError ? <div className="px-5 py-3 text-destructive text-xs">{updateError}</div> : null}
        </div>
      </aside>
    </div>
  )
}
