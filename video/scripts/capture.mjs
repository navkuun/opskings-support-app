import fs from "node:fs/promises"
import path from "node:path"
import { execFile } from "node:child_process"
import { fileURLToPath } from "node:url"
import { performance } from "node:perf_hooks"
import process from "node:process"
import { promisify } from "node:util"
import { chromium } from "playwright"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const videoRoot = path.resolve(__dirname, "..")
const repoRoot = path.resolve(videoRoot, "..")

const config = {
  baseURL: process.env.VIDEO_BASE_URL ?? "http://localhost:3000",
  width: Number.parseInt(process.env.VIDEO_WIDTH ?? "1920", 10),
  height: Number.parseInt(process.env.VIDEO_HEIGHT ?? "1080", 10),
  fps: 30,
  pageSettleMs: Number.parseInt(process.env.VIDEO_PAGE_SETTLE_MS ?? "1600", 10),
  actionPauseMs: Number.parseInt(process.env.VIDEO_ACTION_PAUSE_MS ?? "650", 10),
  segmentPadMs: Number.parseInt(process.env.VIDEO_SEGMENT_PAD_MS ?? "2400", 10),
}

const useFullscreen = process.env.VIDEO_FULLSCREEN !== "0"
const fullscreenShortcut = process.env.VIDEO_FULLSCREEN_SHORTCUT ?? "F11"
const headlessMode = process.env.VIDEO_HEADLESS !== "0"
const effectiveFullscreen = useFullscreen && !headlessMode
const cursorTransition = headlessMode ? "transform 0.02s linear" : "transform 0.06s ease"
const runtimeSize = {
  width: config.width,
  height: config.height,
}

const execFileAsync = promisify(execFile)

const capturesDir = path.join(videoRoot, "public", "captures")
const cacheDir = path.join(videoRoot, ".cache")
const internalStatePath = path.join(cacheDir, "storage-internal.json")
const clientStatePath = path.join(cacheDir, "storage-client.json")

const manifest = {
  fps: config.fps,
  width: config.width,
  height: config.height,
  createdAt: new Date().toISOString(),
  segments: [],
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function log(message) {
  const stamp = new Date().toISOString()
  console.log(`[video][${stamp}] ${message}`)
}

function rand(min, max) {
  return Math.random() * (max - min) + min
}

async function waitForServer(url, timeoutMs = 120_000) {
  log(`Waiting for server: ${url}`)
  const deadline = Date.now() + timeoutMs
  let lastError = null
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { cache: "no-store" })
      if (res.ok) return
      lastError = new Error(`Non-2xx: ${res.status}`)
    } catch (err) {
      lastError = err
    }
    await sleep(500)
  }
  throw lastError ?? new Error("Timed out waiting for server")
}

async function ensureLogoAsset() {
  const source = path.join(repoRoot, "public", "logo-full.png")
  const target = path.join(videoRoot, "public", "logo-full.png")
  try {
    await fs.copyFile(source, target)
  } catch (error) {
    console.warn("[video] Failed to copy logo-full.png. Place it at video/public/logo-full.png", error)
  }
}

async function fileExists(target) {
  try {
    await fs.access(target)
    return true
  } catch {
    return false
  }
}

async function resolveBrowserExecutable() {
  const envPath = process.env.PLAYWRIGHT_EXECUTABLE_PATH
  if (envPath) return envPath
  const systemChrome = "/run/current-system/sw/bin/google-chrome-stable"
  if (await fileExists(systemChrome)) return systemChrome
  return null
}

function bezier(t, p0, p1, p2, p3) {
  const cX = 3 * (p1.x - p0.x)
  const bX = 3 * (p2.x - p1.x) - cX
  const aX = p3.x - p0.x - cX - bX

  const cY = 3 * (p1.y - p0.y)
  const bY = 3 * (p2.y - p1.y) - cY
  const aY = p3.y - p0.y - cY - bY

  const x = aX * t * t * t + bX * t * t + cX * t + p0.x
  const y = aY * t * t * t + bY * t * t + cY * t + p0.y

  return { x, y }
}

function createMouseHelper(page, size) {
  const stepDelayMin = headlessMode ? 1 : 2
  const stepDelayMax = headlessMode ? 5 : 7
  const clickPauseMin = headlessMode ? 12 : 20
  const clickPauseMax = headlessMode ? 45 : 60
  const clickHoldMin = headlessMode ? 18 : 28
  const clickHoldMax = headlessMode ? 60 : 80
  const clickAfterMin = headlessMode ? 50 : 80
  const clickAfterMax = headlessMode ? 120 : 140

  const state = {
    x: size.width / 2,
    y: size.height / 2,
  }

  const move = async (x, y) => {
    const start = { x: state.x, y: state.y }
    const end = { x, y }
    const distance = Math.hypot(end.x - start.x, end.y - start.y)
    const steps = Math.max(18, Math.min(70, Math.round(distance / 8)))

    const cp1 = {
      x: start.x + rand(-80, 80),
      y: start.y + rand(-60, 60),
    }
    const cp2 = {
      x: end.x + rand(-80, 80),
      y: end.y + rand(-60, 60),
    }

    for (let i = 1; i <= steps; i++) {
      const t = i / steps
      const { x: nx, y: ny } = bezier(t, start, cp1, cp2, end)
      await page.mouse.move(nx, ny)
      await sleep(rand(stepDelayMin, stepDelayMax))
    }

    state.x = end.x
    state.y = end.y
  }

  const click = async (locator) => {
    const box = await locator.boundingBox()
    if (!box) throw new Error("Element not visible for click")
    const target = {
      x: box.x + box.width * rand(0.3, 0.7),
      y: box.y + box.height * rand(0.3, 0.7),
    }
    await locator.scrollIntoViewIfNeeded()
    await move(target.x, target.y)
    await sleep(rand(clickPauseMin, clickPauseMax))
    await page.mouse.down()
    await sleep(rand(clickHoldMin, clickHoldMax))
    await page.mouse.up()
    await sleep(rand(clickAfterMin, clickAfterMax))
  }

  return { move, click }
}

async function installCursor(page) {
  await page.addInitScript(
    ({ transition }) => {
      const setup = () => {
      const cursor = document.createElement("div")
      cursor.id = "pw-cursor"
      cursor.style.position = "fixed"
      cursor.style.top = "0"
      cursor.style.left = "0"
      cursor.style.width = "14px"
      cursor.style.height = "14px"
      cursor.style.borderRadius = "999px"
      cursor.style.background = "rgba(255,255,255,0.9)"
      cursor.style.boxShadow = "0 0 0 2px rgba(0,0,0,0.35), 0 6px 18px rgba(0,0,0,0.35)"
      cursor.style.pointerEvents = "none"
      cursor.style.zIndex = "999999"
      cursor.style.transition = transition

      const cursorRing = document.createElement("div")
      cursorRing.id = "pw-cursor-ring"
      cursorRing.style.position = "fixed"
      cursorRing.style.top = "0"
      cursorRing.style.left = "0"
      cursorRing.style.width = "32px"
      cursorRing.style.height = "32px"
      cursorRing.style.borderRadius = "999px"
      cursorRing.style.border = "1px solid rgba(255,255,255,0.5)"
      cursorRing.style.pointerEvents = "none"
      cursorRing.style.zIndex = "999998"
      cursorRing.style.opacity = "0"

      document.documentElement.style.cursor = "none"
      document.body.appendChild(cursor)
      document.body.appendChild(cursorRing)

      let scale = 1
      let ringScale = 1
      let lastX = 0
      let lastY = 0

      const updatePosition = (x, y) => {
        lastX = x
        lastY = y
        cursor.style.transform = `translate(${x}px, ${y}px) scale(${scale})`
        cursorRing.style.transform = `translate(${x}px, ${y}px) scale(${ringScale})`
      }

      document.addEventListener("mousemove", (event) => updatePosition(event.clientX, event.clientY))

      document.addEventListener("mousedown", () => {
        scale = 0.9
        ringScale = 0.9
        cursorRing.style.opacity = "1"
        updatePosition(lastX, lastY)
      })

      document.addEventListener("mouseup", () => {
        scale = 1
        ringScale = 1
        cursorRing.style.opacity = "0"
        updatePosition(lastX, lastY)
      })
      }

      if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", setup, { once: true })
      } else {
        setup()
      }
    },
    { transition: cursorTransition },
  )

  await page.addStyleTag({ content: "* { cursor: none !important; }" })
}

function isHyprland() {
  if (process.env.HYPRLAND_INSTANCE_SIGNATURE) return true
  const desktop = process.env.XDG_CURRENT_DESKTOP?.toLowerCase() ?? ""
  return desktop.includes("hyprland")
}

async function tryHyprlandFullscreen() {
  if (!isHyprland()) return false
  try {
    await execFileAsync("hyprctl", ["dispatch", "fullscreen", "1"])
    return true
  } catch {
    // ignore
  }
  try {
    await execFileAsync("hyprctl", ["dispatch", "fullscreen"])
    return true
  } catch {
    return false
  }
}

async function ensureFullscreen(page) {
  if (!effectiveFullscreen) return
  await page.waitForTimeout(200)
  try {
    await page.bringToFront()
  } catch {
    // ignore
  }
  try {
    await page.keyboard.press(fullscreenShortcut)
  } catch {
    // Ignore if shortcut fails
  }
  await page.waitForTimeout(200)
  await tryHyprlandFullscreen()
  await page.waitForTimeout(200)
  try {
    await page.evaluate(async () => {
      if (document.fullscreenElement || !document.documentElement.requestFullscreen) return
      await document.documentElement.requestFullscreen()
    })
  } catch {
    // requestFullscreen may be blocked without user gesture
  }
  await page.waitForTimeout(200)
}

async function resolveViewportSize(page) {
  if (!effectiveFullscreen) {
    return { width: runtimeSize.width, height: runtimeSize.height }
  }

  const size = await page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }))

  if (size?.width && size?.height) {
    runtimeSize.width = size.width
    runtimeSize.height = size.height
    manifest.width = size.width
    manifest.height = size.height
  }

  return { width: runtimeSize.width, height: runtimeSize.height }
}

async function humanType(page, text) {
  for (const char of text) {
    await page.keyboard.type(char)
    await sleep(rand(25, 90))
  }
}

async function settle(page, ms = config.pageSettleMs) {
  await page.waitForTimeout(ms)
}

async function loginAndSaveState(browser, kind) {
  const statePath = kind === "internal" ? internalStatePath : clientStatePath
  await fs.mkdir(cacheDir, { recursive: true })

  const context = await browser.newContext({
    viewport: effectiveFullscreen ? null : { width: runtimeSize.width, height: runtimeSize.height },
    ...(effectiveFullscreen ? {} : { deviceScaleFactor: 1 }),
  })
  const page = await context.newPage()
  await installCursor(page)
  await ensureFullscreen(page)
  const size = await resolveViewportSize(page)
  const mouse = createMouseHelper(page, size)

  await page.goto(config.baseURL, { waitUntil: "domcontentloaded" })
  await settle(page)

  const buttonLabel = kind === "internal" ? "Continue as internal" : "Continue as client"
  const button = page.getByRole("button", { name: buttonLabel })
  await mouse.click(button)

  if (kind === "internal") {
    await page.waitForURL("**/dashboard", { timeout: 60_000 })
  } else {
    await page.waitForURL("**/tickets", { timeout: 60_000 })
  }

  await settle(page)
  await context.storageState({ path: statePath })
  await context.close()
}

async function recordSegment(browser, { id, storageState, run }) {
  await fs.mkdir(capturesDir, { recursive: true })

  const context = await browser.newContext({
    viewport: effectiveFullscreen ? null : { width: runtimeSize.width, height: runtimeSize.height },
    ...(effectiveFullscreen ? {} : { deviceScaleFactor: 1 }),
    storageState,
    recordVideo: {
      dir: capturesDir,
      ...(effectiveFullscreen ? {} : { size: { width: runtimeSize.width, height: runtimeSize.height } }),
    },
  })
  const page = await context.newPage()
  await installCursor(page)
  await ensureFullscreen(page)
  const size = await resolveViewportSize(page)
  const mouse = createMouseHelper(page, size)

  const video = page.video()
  const startedAt = performance.now()
  await run({ page, mouse })
  await page.waitForTimeout(config.segmentPadMs)
  await context.close()

  const recordedPath = video ? await video.path() : null
  if (!recordedPath) throw new Error(`Missing recorded video for segment ${id}`)

  const finalPath = path.join(capturesDir, `${id}.webm`)
  await fs.rm(finalPath, { force: true })
  await fs.rename(recordedPath, finalPath)

  const durationMs = performance.now() - startedAt + 250
  const durationInFrames = Math.max(1, Math.ceil((durationMs / 1000) * config.fps))

  manifest.segments.push({
    id,
    file: `captures/${id}.webm`,
    durationMs: Math.round(durationMs),
    durationInFrames,
  })
}

async function captureDashboard({ page, mouse }) {
  await page.goto(`${config.baseURL}/dashboard`, { waitUntil: "domcontentloaded" })
  await page.waitForResponse((res) => res.ok() && res.url().includes("/api/dashboard/metrics"), {
    timeout: 60_000,
  })
  await settle(page)

  const chartCards = page.locator('[data-slot="card"]').filter({ hasText: /Tickets|Resolution|Priority|Type|Over/i })
  const hoverCount = Math.min(3, await chartCards.count())
  for (let i = 0; i < hoverCount; i += 1) {
    const card = chartCards.nth(i)
    await card.scrollIntoViewIfNeeded()
    const box = await card.boundingBox()
    if (box) {
      await mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.4)
      await page.waitForTimeout(420)
    }
  }

  const ticketTypeInput = page.getByTestId("dashboard-filter-ticket-type")
  await mouse.click(ticketTypeInput)
  await page.waitForTimeout(config.actionPauseMs)
  const firstTicketType = page.locator('[data-slot="combobox-item"]').first()
  await firstTicketType.waitFor({ timeout: 10_000 })
  if (await firstTicketType.count()) {
    await mouse.click(firstTicketType)
  }
  await page.waitForTimeout(config.actionPauseMs)
  await page.keyboard.press("Escape")

  const priorityInput = page.getByTestId("dashboard-filter-priority")
  await mouse.click(priorityInput)
  await page.waitForTimeout(config.actionPauseMs)
  const priorityOption = page
    .locator('[data-slot="combobox-item"]')
    .filter({ hasText: /High/i })
    .first()
  if (await priorityOption.count()) {
    await mouse.click(priorityOption)
  }
  await page.waitForTimeout(config.actionPauseMs)
  await page.keyboard.press("Escape")

  await page.waitForTimeout(2000)
  const resetButton = page.getByTestId("dashboard-filter-reset")
  await mouse.click(resetButton)
  await settle(page)
}

async function captureTickets({ page, mouse }) {
  await page.goto(`${config.baseURL}/tickets`, { waitUntil: "domcontentloaded" })
  await page.getByRole("button", { name: "Create new ticket" }).waitFor({ timeout: 60_000 })
  await settle(page)

  const search = page.getByLabel("Search tickets")
  await mouse.click(search)
  await humanType(page, "Feature Request")
  await page.waitForTimeout(config.pageSettleMs)

  const createButton = page.getByRole("button", { name: "Create new ticket" })
  await mouse.click(createButton)
  const titleInput = page.getByLabel("Ticket title")
  try {
    await titleInput.waitFor({ timeout: 10_000 })
  } catch {
    await page.goto(`${config.baseURL}/tickets?new=1`, { waitUntil: "domcontentloaded" })
    await settle(page)
    await titleInput.waitFor({ timeout: 20_000 })
  }

  await mouse.click(titleInput)
  await humanType(page, "Payment gateway lag")

  const description = page.getByLabel("Ticket description")
  await mouse.click(description)
  await humanType(page, "Clients are seeing slow checkout times during peak traffic. Please investigate.")

  const clientButton = page.getByRole("button", { name: "Client" })
  await mouse.click(clientButton)
  await selectFirstPopoverOption(page, mouse)

  const typeButton = page.getByRole("button", { name: "Ticket type" })
  await mouse.click(typeButton)
  await selectFirstPopoverOption(page, mouse)

  await page.waitForTimeout(config.actionPauseMs)
  const dialog = page.locator('[data-slot="dialog-popup"]')
  const submit = dialog.getByRole("button", { name: /^Create ticket/i }).first()
  await mouse.click(submit)

  await page.waitForURL(/\/tickets\/\d+/, { timeout: 60_000 })
  await page.waitForTimeout(600)

  const replyInput = page.getByPlaceholder("Write a reply…")
  await mouse.click(replyInput)
  await humanType(page, "Thanks for flagging — we’re checking logs and will update shortly.")
  const sendButton = page.getByRole("button", { name: "Send" })
  await mouse.click(sendButton)
  await page.waitForTimeout(600)
}

async function selectFirstPopoverOption(page, mouse) {
  const comboboxItem = page.locator('[data-slot="combobox-item"]').first()
  try {
    await comboboxItem.waitFor({ timeout: 5_000 })
    await mouse.click(comboboxItem)
    return
  } catch {
    // fallthrough
  }

  const option = page.locator(".max-h-64 button").first()
  try {
    await option.waitFor({ timeout: 5_000 })
    await mouse.click(option)
    return
  } catch {
    // fallthrough
  }

  await page.keyboard.press("ArrowDown")
  await page.waitForTimeout(200)
  await page.keyboard.press("Enter")
}

async function selectFirstSelectItem(page, { excludeText } = {}) {
  const locator = excludeText
    ? page.locator('[data-slot="select-item"]').filter({ hasNotText: excludeText })
    : page.locator('[data-slot="select-item"]')
  const option = locator.first()
  await option.waitFor({ timeout: 10_000 })
  await option.click()
}

async function openCommandPalette(page) {
  await page.keyboard.press(process.platform === "darwin" ? "Meta+K" : "Control+K")
  const input = page.getByPlaceholder("Search…")
  await input.waitFor({ timeout: 10_000 })
  return input
}

async function selectCommand(page, label, waitForUrl) {
  const input = await openCommandPalette(page)
  await page.waitForTimeout(config.actionPauseMs)
  await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A")
  await page.keyboard.press("Backspace")
  await humanType(page, label)
  await page.waitForTimeout(config.actionPauseMs)
  await page.keyboard.press("Enter")
  if (waitForUrl) {
    await page.waitForURL(waitForUrl, { timeout: 60_000 })
  }
  await page.waitForTimeout(config.pageSettleMs)
}

async function captureCommandPalette({ page }) {
  await page.goto(`${config.baseURL}/dashboard`, { waitUntil: "domcontentloaded" })
  await page.waitForResponse((res) => res.ok() && res.url().includes("/api/dashboard/metrics"), {
    timeout: 60_000,
  })
  await settle(page)

  await selectCommand(page, "Response time", "**/response-time")
  await selectCommand(page, "Teams", "**/teams")
  await selectCommand(page, "New ticket", "**/tickets?new=1")

  const titleInput = page.getByLabel("Ticket title")
  await titleInput.waitFor({ timeout: 20_000 })
  await page.waitForTimeout(config.pageSettleMs)
}

async function captureResponseTime({ page, mouse }) {
  await page.goto(`${config.baseURL}/response-time`, { waitUntil: "domcontentloaded" })
  await page.waitForResponse((res) => res.ok() && res.url().includes("/api/response-time/metrics"), {
    timeout: 60_000,
  })
  await settle(page)

  const priorityInput = page.getByTestId("response-time-filter-priority")
  await mouse.click(priorityInput)
  await page.waitForTimeout(config.actionPauseMs)
  const urgentOption = page
    .locator('[data-slot="combobox-item"]')
    .filter({ hasText: /Urgent/i })
    .first()
  if (await urgentOption.count()) {
    await mouse.click(urgentOption)
  }
  await page.waitForTimeout(config.actionPauseMs)
  await page.keyboard.press("Escape")

  const ticketTypeInput = page.getByTestId("response-time-filter-ticket-type")
  await mouse.click(ticketTypeInput)
  await page.waitForTimeout(config.actionPauseMs)
  await selectFirstPopoverOption(page, mouse)
  await page.waitForTimeout(config.actionPauseMs)
  await page.keyboard.press("Escape")

  await settle(page)
}

async function captureTeams({ page, mouse }) {
  await page.goto(`${config.baseURL}/teams`, { waitUntil: "domcontentloaded" })
  await page.getByLabel("Search team members").waitFor({ timeout: 60_000 })
  await settle(page)

  const search = page.getByLabel("Search team members")
  await mouse.click(search)
  await humanType(page, "john")
  await page.waitForTimeout(config.pageSettleMs)
  await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A")
  await page.keyboard.press("Backspace")
  await page.waitForTimeout(config.actionPauseMs)

  const statusSelect = page.getByTestId("teams-status-filter")
  await mouse.click(statusSelect)
  await page.waitForTimeout(config.actionPauseMs)
  await selectFirstSelectItem(page, { excludeText: /All status/i })
  await page.waitForTimeout(config.actionPauseMs)
}

async function captureClients({ page, mouse }) {
  await page.goto(`${config.baseURL}/clients`, { waitUntil: "domcontentloaded" })
  await page.getByLabel("Search clients").waitFor({ timeout: 60_000 })
  await settle(page)

  const search = page.getByLabel("Search clients")
  await mouse.click(search)
  await humanType(page, "tech")
  await page.waitForTimeout(config.pageSettleMs)
  await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A")
  await page.keyboard.press("Backspace")
  await page.waitForTimeout(config.actionPauseMs)

  const planSelect = page.getByTestId("clients-plan-filter")
  await mouse.click(planSelect)
  await page.waitForTimeout(config.actionPauseMs)
  const noPlan = page.locator('[data-slot="select-item"]').filter({ hasText: /No plan/i }).first()
  await noPlan.waitFor({ timeout: 10_000 })
  await noPlan.click()
  await page.waitForTimeout(config.actionPauseMs)
}

async function captureClientTickets({ page, mouse }) {
  await page.goto(`${config.baseURL}/tickets`, { waitUntil: "domcontentloaded" })
  await page.getByRole("button", { name: "Create new ticket" }).waitFor({ timeout: 60_000 })
  await settle(page)

  const search = page.getByLabel("Search tickets")
  await mouse.click(search)
  await humanType(page, "Account Upgrade")
  await page.waitForTimeout(config.pageSettleMs)
  await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A")
  await page.keyboard.press("Backspace")
  await page.waitForTimeout(config.actionPauseMs)

  const statusFilter = page.getByTestId("tickets-filter-status")
  await mouse.click(statusFilter)
  await page.waitForTimeout(config.actionPauseMs)
  const resolvedOption = page
    .locator('[data-slot="combobox-item"]')
    .filter({ hasText: /Resolved/i })
    .first()
  await resolvedOption.waitFor({ timeout: 10_000 })
  await mouse.click(resolvedOption)
  await page.waitForTimeout(config.actionPauseMs)
  await page.keyboard.press("Escape")

  const resolvedRows = page
    .locator('tr[data-ticket-row-id]')
    .filter({ hasText: /Resolved/i })

  const totalRows = await resolvedRows.count()
  for (let attempt = 0; attempt < Math.min(3, totalRows); attempt += 1) {
    const row = resolvedRows.nth(attempt)
    await row.waitFor({ timeout: 10_000 })
    await row.click()
    await page.waitForURL(/\/tickets\/\d+/, { timeout: 60_000 })
    await page.waitForTimeout(config.pageSettleMs)

    const feedbackHeading = page.getByText("Feedback", { exact: true })
    if (await feedbackHeading.count()) {
      await feedbackHeading.scrollIntoViewIfNeeded()
      await page.waitForTimeout(config.actionPauseMs)
    }

    let star = page.getByRole("button", { name: "5 star" })
    if (!(await star.isVisible().catch(() => false))) {
      const editButton = page.getByRole("button", { name: "Edit" })
      if (await editButton.isVisible().catch(() => false)) {
        await mouse.click(editButton)
        await page.waitForTimeout(config.actionPauseMs)
      }
      star = page.getByRole("button", { name: "5 star" })
    }

    if (await star.isVisible().catch(() => false)) {
      await mouse.click(star)
      const feedbackInput = page.getByPlaceholder("Optional feedback…")
      await mouse.click(feedbackInput)
      await humanType(page, "Quick resolution — appreciate the clear updates.")
      const submitFeedback = page.getByRole("button", { name: /Submit feedback|Update feedback/i })
      await mouse.click(submitFeedback)
      await page.waitForTimeout(config.pageSettleMs)
      return
    }

    await page.goBack()
    await page.waitForURL("**/tickets", { timeout: 60_000 })
    await page.waitForTimeout(config.actionPauseMs)
  }
}

async function main() {
  await fs.mkdir(capturesDir, { recursive: true })
  await ensureLogoAsset()

  log("Using existing Next.js + zero-cache servers (no auto-start).")
  await waitForServer(`${config.baseURL}/`)

  log("Launching browser...")
  const executablePath = await resolveBrowserExecutable()
  const browser = await chromium.launch({
    headless: headlessMode,
    args: effectiveFullscreen ? ["--start-maximized"] : [`--window-size=${config.width},${config.height}`],
    ...(executablePath ? { executablePath } : {}),
  })

  try {
    log("Logging in as internal user...")
    await loginAndSaveState(browser, "internal")
    log("Capturing dashboard...")
    await recordSegment(browser, {
      id: "dashboard",
      storageState: internalStatePath,
      run: captureDashboard,
    })
    log("Capturing tickets list...")
    await recordSegment(browser, {
      id: "tickets",
      storageState: internalStatePath,
      run: captureTickets,
    })
    log("Capturing response time...")
    await recordSegment(browser, {
      id: "response-time",
      storageState: internalStatePath,
      run: captureResponseTime,
    })
    log("Capturing teams...")
    await recordSegment(browser, {
      id: "teams",
      storageState: internalStatePath,
      run: captureTeams,
    })
    log("Capturing clients...")
    await recordSegment(browser, {
      id: "clients",
      storageState: internalStatePath,
      run: captureClients,
    })
    log("Capturing command palette...")
    await recordSegment(browser, {
      id: "command-palette",
      storageState: internalStatePath,
      run: captureCommandPalette,
    })
    log("Logging in as client user...")
    await loginAndSaveState(browser, "client")
    log("Capturing client tickets...")
    await recordSegment(browser, {
      id: "client-tickets",
      storageState: clientStatePath,
      run: captureClientTickets,
    })

    const manifestPath = path.join(capturesDir, "manifest.json")
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2))
    log(`Capture manifest written to ${manifestPath}`)
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error("[video] Capture failed", error)
  process.exit(1)
})
