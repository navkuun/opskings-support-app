import { clients } from "./schema/clients"
import { payments } from "./schema/payments"
import { teamMembers } from "./schema/team-members"
import { ticketFeedback } from "./schema/ticket-feedback"
import { ticketMessages } from "./schema/ticket-messages"
import { ticketTypes } from "./schema/ticket-types"
import { tickets } from "./schema/tickets"
export * from "./schema/relations"

export {
  clients,
  teamMembers,
  ticketTypes,
  tickets,
  ticketMessages,
  ticketFeedback,
  payments,
}
