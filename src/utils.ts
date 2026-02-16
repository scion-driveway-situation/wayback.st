import { NostrEvent } from "@nostr/tools"

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  // If less than 24 hours ago, show relative time
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000))
    if (hours < 1) {
      const minutes = Math.floor(diff / (60 * 1000))
      return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`
    }
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`
  }

  // Otherwise show formatted date
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined
  })
}

export function getDomain(url: string): string | null {
  try {
    return new URL(url).hostname
  } catch {
    try {
      return new URL("https://" + url).hostname
    } catch {
      return null
    }
  }
}

export function getTagValue(event: NostrEvent, tag: string): string | null {
  const t = event.tags.find((t: string[]) => t[0] === tag)
  return t ? t[1] : null
}

export function getPageTags(event: NostrEvent): string[] {
  return event.tags.filter((t: string[]) => t[0] === "page").map((t: string[]) => t[1])
}
