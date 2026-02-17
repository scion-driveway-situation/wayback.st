import { createSignal, Match, onMount, Switch } from "solid-js"
import { Route, Router } from "@solidjs/router"
import { pool } from "@nostr/gadgets/global"

import { Home } from "./Home"

pool.trackRelays = true

export const [loggedIn, logIn] = createSignal<undefined | string | null>(undefined)

function App() {
  onMount(async () => {
    await new Promise(resolve => setTimeout(resolve, 900))
    let loggedIn = localStorage.getItem("loggedIn")
    if (loggedIn) {
      try {
        let pubkey = await (window as any).nostr.getPublicKey()
        if (pubkey === loggedIn) {
          logIn(pubkey)
          return
        }
      } catch (err) {
        /***/
      }
    }

    console.info("window.nostr.getPublicKey() failed, logging out.")
    localStorage.removeItem("loggedIn")
    logIn(null)
  })

  return (
    <div class="max-w-7xl mx-auto min-h-screen flex flex-col">
      <header class="border-b border-black mb-5 pb-2 flex justify-between items-center">
        <div>
          <strong>Wayback Street)</strong>
        </div>
        <div>
          <Switch>
            <Match when={loggedIn()}>
              <span class="mr-2">Logged in: </span>
              <nostr-name attr:pubkey={loggedIn()} />
              <button
                on:click={logout}
                class="font-mono border border-black bg-gray-200 hover:bg-gray-300 px-1 py-0.5 cursor-pointer ml-2 text-sm"
              >
                [LOGOUT]
              </button>
            </Match>
            <Match when={!loggedIn()}>
              <button
                on:click={login}
                class="font-mono border border-black bg-gray-200 hover:bg-gray-300 px-1 py-0.5 cursor-pointer text-sm"
              >
                [LOGIN]
              </button>
            </Match>
          </Switch>
        </div>
      </header>

      <main class="flex-1 flex flex-col">
        <Router>
          <Route path="/" component={Home} />
          <Route path="/:nevent" component={Home} />
        </Router>
      </main>

      <footer class="border-t border-black mt-5 pt-2 text-center text-xs">
        <p>
          <a
            href="https://gitworkshop.dev/npub165650f6wly0a72c67hgm0ljkmt4cx00jc7cguem8m44vupxjy96s6vj8up/relay.ngit.dev/waybackst"
            class="text-blue-600 visited:text-purple-600 underline"
          >
            SOURCE CODE
          </a>
        </p>
      </footer>
    </div>
  )

  async function login() {
    let pubkey = await (window as any).nostr.getPublicKey()
    localStorage.setItem("loggedIn", pubkey)
    logIn(pubkey)
  }

  function logout() {
    localStorage.removeItem("loggedIn")
    logIn(undefined)
  }
}

export default App
