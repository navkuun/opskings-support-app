import { defineMutators, defineMutator } from "@rocicorp/zero"
import { z } from "zod"

import type { ZeroContext } from "./context"
import { zql } from "./schema"

function isServer(tx: { location: string }) {
  return tx.location === "server"
}

function assertInternal(ctx: ZeroContext | undefined) {
  if (ctx?.userType !== "internal") {
    throw new Error("Access denied")
  }
}

function requireClientId(ctx: ZeroContext | undefined) {
  if (ctx?.userType !== "client") {
    throw new Error("Access denied")
  }
  const clientId = ctx.clientId
  if (typeof clientId !== "number" || !Number.isFinite(clientId)) {
    throw new Error("Access denied")
  }
  return clientId
}

export const mutators = defineMutators({
  clients: {
    create: defineMutator(
      z.object({
        id: z.number().int().positive(),
        clientName: z.string().min(1).max(255),
        email: z.string().email().max(255),
        status: z.string().min(1).max(50).optional(),
        planType: z.string().min(1).max(50).optional(),
        monthlyBudget: z.number().nonnegative().optional(),
        createdAt: z.number().int().optional(),
      }),
      async ({ args, tx, ctx }) => {
        if (isServer(tx)) {
          assertInternal(ctx)
        }

        await tx.mutate.clients.insert({
          id: args.id,
          clientName: args.clientName,
          email: args.email,
          status: args.status ?? "active",
          planType: args.planType ?? null,
          monthlyBudget: args.monthlyBudget ?? null,
          createdAt: args.createdAt ?? Date.now(),
        })
      },
    ),
  },
  tickets: {
    create: defineMutator(
      z.object({
        id: z.number().int().positive(),
        clientId: z.number().int().positive(),
        ticketTypeId: z.number().int().positive(),
        assignedTo: z.number().int().positive().nullable().optional(),
        status: z.string().min(1).max(50).optional(),
        priority: z.string().min(1).max(20).nullable().optional(),
        title: z.string().min(1).max(255),
        createdAt: z.number().int().optional(),
      }),
      async ({ args, tx, ctx }) => {
        if (isServer(tx)) {
          if (ctx?.userType === "internal") {
            // allow
          } else {
            const clientId = requireClientId(ctx)
            if (args.clientId !== clientId) {
              throw new Error("Access denied")
            }
          }
        }

        await tx.mutate.tickets.insert({
          id: args.id,
          clientId: args.clientId,
          ticketTypeId: args.ticketTypeId,
          assignedTo: args.assignedTo ?? null,
          status: args.status ?? "open",
          priority: args.priority ?? null,
          title: args.title,
          createdAt: args.createdAt ?? Date.now(),
          resolvedAt: null,
          closedAt: null,
        })
      },
    ),
    setStatus: defineMutator(
      z.object({
        id: z.number().int().positive(),
        status: z.string().min(1).max(50),
        resolvedAt: z.number().int().nullable().optional(),
        closedAt: z.number().int().nullable().optional(),
      }),
      async ({ args, tx, ctx }) => {
        if (isServer(tx)) {
          assertInternal(ctx)
        }

        await tx.mutate.tickets.update({
          id: args.id,
          status: args.status,
          resolvedAt: args.resolvedAt ?? null,
          closedAt: args.closedAt ?? null,
        })
      },
    ),
  },
  ticketMessages: {
    create: defineMutator(
      z.object({
        id: z.number().int().positive(),
        ticketId: z.number().int().positive(),
        fromClient: z.boolean().optional(),
        fromTeamMemberId: z.number().int().positive().nullable().optional(),
        messageText: z.string().min(1),
        createdAt: z.number().int().optional(),
      }),
      async ({ args, tx, ctx }) => {
        if (isServer(tx)) {
          if (ctx?.userType === "internal") {
            if (args.fromClient) {
              throw new Error("Access denied")
            }
          } else {
            const clientId = requireClientId(ctx)
            if (!args.fromClient) {
              throw new Error("Access denied")
            }
            if (args.fromTeamMemberId != null) {
              throw new Error("Access denied")
            }

            const ticket = await tx.run(zql.tickets.where("id", args.ticketId).one())
            if (!ticket || ticket.clientId !== clientId) {
              throw new Error("Access denied")
            }
          }
        }

        await tx.mutate.ticketMessages.insert({
          id: args.id,
          ticketId: args.ticketId,
          fromClient: args.fromClient ?? false,
          fromTeamMemberId: args.fromTeamMemberId ?? null,
          messageText: args.messageText,
          createdAt: args.createdAt ?? Date.now(),
        })
      },
    ),
  },
  ticketFeedback: {
    upsert: defineMutator(
      z.object({
        id: z.number().int().positive(),
        ticketId: z.number().int().positive(),
        rating: z.number().int().min(1).max(5),
        feedbackText: z.string().max(10_000).optional(),
        createdAt: z.number().int().optional(),
      }),
      async ({ args, tx, ctx }) => {
        if (isServer(tx)) {
          if (ctx?.userType === "internal") {
            // allow
          } else {
            const clientId = requireClientId(ctx)
            const ticket = await tx.run(zql.tickets.where("id", args.ticketId).one())
            if (!ticket || ticket.clientId !== clientId) {
              throw new Error("Access denied")
            }
            if (ticket.status !== "resolved") {
              throw new Error("Access denied")
            }
          }
        }

        const existing = await tx.run(
          zql.ticketFeedback.where("ticketId", args.ticketId).one(),
        )

        if (existing) {
          await tx.mutate.ticketFeedback.update({
            id: existing.id,
            rating: args.rating,
            feedbackText: args.feedbackText ?? null,
          })
          return
        }

        await tx.mutate.ticketFeedback.insert({
          id: args.id,
          ticketId: args.ticketId,
          rating: args.rating,
          feedbackText: args.feedbackText ?? null,
          createdAt: args.createdAt ?? Date.now(),
        })
      },
    ),
  },
})
