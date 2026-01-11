"use client"

import * as React from "react"
import { useZero } from "@rocicorp/zero/react"
import {
  BoxIcon,
  Building2Icon,
  ChevronRightIcon,
  Maximize2Icon,
  MoreHorizontalIcon,
  PaperclipIcon,
  UserIcon,
  XIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogPopup } from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { isRecord, isString } from "@/lib/type-guards"
import { cn } from "@/lib/utils"
import { mutators } from "@/zero/mutators"
import { Switch } from "@/components/ui/switch"
import { toastManager } from "@/components/ui/toast"

type TicketTypeRow = {
  id: number
  typeName: string
}

type TeamMemberRow = {
  id: number
  username: string
}

type ClientRow = {
  id: number
  clientName: string
}

type AllocateIdsResponse = {
  ok: true
  ids: {
    tickets: number[]
    ticketMessages: number[]
  }
}

function parseAllocateIdsResponse(value: unknown): AllocateIdsResponse | null {
  if (!isRecord(value) || value.ok !== true) return null
  const ids = value.ids
  if (!isRecord(ids)) return null
  const tickets = ids.tickets
  const ticketMessages = ids.ticketMessages
  if (!Array.isArray(tickets) || !Array.isArray(ticketMessages)) return null
  const ticketId = tickets[0]
  const messageId = ticketMessages[0]
  if (typeof ticketId !== "number" || !Number.isInteger(ticketId) || ticketId <= 0) return null
  if (typeof messageId !== "number" || !Number.isInteger(messageId) || messageId <= 0) return null
  return { ok: true, ids: { tickets: [ticketId], ticketMessages: [messageId] } }
}

type PriorityValue = "low" | "medium" | "high" | "urgent"

function parsePriorityValue(value: string): PriorityValue | null {
  if (value === "low" || value === "medium" || value === "high" || value === "urgent") return value
  return null
}

type StatusValue = "open" | "in_progress"

function parseStatusValue(value: string): StatusValue | null {
  if (value === "open" || value === "in_progress") return value
  return null
}

function formatPriorityLabel(priority: PriorityValue) {
  switch (priority) {
    case "low":
      return "Low"
    case "medium":
      return "Medium"
    case "high":
      return "High"
    case "urgent":
      return "Urgent"
  }
}

function formatStatusLabel(status: StatusValue) {
  return status === "in_progress" ? "In progress" : "Open"
}

function ConIcon({ className }: { className?: string }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("text-muted-foreground/72", className)}
      aria-hidden="true"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

function PriorityIcon({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-muted-foreground/70", className)}
      aria-hidden="true"
    >
      <path d="M2 7H4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 7H9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 7H12.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function InProgressIcon({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-amber-500", className)}
      aria-hidden="true"
    >
      <path
        d="M7 13C10.3137 13 13 10.3137 13 7C13 3.68629 10.3137 1 7 1C3.68629 1 1 3.68629 1 7C1 10.3137 3.68629 13 7 13Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M7 3.5V7H10.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function CreateTicketDialog({
  open,
  onOpenChange,
  userType,
  clientId,
  teamMemberId,
  ticketTypes,
  clients,
  teamMembers,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  userType: "client" | "internal"
  clientId: number | null
  teamMemberId: number | null
  ticketTypes: readonly TicketTypeRow[]
  clients: readonly ClientRow[]
  teamMembers: readonly TeamMemberRow[]
  onCreated: (ticketId: number) => void
}) {
  const z = useZero()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [createMore, setCreateMore] = React.useState(false)
  const titleRef = React.useRef<HTMLInputElement | null>(null)

  const initialTicketTypeId = React.useMemo(() => {
    const first = ticketTypes[0]?.id ?? null
    return typeof first === "number" && Number.isInteger(first) && first > 0 ? String(first) : ""
  }, [ticketTypes])

  const [ticketTypeId, setTicketTypeId] = React.useState(initialTicketTypeId)
  const [priority, setPriority] = React.useState<PriorityValue>("medium")
  const [status, setStatus] = React.useState<StatusValue>("open")
  const [selectedClientId, setSelectedClientId] = React.useState<string>("")
  const [assignedTo, setAssignedTo] = React.useState<string>("")
  const [title, setTitle] = React.useState("")
  const [message, setMessage] = React.useState("")

  React.useEffect(() => {
    if (!open) return
    setError(null)
    setIsSubmitting(false)
    setTicketTypeId(initialTicketTypeId)
    setPriority("medium")
    setStatus("open")
    setSelectedClientId("")
    setAssignedTo(teamMemberId ? String(teamMemberId) : "")
    setTitle("")
    setMessage("")
    setCreateMore(false)
  }, [initialTicketTypeId, open, teamMemberId])

  const submit = React.useCallback(async () => {
    if (isSubmitting) return

    const trimmedTitle = title.trim()
    const trimmedMessage = message.trim()
    const ticketTypeIdNumber = Number(ticketTypeId)
    const parsedPriority = priority
    const parsedAssignedTo = assignedTo.trim() ? Number(assignedTo) : null

    const resolvedClientId =
      userType === "client" ? clientId : selectedClientId.trim() ? Number(selectedClientId) : null

    if (userType === "client") {
      if (!clientId) {
        setError("Missing client context.")
        return
      }
    } else {
      if (!teamMemberId) {
        setError("Missing team member context.")
        return
      }
      if (!resolvedClientId || !Number.isInteger(resolvedClientId) || resolvedClientId <= 0) {
        setError("Please choose a client.")
        return
      }
    }

    if (!Number.isInteger(ticketTypeIdNumber) || ticketTypeIdNumber <= 0) {
      setError("Please choose a ticket type.")
      return
    }

    if (!trimmedTitle) {
      setError("Please add a title.")
      return
    }

    if (!trimmedMessage) {
      setError("Please add a description.")
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      const res = await fetch("/api/ids", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tickets: 1, ticketMessages: 1 }),
      })

      if (!res.ok) {
        throw new Error("Failed to allocate ticket ID.")
      }

      const json: unknown = await res.json()
      const parsed = parseAllocateIdsResponse(json)
      const ticketId = parsed?.ids.tickets[0]
      const messageId = parsed?.ids.ticketMessages[0]
      if (!ticketId || !messageId) {
        throw new Error("Failed to allocate ticket ID.")
      }

      await z.mutate(
        mutators.tickets.create({
          id: ticketId,
          clientId: resolvedClientId ?? 0,
          ticketTypeId: ticketTypeIdNumber,
          assignedTo:
            userType === "internal" && parsedAssignedTo && Number.isInteger(parsedAssignedTo) && parsedAssignedTo > 0
              ? parsedAssignedTo
              : null,
          status: userType === "internal" ? status : undefined,
          priority: parsedPriority,
          title: trimmedTitle,
        }),
      )

      await z.mutate(
        mutators.ticketMessages.create({
          id: messageId,
          ticketId,
          fromClient: userType === "client",
          messageText: trimmedMessage,
        }),
      )

      if (createMore) {
        setTitle("")
        setMessage("")
        toastManager.add({
          title: "Ticket created",
          description: `Created ticket #${ticketId}.`,
          type: "success",
        })
        titleRef.current?.focus()
        return
      }

      onOpenChange(false)
      onCreated(ticketId)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to create ticket.")
    } finally {
      setIsSubmitting(false)
    }
  }, [
    assignedTo,
    clientId,
    isSubmitting,
    message,
    onCreated,
    onOpenChange,
    priority,
    selectedClientId,
    teamMemberId,
    ticketTypeId,
    title,
    createMore,
    status,
    userType,
    z,
  ])

  React.useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter") return
      if (!event.metaKey && !event.ctrlKey) return
      event.preventDefault()
      void submit()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, submit])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="font-sans w-[min(96vw,48rem)] max-w-none gap-0 overflow-hidden rounded-xl border border-border p-0 shadow-2xl ring-0">
        <div className="flex select-none items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-[4px] border bg-muted/30 px-1.5 py-0.5">
              <ConIcon />
              <span className="text-[11px] font-medium tracking-wide text-muted-foreground">
                OK
              </span>
            </div>
            <ChevronRightIcon className="size-3.5 text-muted-foreground/60" aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground">
              {userType === "client" ? "New ticket" : "New ticket"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:text-foreground"
              aria-label="Maximize (coming soon)"
              disabled
            >
              <Maximize2Icon className="size-3.5" aria-hidden="true" />
            </Button>
            <DialogClose
              variant="ghost"
              size="icon-xs"
              aria-label="Close create ticket dialog"
              className="text-muted-foreground hover:text-foreground"
            >
              <XIcon className="size-4" aria-hidden="true" />
            </DialogClose>
          </div>
        </div>

        <div className="px-6 pt-1 pb-4">
          <input
            ref={titleRef}
            type="text"
            aria-label="Ticket title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ticket title"
            autoComplete="off"
            spellCheck
            className="mb-3 w-full bg-transparent text-[17px] font-medium text-foreground placeholder:text-muted-foreground/60 outline-none"
          />

          <textarea
            aria-label="Ticket description"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add description…"
            className="min-h-24 w-full resize-none bg-transparent text-[15px] leading-relaxed text-foreground/90 placeholder:text-muted-foreground/45 outline-none"
          />

          {error ? <div className="mt-3 text-destructive text-xs">{error}</div> : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 px-6 pb-2">
          <Select
            value={status}
            onValueChange={(value) => {
              if (userType !== "internal") return
              if (!value) return
              const parsed = parseStatusValue(value)
              if (!parsed) return
              setStatus(parsed)
            }}
          >
            <SelectTrigger
              size="sm"
              className={cn(
                "h-6 w-fit rounded-md border border-transparent bg-muted/30 px-2 text-[13px] shadow-none hover:bg-muted/40",
                "[&>svg]:hidden",
                userType === "client" ? "pointer-events-none opacity-80" : "",
              )}
            >
              <SelectValue>
                {() => (
                  <span className={cn("inline-flex items-center gap-1.5", status === "in_progress" ? "text-amber-500" : "text-muted-foreground/80")}>
                    <InProgressIcon className={status === "in_progress" ? "text-amber-500" : "text-muted-foreground/60"} />
                    {formatStatusLabel(status)}
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="start">
              <SelectGroup>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          {userType === "internal" ? (
            <Select value={selectedClientId} onValueChange={(value) => setSelectedClientId(value ?? "")}>
              <SelectTrigger
                size="sm"
                className={cn(
                  "h-6 w-fit rounded-md border border-transparent bg-muted/30 px-2 text-[13px] shadow-none hover:bg-muted/40",
                  "[&>svg]:hidden",
                )}
              >
                <SelectValue>
                  {(value: unknown) => {
                    if (!isString(value) || !value) {
                      return (
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground/70">
                          <Building2Icon className="size-3.5" aria-hidden="true" />
                          Client
                        </span>
                      )
                    }
                    const id = Number(value)
                    const match = clients.find((client) => client.id === id)
                    return (
                      <span className="inline-flex items-center gap-1.5">
                        <Building2Icon className="size-3.5" aria-hidden="true" />
                        {match?.clientName ?? `Client ${value}`}
                      </span>
                    )
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="start" className="w-[min(92vw,22rem)]">
                <SelectGroup>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={String(client.id)}>
                      {client.clientName}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          ) : null}

          <Select value={ticketTypeId} onValueChange={(value) => setTicketTypeId(value ?? "")}>
            <SelectTrigger
              size="sm"
              className={cn(
                "h-6 w-fit rounded-md border border-transparent bg-muted/30 px-2 text-[13px] shadow-none hover:bg-muted/40",
                "[&>svg]:hidden",
              )}
            >
              <SelectValue>
                {(value: unknown) => {
                  if (!isString(value) || !value) {
                    return (
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground/70">
                        <BoxIcon className="size-3.5" aria-hidden="true" />
                        Ticket type
                      </span>
                    )
                  }
                  const id = Number(value)
                  const match = ticketTypes.find((tt) => tt.id === id)
                  return (
                    <span className="inline-flex items-center gap-1.5">
                      <BoxIcon className="size-3.5" aria-hidden="true" />
                      {match?.typeName ?? `Type ${value}`}
                    </span>
                  )
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="start" className="w-[min(92vw,22rem)]">
              <SelectGroup>
                {ticketTypes.map((tt) => (
                  <SelectItem key={tt.id} value={String(tt.id)}>
                    {tt.typeName}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={priority}
            onValueChange={(value) => {
              if (!value) return
              const parsed = parsePriorityValue(value)
              if (!parsed) return
              setPriority(parsed)
            }}
          >
            <SelectTrigger
              size="sm"
              className={cn(
                "h-6 w-fit rounded-md border border-transparent bg-muted/30 px-2 text-[13px] shadow-none hover:bg-muted/40",
                "[&>svg]:hidden",
              )}
            >
              <SelectValue>
                {() => (
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground/80">
                    <PriorityIcon />
                    {formatPriorityLabel(priority)}
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="start">
              <SelectGroup>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          {userType === "internal" ? (
            <Select value={assignedTo} onValueChange={(value) => setAssignedTo(value ?? "")}>
              <SelectTrigger
                size="sm"
                className={cn(
                  "h-6 w-fit rounded-md border border-transparent bg-muted/30 px-2 text-[13px] shadow-none hover:bg-muted/40",
                  "[&>svg]:hidden",
                )}
              >
                <SelectValue>
                  {(value: unknown) => {
                    if (!isString(value) || !value || value === "none") {
                      return (
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground/70">
                          <UserIcon className="size-3.5" aria-hidden="true" />
                          Assignee
                        </span>
                      )
                    }
                    const id = Number(value)
                    const match = teamMembers.find((tm) => tm.id === id)
                    return (
                      <span className="inline-flex items-center gap-1.5">
                        <UserIcon className="size-3.5" aria-hidden="true" />
                        {match?.username ?? `User ${value}`}
                      </span>
                    )
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="start" className="w-[min(92vw,22rem)]">
                <SelectGroup>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {teamMembers.map((tm) => (
                    <SelectItem key={tm.id} value={String(tm.id)}>
                      {tm.username}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          ) : null}

          <Button
            variant="ghost"
            size="icon-xs"
            className="h-6 w-7 rounded-md border border-transparent bg-muted/30 text-muted-foreground hover:bg-muted/40"
            aria-label="More properties"
            disabled
          >
            <MoreHorizontalIcon className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="mt-2 flex items-center justify-between border-t px-5 py-3.5">
          <Button
            variant="ghost"
            size="icon-xs"
            className="-ml-1 text-muted-foreground hover:text-foreground"
            aria-label="Attach (coming soon)"
            disabled
          >
            <PaperclipIcon className="size-4 rotate-45" aria-hidden="true" />
          </Button>

          <div className="flex items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground">
              <Switch checked={createMore} onCheckedChange={(checked) => setCreateMore(Boolean(checked))} />
              <span className="select-none">Create more</span>
            </label>

            <Button
              onClick={submit}
              disabled={isSubmitting}
              size="sm"
              className="h-8 px-3 text-[13px] font-medium"
            >
              {isSubmitting ? "Creating…" : "Create ticket"}
            </Button>
          </div>
        </div>
      </DialogPopup>
    </Dialog>
  )
}
