import { relations } from "drizzle-orm"

import { clients } from "./clients"
import { payments } from "./payments"
import { teamMembers } from "./team-members"
import { ticketFeedback } from "./ticket-feedback"
import { ticketMessages } from "./ticket-messages"
import { ticketTypes } from "./ticket-types"
import { tickets } from "./tickets"

export const clientsRelations = relations(clients, ({ many }) => ({
  tickets: many(tickets),
  payments: many(payments),
}))

export const teamMembersRelations = relations(teamMembers, ({ many }) => ({
  assignedTickets: many(tickets),
  sentMessages: many(ticketMessages),
}))

export const ticketTypesRelations = relations(ticketTypes, ({ many }) => ({
  tickets: many(tickets),
}))

export const ticketsRelations = relations(tickets, ({ many, one }) => ({
  client: one(clients, {
    fields: [tickets.clientId],
    references: [clients.id],
  }),
  assignee: one(teamMembers, {
    fields: [tickets.assignedTo],
    references: [teamMembers.id],
  }),
  ticketType: one(ticketTypes, {
    fields: [tickets.ticketTypeId],
    references: [ticketTypes.id],
  }),
  messages: many(ticketMessages),
  feedback: one(ticketFeedback, {
    fields: [tickets.id],
    references: [ticketFeedback.ticketId],
  }),
}))

export const ticketMessagesRelations = relations(ticketMessages, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketMessages.ticketId],
    references: [tickets.id],
  }),
  fromTeamMember: one(teamMembers, {
    fields: [ticketMessages.fromTeamMemberId],
    references: [teamMembers.id],
  }),
}))

export const ticketFeedbackRelations = relations(ticketFeedback, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketFeedback.ticketId],
    references: [tickets.id],
  }),
}))

export const paymentsRelations = relations(payments, ({ one }) => ({
  client: one(clients, {
    fields: [payments.clientId],
    references: [clients.id],
  }),
}))
