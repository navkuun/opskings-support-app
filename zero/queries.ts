import { defineQueries, defineQuery } from "@rocicorp/zero"
import { z } from "zod"

import type { ZeroContext } from "./context"
import { zql } from "./schema"

function isInternal(ctx: ZeroContext | undefined) {
  return ctx?.userType === "internal"
}

function getClientId(ctx: ZeroContext | undefined) {
  if (ctx?.userType !== "client") return null
  const clientId = ctx.clientId
  return typeof clientId === "number" && Number.isFinite(clientId) ? clientId : null
}

export const queries = defineQueries({
  clients: {
    list: defineQuery(
      z.object({
        limit: z.number().int().positive().max(200).default(50),
      }),
      ({ args: { limit }, ctx }) => {
        if (isInternal(ctx)) {
          return zql.clients.orderBy("createdAt", "desc").limit(limit)
        }

        const clientId = getClientId(ctx)
        if (clientId == null) {
          return zql.clients.where("id", -1)
        }

        return zql.clients.where("id", clientId).limit(1)
      },
    ),
    byId: defineQuery(
      z.object({
        id: z.number().int().positive(),
      }),
      ({ args: { id }, ctx }) => {
        if (isInternal(ctx)) {
          return zql.clients.where("id", id).one()
        }

        const clientId = getClientId(ctx)
        if (clientId == null || id !== clientId) {
          return zql.clients.where("id", -1).one()
        }

        return zql.clients.where("id", id).one()
      },
    ),
  },
  teamMembers: {
    internalList: defineQuery(
      z.object({
        limit: z.number().int().positive().max(200).default(50),
      }),
      ({ args: { limit }, ctx }) => {
        if (!isInternal(ctx)) {
          return zql.teamMembers.where("id", -1)
        }

        return zql.teamMembers.orderBy("createdAt", "desc").limit(limit)
      },
    ),
    list: defineQuery(
      z.object({
        limit: z.number().int().positive().max(200).default(50),
      }),
      ({ args: { limit }, ctx }) => {
        if (!isInternal(ctx) && getClientId(ctx) == null) {
          return zql.teamMembers.where("id", -1)
        }

        return zql.teamMembers.orderBy("createdAt", "desc").limit(limit)
      },
    ),
  },
  ticketTypes: {
    list: defineQuery(
      z.object({
        limit: z.number().int().positive().max(200).default(100),
      }),
      ({ args: { limit }, ctx }) => {
        if (!isInternal(ctx) && getClientId(ctx) == null) {
          return zql.ticketTypes.where("id", -1)
        }

        return zql.ticketTypes.limit(limit)
      },
    ),
  },
  tickets: {
    list: defineQuery(
      z.object({
        limit: z.number().int().positive().max(200).default(20),
        cursor: z
          .object({
            id: z.number().int().positive(),
            createdAt: z.number().nullable(),
          })
          .optional(),
        from: z.number().optional(),
        to: z.number().optional(),
        department: z.string().min(1).max(50).optional(),
        clientId: z.array(z.number().int().positive()).optional(),
        status: z.array(z.string().min(1).max(50)).optional(),
        priority: z.array(z.string().min(1).max(20)).optional(),
        ticketTypeId: z.array(z.number().int().positive()).optional(),
        assignedTo: z.array(z.number().int().positive()).optional(),
        includeUnassigned: z.boolean().optional(),
        search: z.string().min(1).max(255).optional(),
      }),
      ({
        args: {
          limit,
          cursor,
          from,
          to,
          department,
          clientId,
          status,
          priority,
          ticketTypeId,
          assignedTo,
          includeUnassigned,
          search,
        },
        ctx,
      }) => {
        let q = zql.tickets

        if (!isInternal(ctx)) {
          const clientId = getClientId(ctx)
          q = clientId == null ? zql.tickets.where("id", -1) : q.where("clientId", clientId)
        }

        if (from != null && Number.isFinite(from)) {
          q = q.where("createdAt", ">=", from)
        }
        if (to != null && Number.isFinite(to)) {
          q = q.where("createdAt", "<=", to)
        }

        if (department) {
          q = q.whereExists(
            "ticketType",
            (tt) => tt.where("department", department),
            { flip: true },
          )
        }

        if (clientId && clientId.length) {
          q = q.where("clientId", "IN", clientId)
        }

        if (status && status.length) {
          q = q.where("status", "IN", status)
        }

        if (priority && priority.length) {
          q = q.where("priority", "IN", priority)
        }

        if (ticketTypeId && ticketTypeId.length) {
          q = q.where("ticketTypeId", "IN", ticketTypeId)
        }

        if (assignedTo && assignedTo.length && includeUnassigned) {
          q = q.where(({ cmp, or }) =>
            or(cmp("assignedTo", "IN", assignedTo), cmp("assignedTo", "IS", null)),
          )
        } else if (assignedTo && assignedTo.length) {
          q = q.where("assignedTo", "IN", assignedTo)
        } else if (includeUnassigned) {
          q = q.where("assignedTo", "IS", null)
        }

        if (search) {
          const trimmed = search.trim()
          const asNumber = trimmed.replace(/^#/, "")
          const parsed = Number(asNumber)

          if (Number.isFinite(parsed) && Number.isInteger(parsed) && parsed > 0) {
            q = q.where(({ cmp, or }) =>
              or(cmp("id", parsed), cmp("title", "ILIKE", `%${trimmed}%`)),
            )
          } else {
            q = q.where("title", "ILIKE", `%${trimmed}%`)
          }
        }

        q = q.orderBy("createdAt", "desc").orderBy("id", "desc")

        if (cursor) {
          q = q.start({ id: cursor.id, createdAt: cursor.createdAt })
        }

        q = q.limit(limit)
        const withRelations = q
          .related("ticketType", (t) => t.one())
          .related("assignee", (t) => t.one())

        if (isInternal(ctx)) {
          return withRelations.related("client", (t) => t.one())
        }

        return withRelations
      },
    ),
    recent: defineQuery(
      z.object({
        limit: z.number().int().positive().max(200).default(50),
      }),
      ({ args: { limit }, ctx }) => {
        if (isInternal(ctx)) {
          return zql.tickets
            .orderBy("createdAt", "desc")
            .limit(limit)
            .related("client", (q) => q.one())
            .related("ticketType", (q) => q.one())
            .related("assignee", (q) => q.one())
        }

        const clientId = getClientId(ctx)
        if (clientId == null) {
          return zql.tickets.where("id", -1)
        }

        return zql.tickets
          .where("clientId", clientId)
          .orderBy("createdAt", "desc")
          .limit(limit)
          .related("ticketType", (q) => q.one())
          .related("assignee", (q) => q.one())
      },
    ),
    byClient: defineQuery(
      z.object({
        clientId: z.number().int().positive(),
        limit: z.number().int().positive().max(200).default(100),
      }),
      ({ args: { clientId, limit }, ctx }) => {
        if (isInternal(ctx)) {
          return zql.tickets
            .where("clientId", clientId)
            .orderBy("createdAt", "desc")
            .limit(limit)
            .related("ticketType", (q) => q.one())
            .related("assignee", (q) => q.one())
        }

        const ctxClientId = getClientId(ctx)
        if (ctxClientId == null) {
          return zql.tickets.where("id", -1)
        }

        if (clientId !== ctxClientId) {
          return zql.tickets.where("id", -1)
        }

        return zql.tickets
          .where("clientId", ctxClientId)
          .orderBy("createdAt", "desc")
          .limit(limit)
          .related("ticketType", (q) => q.one())
          .related("assignee", (q) => q.one())
      },
    ),
    byId: defineQuery(
      z.object({
        id: z.number().int().positive(),
      }),
      ({ args: { id }, ctx }) => {
        if (isInternal(ctx)) {
          return zql.tickets
            .where("id", id)
            .one()
            .related("client", (q) => q.one())
            .related("ticketType", (q) => q.one())
            .related("assignee", (q) => q.one())
        }

        const clientId = getClientId(ctx)
        if (clientId == null) {
          return zql.tickets.where("id", -1).one()
        }

        return zql.tickets
          .where("id", id)
          .where("clientId", clientId)
          .one()
          .related("ticketType", (q) => q.one())
          .related("assignee", (q) => q.one())
      },
    ),
  },
  ticketMessages: {
    byTicket: defineQuery(
      z.object({
        ticketId: z.number().int().positive(),
        limit: z.number().int().positive().max(500).default(200),
      }),
      ({ args: { ticketId, limit }, ctx }) => {
        if (isInternal(ctx)) {
          return zql.ticketMessages
            .where("ticketId", ticketId)
            .orderBy("createdAt", "asc")
            .limit(limit)
            .related("fromTeamMember", (q) => q.one())
        }

        const clientId = getClientId(ctx)
        if (clientId == null) {
          return zql.ticketMessages.where("id", -1)
        }

        return zql.ticketMessages
          .where("ticketId", ticketId)
          .whereExists("ticket", (q) => q.where("clientId", clientId), {
            flip: true,
          })
          .orderBy("createdAt", "asc")
          .limit(limit)
          .related("fromTeamMember", (q) => q.one())
      },
    ),
  },
  ticketFeedback: {
    byTicket: defineQuery(
      z.object({
        ticketId: z.number().int().positive(),
      }),
      ({ args: { ticketId }, ctx }) => {
        if (isInternal(ctx)) {
          return zql.ticketFeedback.where("ticketId", ticketId).one()
        }

        const clientId = getClientId(ctx)
        if (clientId == null) {
          return zql.ticketFeedback.where("id", -1).one()
        }

        return zql.ticketFeedback
          .where("ticketId", ticketId)
          .whereExists("ticket", (q) => q.where("clientId", clientId), {
            flip: true,
          })
          .one()
      },
    ),
  },
  payments: {
    byClient: defineQuery(
      z.object({
        clientId: z.number().int().positive(),
        limit: z.number().int().positive().max(200).default(50),
      }),
      ({ args: { clientId, limit }, ctx }) => {
        if (isInternal(ctx)) {
          return zql.payments
            .where("clientId", clientId)
            .orderBy("paidAt", "desc")
            .orderBy("createdAt", "desc")
            .limit(limit)
        }

        const ctxClientId = getClientId(ctx)
        if (ctxClientId == null || ctxClientId !== clientId) {
          return zql.payments.where("id", -1)
        }

        return zql.payments
          .where("clientId", ctxClientId)
          .orderBy("paidAt", "desc")
          .orderBy("createdAt", "desc")
          .limit(limit)
      },
    ),
  },
})
