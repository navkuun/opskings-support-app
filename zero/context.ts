export type ZeroContext = {
  userID: string
  userType?: "internal" | "client" | "anon"
  internalRole?: "support_agent" | "manager" | "admin" | null
  clientId?: number | null
  teamMemberId?: number | null
}

declare module "@rocicorp/zero" {
  interface DefaultTypes {
    context: ZeroContext
  }
}

