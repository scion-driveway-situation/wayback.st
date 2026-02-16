import "./app.css"
import { ComponentProps } from "solid-js"
import { render } from "solid-js/web"
import "nostr-web-components/nostr-name"
import "nostr-web-components/nostr-picture"

import App from "./App"
import { pool } from "@nostr/gadgets/global"

declare module "solid-js" {
  namespace JSX {
    interface IntrinsicElements {
      "nostr-name": ComponentProps<"div"> & { "attr:pubkey": string }
      "nostr-picture": ComponentProps<"div"> & { "attr:pubkey": string }
      "replay-web-page": ComponentProps<"div"> & { "attr:source": string; "attr:url": string }
    }
  }
}

pool.trackRelays = true

const root = document.getElementById("root")

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error("root element not found")
}

render(() => <App />, root!)
