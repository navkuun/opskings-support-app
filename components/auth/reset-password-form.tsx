"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type PasswordCheck = {
  label: string
  ok: boolean
  required?: boolean
}

function getPasswordChecks(password: string): PasswordCheck[] {
  const hasLetter = /[A-Za-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSymbol = /[^A-Za-z0-9]/.test(password)

  return [
    { label: "8+ characters", ok: password.length >= 8, required: true },
    { label: "128 or fewer", ok: password.length <= 128, required: true },
    { label: "Contains a letter", ok: hasLetter },
    { label: "Contains a number", ok: hasNumber },
    { label: "Contains a symbol", ok: hasSymbol },
  ]
}

function PasswordRequirements({ password }: { password: string }) {
  const checks = React.useMemo(() => getPasswordChecks(password), [password])

  return (
    <div className="grid gap-1.5 rounded-md border border-neutral-800 bg-neutral-950/40 p-3">
      <div className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
        Password requirements
      </div>
      <ul className="grid gap-1 text-xs text-neutral-300">
        {checks.map((check) => (
          <li key={check.label} className="flex items-center gap-2">
            <span
              aria-hidden
              className={[
                "h-2 w-2 border border-neutral-700",
                check.ok ? "bg-emerald-500" : "bg-neutral-900",
              ].join(" ")}
            />
            <span className={check.ok ? "text-neutral-100" : "text-neutral-400"}>
              {check.label}
              {check.required ? " (required)" : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ResetPasswordForm({
  token,
  error,
}: {
  token: string | null
  error: string | null
}) {
  const router = useRouter()
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [message, setMessage] = React.useState<string | null>(null)
  const [formError, setFormError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const canSubmit =
    !!token &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword &&
    !isSubmitting

  const onSubmit = React.useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      setFormError(null)
      setMessage(null)

      if (!token) {
        setFormError("Missing reset token.")
        return
      }

      if (newPassword.length < 8) {
        setFormError("Password must be at least 8 characters.")
        return
      }

      if (newPassword !== confirmPassword) {
        setFormError("Passwords do not match.")
        return
      }

      setIsSubmitting(true)
      try {
        const result = await authClient.resetPassword({
          newPassword,
          token,
        })
        if (result.error) {
          setFormError(result.error.message ?? "Failed to reset password.")
          return
        }

        setMessage("Password reset. You can now sign in.")
        router.replace("/")
        router.refresh()
      } catch (e) {
        setFormError(e instanceof Error ? e.message : "Something went wrong")
      } finally {
        setIsSubmitting(false)
      }
    },
    [confirmPassword, newPassword, router, token],
  )

  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Reset password
        </h1>
        {error ? (
          <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Enter a new password for your account.
          </p>
        )}
      </header>

      <form onSubmit={onSubmit} className="space-y-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="new-password">New password</FieldLabel>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              disabled={!token || isSubmitting}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </Field>

          <PasswordRequirements password={newPassword} />

          <Field>
            <FieldLabel htmlFor="confirm-password">Confirm password</FieldLabel>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              disabled={!token || isSubmitting}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </Field>

          {formError ? <FieldError>{formError}</FieldError> : null}
          {message ? (
            <div className="text-xs/relaxed text-emerald-700 dark:text-emerald-300">
              {message}
            </div>
          ) : null}
        </FieldGroup>

        <Button type="submit" disabled={!canSubmit} className="w-full">
          {isSubmitting ? "Working…" : "Reset password"}
        </Button>
      </form>
    </div>
  )
}
