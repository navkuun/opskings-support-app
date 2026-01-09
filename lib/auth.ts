import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"

import { authDb } from "@/lib/db/auth"
import * as authSchema from "@/lib/db/schema/better-auth"
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

  const AUTH_CONFIG_VERSION = "2026-01-09-email-only"
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
