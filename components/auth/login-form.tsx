"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import { authClient } from "@/lib/auth-client"

type EmailStatusResponse = {
  ok: boolean
  allowlisted: boolean
  allowlistType: "client" | "team_member" | null
  hasAuthUser: boolean
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function LoginForm() {
  const router = useRouter()
  const { data: session } = authClient.useSession()

  const [step, setStep] = React.useState<"email" | "password" | "setup-link">(
    "email",
  )
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [emailStatus, setEmailStatus] = React.useState<EmailStatusResponse | null>(
    null,
  )
  const [error, setError] = React.useState<string | null>(null)
  const [notice, setNotice] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (session?.user) router.replace("/")
  }, [router, session?.user])

  const resetFlow = React.useCallback(() => {
    setStep("email")
    setPassword("")
    setEmailStatus(null)
    setError(null)
    setNotice(null)
    setIsSubmitting(false)
  }, [])

  const requestPasswordLink = React.useCallback(async () => {
    const normalizedEmail = normalizeEmail(email)
    if (!normalizedEmail) {
      setError("Enter your email address.")
      return
    }

    setEmail(normalizedEmail)
    setError(null)
    setNotice(null)
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/auth/setup-link", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
        }),
      })

      if (!res.ok) {
        if (res.status === 403) {
          setError("This email does not have access. Contact an administrator.")
          return
        }
        setError("Something went wrong. Please try again.")
        return
      }

      setNotice("We emailed you a password link.")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }, [email])

  const onContinue = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      setNotice(null)

      const normalizedEmail = normalizeEmail(email)
      if (!normalizedEmail) {
        setError("Enter your email address.")
        return
      }

      setEmail(normalizedEmail)
      setIsSubmitting(true)
      try {
        const res = await fetch("/api/auth/email-status", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ email: normalizedEmail }),
        })

        if (!res.ok) {
          setError("Something went wrong. Please try again.")
          return
        }

        const data = (await res.json()) as EmailStatusResponse
        setEmailStatus(data)

        if (!data.ok) {
          setError("Something went wrong. Please try again.")
          return
        }

        if (!data.allowlisted) {
          setError("This email does not have access. Contact an administrator.")
          return
        }

        if (data.hasAuthUser) {
          setStep("password")
          return
        }

        setStep("setup-link")
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong")
      } finally {
        setIsSubmitting(false)
      }
    },
    [email],
  )

  const onSignInWithPassword = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      setNotice(null)
      const normalizedEmail = normalizeEmail(email)
      if (!normalizedEmail) {
        setError("Enter your email address.")
        return
      }
      setEmail(normalizedEmail)
      setIsSubmitting(true)
      try {
        const result = await authClient.signIn.email({
          email: normalizedEmail,
          password,
          callbackURL: "/",
        })
        if (result.error) {
          setError(result.error.message ?? "Sign in failed")
          return
        }
        router.replace("/")
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong")
      } finally {
        setIsSubmitting(false)
      }
    },
    [email, password, router],
  )

  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Sign in
        </h1>
        {step !== "email" ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetFlow}
            disabled={isSubmitting}
          >
            Use a different email
          </Button>
        ) : null}
      </div>

      <form onSubmit={onContinue} className="space-y-3">
        <InputGroup>
          <InputGroupInput
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            disabled={isSubmitting || step !== "email"}
          />
        </InputGroup>

        {error ? (
          <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        ) : null}

        {notice ? (
          <div className="rounded border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
            {notice}
          </div>
        ) : null}

        {step === "email" ? (
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Working…" : "Continue"}
          </Button>
        ) : null}
      </form>

      {step === "password" ? (
        <form onSubmit={onSignInWithPassword} className="space-y-3 pt-2">
          <InputGroup>
            <InputGroupInput
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={isSubmitting}
            />
          </InputGroup>

          <div className="grid gap-2">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Working…" : "Sign in"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={requestPasswordLink}
              disabled={isSubmitting || !normalizeEmail(email)}
            >
              Send password link
            </Button>
          </div>
        </form>
      ) : null}

      {step === "setup-link" ? (
        <div className="space-y-3 pt-2">
          <div className="rounded border border-zinc-200 bg-white p-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-black dark:text-zinc-200">
            No account exists for this email yet. Click below to get a password
            link and create your account.
          </div>

          <Button
            type="button"
            className="w-full"
            onClick={requestPasswordLink}
            disabled={isSubmitting || !normalizeEmail(email)}
          >
            {isSubmitting ? "Working…" : "Send password link"}
          </Button>
        </div>
      ) : null}

      <p className="text-xs text-zinc-600 dark:text-zinc-300">
        Only emails in the clients or team members list can sign in.
        {emailStatus?.allowlisted ? (
          <span>
            {" "}
            ({emailStatus.allowlistType === "team_member"
              ? "Team member"
              : "Client"}{" "}
            email detected.)
          </span>
        ) : null}
      </p>
    </div>
  )
}
