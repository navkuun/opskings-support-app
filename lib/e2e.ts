export function isE2eTestModeEnabled() {
  const value = process.env.E2E_TEST_MODE
  return value === "1" || value === "true" || value === "yes"
}

