import "server-only"

import { Resend } from "resend"

function getRequiredEnv(name: string) {
  const value = process.env[name]
  if (!value || !value.trim()) {
    throw new Error(`${name} is required`)
  }
  return value.trim()
}

const globalForRi = globalThis as typeof globalThis & {
  __riResend?: Resend
}

function getResend() {
  if (globalForRi.__riResend) return globalForRi.__riResend
  const client = new Resend(getRequiredEnv("RESEND_API_KEY"))
  if (process.env.NODE_ENV !== "production") globalForRi.__riResend = client
  return client
}

export async function sendPasswordResetEmail(input: {
  to: string
  resetUrl: string
}) {
  const from = getRequiredEnv("RESEND_FROM")
  const replyTo = process.env.RESEND_REPLY_TO?.trim() || undefined

  const subject = "Reset your password"
  const text = `Reset your password:\n\n${input.resetUrl}\n\nIf you didn’t request this, you can ignore this email.\n`
  const html = `
    <p>Reset your password:</p>
    <p><a href="${input.resetUrl}">Reset password</a></p>
    <p>If you didn’t request this, you can ignore this email.</p>
  `.trim()

  try {
    const resend = getResend()
    const result = await resend.emails.send({
      from,
      to: input.to,
      subject,
      text,
      html,
      ...(replyTo ? { replyTo } : {}),
    })

    if ("error" in result && result.error) {
      console.error("[Resend] Failed to send password reset email", result.error)
    }
  } catch (error) {
    console.error("[Resend] Failed to send password reset email", error)
  }
}

export async function sendEmailVerificationEmail(input: {
  to: string
  verifyUrl: string
}) {
  const from = getRequiredEnv("RESEND_FROM")
  const replyTo = process.env.RESEND_REPLY_TO?.trim() || undefined

  const subject = "Verify your email address"
  const text = `Verify your email address:\n\n${input.verifyUrl}\n\nIf you didn’t request this, you can ignore this email.\n`
  const html = `
    <p>Verify your email address:</p>
    <p><a href="${input.verifyUrl}">Verify email</a></p>
    <p>If you didn’t request this, you can ignore this email.</p>
  `.trim()

  try {
    const resend = getResend()
    const result = await resend.emails.send({
      from,
      to: input.to,
      subject,
      text,
      html,
      ...(replyTo ? { replyTo } : {}),
    })

    if ("error" in result && result.error) {
      console.error("[Resend] Failed to send email verification email", result.error)
    }
  } catch (error) {
    console.error("[Resend] Failed to send email verification email", error)
  }
}
