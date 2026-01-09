import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const token = typeof sp.token === "string" ? sp.token : null
  const error = typeof sp.error === "string" ? sp.error : null

  return (
    <div className="min-h-[calc(100vh-0px)] bg-white px-6 py-10 text-zinc-900 dark:bg-black dark:text-zinc-200">
      <ResetPasswordForm token={token} error={error} />
    </div>
  )
}

