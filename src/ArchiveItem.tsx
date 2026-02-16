import { For } from "solid-js"
import { NostrEvent } from "@nostr/tools"
import { getDomain, getPageTags } from "./utils"

export function ArchiveItem(props: {
  event: NostrEvent
  onClick?: () => void
  deprioritized: boolean
}) {
  const rTags = () => props.event.tags.filter(t => t[0] === "r").map(t => t[1])
  const firstR = () => rTags()[0]
  const domain = () => (firstR() ? getDomain(firstR()) : "")
  const pageTags = () => getPageTags(props.event)
  const hasMore = () => (pageTags().length > 4 ? pageTags().length - 4 : false)
  const paths = () => pageTags().slice(0, hasMore() ? 3 : 4)

  return (
    <div
      class={`border border-gray-300 rounded p-2 mb-2 cursor-pointer hover:bg-sky-50 transition-all duration-200 ${props.deprioritized ? "opacity-50" : ""}`}
      onClick={() => props.onClick?.()}
    >
      <div class="flex justify-end items-center mb-1">
        <nostr-name attr:pubkey={props.event.pubkey} class="font-medium" />
        <nostr-picture attr:pubkey={props.event.pubkey} class="w-6 h-6 rounded-full mr-2" />
      </div>
      {domain() && <h3 class="text-lg font-bold mb-1 text-blue-600">{domain()}</h3>}
      {props.event.content && (
        <p class="text-gray-700 mb-1 italic text-sm">{props.event.content}</p>
      )}
      {paths().length > 0 && (
        <div class="text-sm text-gray-500 flex flex-col gap-1">
          <For each={paths()}>
            {path => (
              <span class="truncate">
                {path.startsWith("https://" + domain())
                  ? path.substring(domain().length + 8)
                  : path}
              </span>
            )}
          </For>
          {hasMore() && <span>... {hasMore()} more.</span>}
        </div>
      )}
    </div>
  )
}
