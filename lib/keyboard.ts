export function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false

  const closest = target.closest("input, textarea, select, [contenteditable]")
  if (!closest) return false

  if (closest instanceof HTMLInputElement) {
    if (closest.type === "checkbox" || closest.type === "radio") return false
    if (closest.disabled || closest.readOnly) return false
  }

  if (closest instanceof HTMLTextAreaElement) {
    if (closest.disabled || closest.readOnly) return false
  }

  if (closest instanceof HTMLSelectElement) {
    if (closest.disabled) return false
  }

  return true
}

