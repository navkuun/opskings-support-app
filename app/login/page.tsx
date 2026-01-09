import { LoginForm } from "@/components/auth/login-form"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const initialMode = sp.mode === "sign-up" ? "sign-up" : "sign-in"

  return (
    <div className="min-h-[calc(100vh-0px)] bg-white px-6 py-10 text-zinc-900 dark:bg-black dark:text-zinc-200">
      <LoginForm initialMode={initialMode} />
    </div>
  )
}

