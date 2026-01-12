import { expect, test } from "@playwright/test"

import { seedAllowlist, setupPassword, signInWithPassword } from "../../helpers/auth"
import {
  fetchQueryAst,
  hasCorrelatedSubquery,
  hasSimpleColumnEquals,
} from "../../helpers/zero"

test("zero queries: anonymous users get empty queries", async ({ page }) => {
  const ast = await fetchQueryAst(page, "tickets.recent", { limit: 1 })
  expect(ast.table).toBe("tickets")
  expect(hasSimpleColumnEquals(ast.where, "id", -1)).toBe(true)
})

test("zero queries: client users are restricted to their clientId", async ({ page }) => {
  const { email, id: clientId } = await seedAllowlist(page, "client", "e2e-zero")
  const password = "password1234!"

  await setupPassword(page, email, password)
  await signInWithPassword(page, email, password)

  const listAst = await fetchQueryAst(page, "tickets.list", { limit: 1 })
  expect(listAst.table).toBe("tickets")
  expect(hasSimpleColumnEquals(listAst.where, "client_id", clientId)).toBe(true)

  const byIdAst = await fetchQueryAst(page, "tickets.byId", { id: 123 })
  expect(byIdAst.table).toBe("tickets")
  expect(hasSimpleColumnEquals(byIdAst.where, "id", 123)).toBe(true)
  expect(hasSimpleColumnEquals(byIdAst.where, "client_id", clientId)).toBe(true)

  const ticketsAst = await fetchQueryAst(page, "tickets.recent", { limit: 1 })
  expect(ticketsAst.table).toBe("tickets")
  expect(hasSimpleColumnEquals(ticketsAst.where, "client_id", clientId)).toBe(true)

  const clientsOwnAst = await fetchQueryAst(page, "clients.byId", { id: clientId })
  expect(clientsOwnAst.table).toBe("clients")
  expect(hasSimpleColumnEquals(clientsOwnAst.where, "id", clientId)).toBe(true)

  const clientsOtherAst = await fetchQueryAst(page, "clients.byId", {
    id: clientId + 1,
  })
  expect(clientsOtherAst.table).toBe("clients")
  expect(hasSimpleColumnEquals(clientsOtherAst.where, "id", -1)).toBe(true)
})

test("zero queries: client users can only access ticket messages for their tickets", async ({
  page,
}) => {
  const { email, id: clientId } = await seedAllowlist(page, "client", "e2e-zero")
  const password = "password1234!"

  await setupPassword(page, email, password)
  await signInWithPassword(page, email, password)

  const ast = await fetchQueryAst(page, "ticketMessages.byTicket", {
    ticketId: 123,
    limit: 50,
  })
  expect(ast.table).toBe("ticket_messages")
  expect(hasSimpleColumnEquals(ast.where, "ticket_id", 123)).toBe(true)
  expect(hasCorrelatedSubquery(ast.where, "tickets", "client_id", clientId)).toBe(true)
})

test("zero queries: client users can only access ticket feedback for their tickets", async ({
  page,
}) => {
  const { email, id: clientId } = await seedAllowlist(page, "client", "e2e-zero")
  const password = "password1234!"

  await setupPassword(page, email, password)
  await signInWithPassword(page, email, password)

  const ast = await fetchQueryAst(page, "ticketFeedback.byTicket", {
    ticketId: 456,
  })
  expect(ast.table).toBe("ticket_feedback")
  expect(hasSimpleColumnEquals(ast.where, "ticket_id", 456)).toBe(true)
  expect(hasCorrelatedSubquery(ast.where, "tickets", "client_id", clientId)).toBe(true)
})

test("zero queries: internal users can list all clients", async ({ page }) => {
  const { email } = await seedAllowlist(page, "team_member", "e2e-zero")
  const password = "password1234!"

  await setupPassword(page, email, password)
  await signInWithPassword(page, email, password)

  const ast = await fetchQueryAst(page, "clients.list", { limit: 10 })
  expect(ast.table).toBe("clients")
  expect(ast.where).toBeUndefined()
})

