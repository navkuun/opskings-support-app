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
