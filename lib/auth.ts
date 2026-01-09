import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { eq } from "drizzle-orm"

import { authDb } from "@/lib/db/auth"
import { db } from "@/lib/db"
import { appUsers } from "@/lib/db/schema/app-users"
import * as authSchema from "@/lib/db/schema/better-auth"
import { clients } from "@/lib/db/schema/clients"
import { teamMembers } from "@/lib/db/schema/team-members"
import { setPasswordResetLink } from "@/lib/auth-dev-mailbox"
import { setEmailVerificationLink } from "@/lib/auth-dev-verify-mailbox"
import { sendEmailVerificationEmail, sendPasswordResetEmail } from "@/lib/email/resend"

function getOptionalEnv(name: string) {
  const value = process.env[name]
  return value && value.trim() ? value.trim() : null
}

function getBaseURL() {
  return getOptionalEnv("BETTER_AUTH_URL") ?? "http://localhost:3000"
}

type BetterAuthInstance = ReturnType<typeof betterAuth>

const globalForRi = globalThis as typeof globalThis & {
  __riBetterAuth?: BetterAuthInstance
  __riBetterAuthSignature?: string
}

export function getAuth() {
  const secret = getOptionalEnv("BETTER_AUTH_SECRET")
  const resendApiKey = getOptionalEnv("RESEND_API_KEY")
  const resendFrom = getOptionalEnv("RESEND_FROM")
  const resendReplyTo = getOptionalEnv("RESEND_REPLY_TO")

  if (process.env.NODE_ENV === "production" && !secret) {
    throw new Error("BETTER_AUTH_SECRET is required in production.")
  }

  if (process.env.NODE_ENV === "production" && (!resendApiKey || !resendFrom)) {
    throw new Error(
      "RESEND_API_KEY and RESEND_FROM are required in production for transactional emails.",
    )
  }

  const AUTH_CONFIG_VERSION = "2026-01-09-email-only-app-users-v2"
  const signature = JSON.stringify({
    v: AUTH_CONFIG_VERSION,
    baseURL: getBaseURL(),
    hasSecret: !!secret,
    cookieDomain: getOptionalEnv("BETTER_AUTH_COOKIE_DOMAIN"),
    resendConfigured: !!(resendApiKey && resendFrom),
    resendReplyTo,
  })

  if (globalForRi.__riBetterAuth && globalForRi.__riBetterAuthSignature === signature) {
    return globalForRi.__riBetterAuth
  }

  const auth = betterAuth({
    baseURL: getBaseURL(),
    ...(secret ? { secret } : {}),
    database: drizzleAdapter(authDb, {
      provider: "pg",
      schema: {
        user: authSchema.authUsers,
        session: authSchema.authSessions,
        account: authSchema.authAccounts,
        verification: authSchema.authVerifications,
      },
    }),
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url, token }) => {
        if (process.env.NODE_ENV !== "production") {
          setEmailVerificationLink({ email: user.email, url, token })
          console.info(
            `[Better Auth][dev] Email verification link for ${user.email}: ${url}`,
          )
        }

        void sendEmailVerificationEmail({
          to: user.email,
          verifyUrl: url,
        })
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url, token }) => {
        if (process.env.NODE_ENV !== "production") {
          setPasswordResetLink({ email: user.email, url, token })
          console.info(
            `[Better Auth][dev] Password reset link for ${user.email}: ${url}`,
          )
        }

        await sendPasswordResetEmail({
          to: user.email,
          resetUrl: url,
        })
      },
      onPasswordReset: async ({ user }) => {
        if (process.env.NODE_ENV !== "production") {
          console.info(
            `[Better Auth][dev] Password reset completed for ${user.email}`,
          )
        }
      },
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            const existing = await db
              .select({ authUserId: appUsers.authUserId })
              .from(appUsers)
              .where(eq(appUsers.authUserId, user.id))
              .limit(1)

            if (existing.length) return

            const teamMember = await db
              .select({ id: teamMembers.id })
              .from(teamMembers)
              .where(eq(teamMembers.email, user.email))
              .limit(1)

            if (teamMember.length) {
              await db.insert(appUsers).values({
                authUserId: user.id,
                accountStatus: "pending",
                userType: "internal",
                internalRole: null,
                teamMemberId: teamMember[0].id,
                clientId: null,
              })
              return
            }

            const client = await db
              .select({ id: clients.id })
              .from(clients)
              .where(eq(clients.email, user.email))
              .limit(1)

            if (client.length) {
              await db.insert(appUsers).values({
                authUserId: user.id,
                accountStatus: "pending",
                userType: "client",
                internalRole: null,
                teamMemberId: null,
                clientId: client[0].id,
              })
              return
            }

            await db.insert(appUsers).values({
              authUserId: user.id,
              accountStatus: "pending",
              userType: "client",
              internalRole: null,
              teamMemberId: null,
              clientId: null,
            })
          },
        },
      },
    },
    advanced: {
      crossSubDomainCookies: getOptionalEnv("BETTER_AUTH_COOKIE_DOMAIN")
        ? {
            enabled: true,
            domain: getOptionalEnv("BETTER_AUTH_COOKIE_DOMAIN")!,
          }
        : undefined,
    },
  })

  if (process.env.NODE_ENV !== "production") {
    globalForRi.__riBetterAuth = auth
    globalForRi.__riBetterAuthSignature = signature
  }

  return auth
}
