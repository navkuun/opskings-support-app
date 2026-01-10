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

  const subject = "Set your OpsKings Support password"
  const text =
    `Use this link to set your OpsKings Support password:\n\n` +
    `${input.resetUrl}\n\n` +
    `This link expires in 1 hour. If you didn’t request this, you can ignore this email.\n`
  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height: 1.45;">
      <h2 style="margin: 0 0 12px;">Set your password</h2>
      <p style="margin: 0 0 16px;">
        Use the button below to set your OpsKings Support password.
      </p>
      <p style="margin: 0 0 18px;">
        <a href="${input.resetUrl}" style="display: inline-block; padding: 10px 14px; background: #111827; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Set password
        </a>
      </p>
      <p style="margin: 0 0 8px; color: #4b5563; font-size: 13px;">
        This link expires in 1 hour. If you didn’t request this, you can ignore this email.
      </p>
      <p style="margin: 16px 0 0; color: #6b7280; font-size: 12px;">
        If the button doesn’t work, copy and paste this URL into your browser:<br />
        <span style="word-break: break-all;">${input.resetUrl}</span>
      </p>
    </div>
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
