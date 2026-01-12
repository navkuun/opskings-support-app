import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"

import {
  getAllowlistMatchByEmail,
  isAuthUserAllowlisted,
  syncAppUserFromAllowlist,
} from "@/lib/app-user"
import { authDb } from "@/lib/db/auth"
import * as authSchema from "@/lib/db/schema/better-auth"
import { setPasswordResetLink } from "@/lib/auth-dev-mailbox"
import { setEmailVerificationLink } from "@/lib/auth-dev-verify-mailbox"
import { isE2eTestModeEnabled } from "@/lib/e2e"
import { sendEmailVerificationEmail, sendPasswordResetEmail } from "@/lib/email/resend"

function getOptionalEnv(name: string) {
  const value = process.env[name]
  if (!value || !value.trim()) return null
  const trimmed = value.trim()
  const first = trimmed[0]
  const last = trimmed[trimmed.length - 1]
  if ((first === `"` && last === `"`) || (first === `'` && last === `'`)) {
    const unquoted = trimmed.slice(1, -1).trim()
    return unquoted ? unquoted : null
  }
  return trimmed
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
  const e2eMode = isE2eTestModeEnabled()

  if (process.env.NODE_ENV === "production" && !e2eMode && !secret) {
    throw new Error("BETTER_AUTH_SECRET is required in production.")
  }

  if (process.env.NODE_ENV === "production" && !e2eMode && (!resendApiKey || !resendFrom)) {
    throw new Error(
      "RESEND_API_KEY and RESEND_FROM are required in production for transactional emails.",
    )
  }

  const AUTH_CONFIG_VERSION = "2026-01-09-allowlist-login-v4"
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
      sendOnSignUp: false,
      sendOnSignIn: false,
      autoSignInAfterVerification: false,
      sendVerificationEmail: async ({ user, url, token }) => {
        if (process.env.NODE_ENV !== "production" || isE2eTestModeEnabled()) {
          setEmailVerificationLink({ email: user.email, url, token })
          console.info(
            `[Better Auth][dev] Email verification link for ${user.email}: ${url}`,
          )
        }

        if (isE2eTestModeEnabled()) return

        void sendEmailVerificationEmail({
          to: user.email,
          verifyUrl: url,
        }).catch((error) => {
          console.error("[Better Auth] Failed to send verification email", error)
        })
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      autoSignIn: false,
      sendResetPassword: async ({ user, url, token }) => {
        if (process.env.NODE_ENV !== "production" || isE2eTestModeEnabled()) {
          setPasswordResetLink({ email: user.email, url, token })
          console.info(
            `[Better Auth][dev] Password reset link for ${user.email}: ${url}`,
          )
        }

        if (isE2eTestModeEnabled()) return

        if (process.env.NODE_ENV === "production") {
          await sendPasswordResetEmail({
            to: user.email,
            resetUrl: url,
          })
          return
        }

        void sendPasswordResetEmail({
          to: user.email,
          resetUrl: url,
        }).catch((error) => {
          console.error("[Better Auth][dev] Failed to send password reset email", error)
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
          before: async (user) => {
            const email = user.email?.trim().toLowerCase()
            if (!email) return false
            return (await getAllowlistMatchByEmail(email)) ? undefined : false
          },
        },
      },
      session: {
        create: {
          before: async (session) => {
            if (!session?.userId) return false
            return (await isAuthUserAllowlisted(session.userId)) ? undefined : false
          },
          after: async (session) => {
            if (!session?.userId) return
            try {
              await syncAppUserFromAllowlist(session.userId)
            } catch (error) {
              console.error("[Better Auth] Failed to sync app user", error)
            }
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
