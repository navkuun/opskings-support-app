"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import { authClient } from "@/lib/auth-client"

export function LoginForm({
  initialMode,
}: {
  initialMode?: "sign-in" | "sign-up"
}) {
  const router = useRouter()
  const { data: session } = authClient.useSession()

  const [mode, setMode] = React.useState<"sign-in" | "sign-up" | "forgot">(
    initialMode ?? "sign-in",
  )
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [notice, setNotice] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (session?.user) router.replace("/dashboard")
  }, [router, session?.user])

  const resetRedirectTo = React.useCallback(() => {
    const origin = window.location.origin
    return `${origin}/reset-password`
  }, [])

  const onSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      setNotice(null)
      setIsSubmitting(true)
      try {
        if (mode === "forgot") {
          const result = await authClient.requestPasswordReset({
            email,
            redirectTo: resetRedirectTo(),
          })
          if (result.error) {
            setError(result.error.message ?? "Failed to request password reset.")
            return
          }
          setNotice("If an account exists, a reset link has been sent.")
          return
        }

        if (mode === "sign-up") {
          const result = await authClient.signUp.email({
            name,
            email,
            password,
            callbackURL: "/dashboard",
          })
          if (result.error) setError(result.error.message ?? "Sign up failed")
        } else {
          const result = await authClient.signIn.email({
            email,
            password,
            callbackURL: "/dashboard",
          })
          if (result.error) {
            const status =
              typeof result.error === "object" &&
              result.error &&
              "status" in result.error &&
              typeof (result.error as { status?: unknown }).status === "number"
                ? (result.error as { status: number }).status
                : null

            setError(
              status === 403
                ? "Please verify your email address to sign in."
                : result.error.message ?? "Sign in failed",
            )
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong")
      } finally {
        setIsSubmitting(false)
      }
    },
    [email, mode, name, password, resetRedirectTo],
  )

  const onOpenDevResetLink = React.useCallback(async () => {
    setError(null)
    setNotice(null)
    setIsSubmitting(true)
    try {
      const res = await fetch(
        `/api/auth/dev-reset-link?email=${encodeURIComponent(email)}`,
      )
      if (!res.ok) {
        setError("Dev reset link is unavailable.")
        return
      }
      const data = (await res.json()) as { ok: boolean; url: string | null }
      if (!data.ok || !data.url) {
        setError("No reset link found yet. Submit the reset request first.")
        return
      }
      window.location.assign(data.url)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to open reset link")
    } finally {
      setIsSubmitting(false)
    }
  }, [email])

  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          {mode === "sign-up"
            ? "Create account"
            : mode === "forgot"
              ? "Reset password"
              : "Sign in"}
        </h1>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setError(null)
            setNotice(null)
            setMode(mode === "sign-in" ? "sign-up" : "sign-in")
          }}
        >
          {mode === "sign-in" ? "Need an account?" : "Have an account?"}
        </Button>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        {mode === "sign-up" ? (
          <>
            <InputGroup>
              <InputGroupInput
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </InputGroup>
          </>
        ) : null}

        <InputGroup>
          <InputGroupInput
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </InputGroup>

        {mode !== "forgot" ? (
          <InputGroup>
            <InputGroupInput
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={
                mode === "sign-up" ? "new-password" : "current-password"
              }
              required
            />
          </InputGroup>
        ) : null}

        {mode === "sign-in" ? (
          <div className="-mt-1 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setError(null)
                setNotice(null)
                setMode("forgot")
              }}
            >
              Forgot password?
            </Button>
          </div>
        ) : null}

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

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting
            ? "Working…"
            : mode === "forgot"
              ? "Send reset link"
              : mode === "sign-up"
              ? "Sign up"
              : "Sign in"}
        </Button>

        {mode === "forgot" && process.env.NODE_ENV !== "production" ? (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onOpenDevResetLink}
            disabled={isSubmitting || !email}
          >
            Open reset link (dev)
          </Button>
        ) : null}
      </form>
    </div>
  )
}
