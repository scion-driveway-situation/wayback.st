import { createSignal, onMount, createResource, For, createEffect, Show } from "solid-js"
import { useParams, useNavigate } from "@solidjs/router"
import { loadFollowsList, loadRelayList } from "@nostr/gadgets/lists"
import { NostrEvent } from "@nostr/tools"
import { pool } from "@nostr/gadgets/global"
import { globalism, loadWoT } from "@nostr/gadgets/wot"

import { getDomain, getTagValue } from "./utils"
import { ArchiveItem } from "./ArchiveItem"
import { decode, neventEncode } from "@nostr/tools/nip19"
import { loggedIn } from "./App"
import debounce from "debounce"
import { outboxFilterRelayBatch } from "@nostr/gadgets/outbox"
import { SubCloser } from "@nostr/tools/abstract-pool"

export function Home() {
  const params = useParams()
  const navigate = useNavigate()
  let [url, setUrl] = createSignal("")
  let triggerSetUrl = debounce(setUrl, 780)
  let [selectedEvent, setSelectedEvent] = createSignal<NostrEvent | null>(null)
  let [leftEvents, setLeftEvents] = createSignal<NostrEvent[]>([])
  let [rightEvents, setRightEvents] = createSignal<NostrEvent[]>([])
  let [showContacts, setShowContacts] = createSignal(false)
  let [showRelays, setShowRelays] = createSignal(false)
  let replayContainer: HTMLDivElement | undefined

  const pubkeyForContacts = () => {
    let logged = loggedIn()
    if (logged) return logged
    if (logged === null) {
      return decode("npub1dergggklka99wwrs92yz8wdjs952h2ux2ha2ed598ngwu9w7a6fsh9xzpc").data
    }
    return undefined
  }

  const [contacts] = createResource(pubkeyForContacts, async pk => {
    if (!pk) return

    try {
      const follows = await loadFollowsList(pk)
      return [pk, ...follows.items.filter(pk => pk.match(/[0-9a-f]{64}/))]
    } catch (err) {
      console.warn("failed to load follows", pk, err)
      return [pk]
    }
  })

  const [outboxRequest] = createResource(
    () => ({ contacts: contacts(), url: url() }),
    async ({ contacts, url }) => {
      if (!contacts) return

      const domain = getDomain(url)
      if (!domain) return

      return outboxFilterRelayBatch(contacts, {
        kinds: [4554],
        "#r": [domain]
      })
    }
  )

  const [wot] = createResource(pubkeyForContacts, async pk => {
    if (!pk) return

    try {
      return await loadWoT(pk)
    } catch (err) {
      console.warn("failed to load wot", pk, err)
      return new Set<string>()
    }
  })

  const [global] = createResource(contacts, async contacts => {
    let urls = await globalism(contacts)
    return urls.slice(0, 15)
  })

  // left column: events from contacts
  let leftSubc: SubCloser
  createEffect(() => {
    leftSubc?.close?.()

    if (!outboxRequest()) return

    let eosed = false
    let pre: NostrEvent[] = []

    leftSubc = pool.subscribeMap(outboxRequest(), {
      onevent: event => {
        if (!getTagValue(event, "url") || !getTagValue(event, "page")) return

        if (!eosed) {
          pre.push(event)
        } else {
          setLeftEvents(curr => [event, ...curr])
        }
      },
      oneose: () => {
        setLeftEvents(pre)
        pre = []
      }
    })
  })

  // right column: events from global%wot
  let rightSubc: SubCloser
  createEffect(() => {
    const domain = getDomain(url())
    if (!domain) return
    if (!global()) return

    rightSubc?.close?.()

    let eosed = false
    let pre: NostrEvent[] = []

    rightSubc = pool.subscribeMany(
      global(),
      {
        kinds: [4554],
        "#r": [domain]
      },
      {
        onevent: event => {
          if (!getTagValue(event, "url") || !getTagValue(event, "page")) return

          if (!eosed) {
            pre.push(event)
          } else {
            setRightEvents(curr => [event, ...curr])
          }
        },
        oneose: () => {
          setRightEvents(pre)
          pre = []
        }
      }
    )
  })

  onMount(async () => {
    if (params.nevent) {
      try {
        const decoded = decode(params.nevent)
        if (decoded.type === "nevent") {
          const relays = (decoded.data.relays || []).concat(
            (await loadRelayList(decoded.data.author || pubkeyForContacts())).items
              .filter(r => r.write)
              .map(r => r.url)
          )

          const event = await pool.get(relays, {
            ids: [decoded.data.id]
          })
          if (!event) {
            setTimeout(() => navigate("/"), 100)
            return
          }

          setRightEvents([event])
          setSelectedEvent(event)
        }
      } catch (err) {
        console.warn("failed to decode or fetch nevent", params.nevent, err)
      }

      return
    }

    const stored = sessionStorage.getItem("url")
    if (stored) {
      setUrl(stored)
    }
  })

  createEffect(() => {
    sessionStorage.setItem("url", url())
  })

  return (
    <div class="flex flex-col flex-1">
      <div class="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div class="order-last md:order-first">
          <Show when={contacts() && global()}>
            <p>
              looking at{" "}
              <span
                class="text-blue-500 cursor-pointer"
                onClick={() => setShowContacts(!showContacts())}
              >
                {contacts()?.length || 0}
              </span>{" "}
              contacts' feeds (in whatever relay they might be), or in{" "}
              <span
                class="text-pink-500 cursor-pointer"
                onClick={() => setShowRelays(!showRelays())}
              >
                {global()?.length || 0}
              </span>{" "}
              "global" relays (based on{" "}
              <nostr-name class="text-sky-500" attr:pubkey={pubkeyForContacts()} />
              ).
            </p>
          </Show>
          <Show when={showContacts()}>
            <ul class="mb-2">
              <For each={contacts()}>
                {pubkey => (
                  <li class="text-blue-500">
                    <nostr-name attr:pubkey={pubkey} />
                  </li>
                )}
              </For>
            </ul>
          </Show>
          <Show when={showRelays()}>
            <ul class="mb-2">
              <For each={global()}>{relay => <li class="text-pink-500">{relay}</li>}</For>
            </ul>
          </Show>
        </div>
        <div>
          <p class="mb-2">Enter URL to find archives for:</p>
          <input
            type="text"
            value={url()}
            onInput={e => triggerSetUrl(e.target.value)}
            class="font-mono border border-black p-1 bg-white w-full"
          />
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div class="flex flex-col">
          <h3 class="mb-2 font-bold">Archives by contacts:</h3>
          <div
            class={`border border-black p-2 overflow-y-auto flex-1 ${selectedEvent() ? "h-40 overflow-y-auto" : "min-h-120"}`}
          >
            <For each={leftEvents()}>
              {(event: NostrEvent) => (
                <ArchiveItem
                  event={event}
                  onClick={() => handleEventClick(event)}
                  deprioritized={false}
                />
              )}
            </For>
          </div>
        </div>
        <div class="flex flex-col">
          <h3 class="mb-2 font-bold">Other:</h3>
          <div
            class={`border border-black p-2 overflow-y-auto flex-1 ${selectedEvent() ? "h-40 overflow-y-auto" : "min-h-120"}`}
          >
            <For each={rightEvents()}>
              {(event: NostrEvent) => (
                <Show when={!leftEvents().find(l => l.id === event.id)}>
                  <ArchiveItem
                    event={event}
                    onClick={() => handleEventClick(event)}
                    deprioritized={!wot()?.has(event.pubkey)}
                  />
                </Show>
              )}
            </For>
          </div>
        </div>
      </div>
      <Show when={selectedEvent()}>
        <div class="flex justify-end mt-2 mb-2">
          <button
            on:click={() => replayContainer?.requestFullscreen()}
            class="font-mono border border-black bg-gray-200 hover:bg-gray-300 px-1 py-0.5 cursor-pointer text-sm"
          >
            [FULLSCREEN]
          </button>
        </div>
        <div ref={replayContainer} class="border border-black flex-1 min-h-[400px] relative">
          <replay-web-page
            attr:source={getTagValue(selectedEvent(), "url")}
            attr:url={getTagValue(selectedEvent(), "page")}
            class="absolute inset-0 w-full h-full"
          />
        </div>
      </Show>
    </div>
  )

  function handleEventClick(event: NostrEvent) {
    setSelectedEvent(event)
    history.pushState(
      "",
      null,
      "/" +
        neventEncode({
          id: event.id,
          author: event.pubkey,
          relays: Array.from(pool.seenOn.get(event.id).values()).map(r => r.url)
        })
    )
  }
}
