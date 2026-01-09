import { defineQueries, defineQuery } from "@rocicorp/zero"
import { z } from "zod"

import { zql } from "./schema"

export const queries = defineQueries({
  clients: {
    list: defineQuery(
      z.object({
        limit: z.number().int().positive().max(200).default(50),
      }),
      ({ args: { limit } }) => zql.clients.orderBy("createdAt", "desc").limit(limit),
    ),
    byId: defineQuery(
      z.object({
        id: z.number().int().positive(),
      }),
      ({ args: { id } }) => zql.clients.where("id", id).one(),
    ),
  },
  teamMembers: {
    list: defineQuery(
      z.object({
        limit: z.number().int().positive().max(200).default(50),
      }),
      ({ args: { limit } }) => zql.teamMembers.orderBy("createdAt", "desc").limit(limit),
    ),
  },
  ticketTypes: {
    list: defineQuery(
      z.object({
        limit: z.number().int().positive().max(200).default(100),
      }),
      ({ args: { limit } }) => zql.ticketTypes.limit(limit),
    ),
  },
  tickets: {
    recent: defineQuery(
      z.object({
        limit: z.number().int().positive().max(200).default(50),
      }),
      ({ args: { limit } }) =>
        zql.tickets
          .orderBy("createdAt", "desc")
          .limit(limit)
          .related("client", (q) => q.one())
          .related("ticketType", (q) => q.one())
          .related("assignee", (q) => q.one()),
    ),
    byClient: defineQuery(
      z.object({
        clientId: z.number().int().positive(),
        limit: z.number().int().positive().max(200).default(100),
      }),
      ({ args: { clientId, limit } }) =>
        zql.tickets
          .where("clientId", clientId)
          .orderBy("createdAt", "desc")
          .limit(limit)
          .related("ticketType", (q) => q.one())
          .related("assignee", (q) => q.one()),
    ),
    byId: defineQuery(
      z.object({
        id: z.number().int().positive(),
      }),
      ({ args: { id } }) =>
        zql.tickets
          .where("id", id)
          .one()
          .related("client", (q) => q.one())
          .related("ticketType", (q) => q.one())
          .related("assignee", (q) => q.one()),
    ),
  },
  ticketMessages: {
    byTicket: defineQuery(
      z.object({
        ticketId: z.number().int().positive(),
        limit: z.number().int().positive().max(500).default(200),
      }),
      ({ args: { ticketId, limit } }) =>
        zql.ticketMessages
          .where("ticketId", ticketId)
          .orderBy("createdAt", "asc")
          .limit(limit)
          .related("fromTeamMember", (q) => q.one()),
    ),
  },
  payments: {
    byClient: defineQuery(
      z.object({
        clientId: z.number().int().positive(),
        limit: z.number().int().positive().max(200).default(50),
      }),
      ({ args: { clientId, limit } }) =>
        zql.payments
          .where("clientId", clientId)
          .orderBy("paidAt", "desc")
          .orderBy("createdAt", "desc")
          .limit(limit),
    ),
  },
})
