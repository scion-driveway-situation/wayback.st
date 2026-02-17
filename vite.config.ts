import { defineConfig } from "vite"
import solid from "vite-plugin-solid"
import tailwindcss from "@tailwindcss/vite"
import fs from "fs"

export default defineConfig({
  plugins: [solid(), tailwindcss()],
  server: {
    port: 3000,
    https: {
      key: fs.readFileSync("./localhost-key.pem"),
      cert: fs.readFileSync("./localhost-cert.pem")
    }
  },
  build: {
    target: "esnext"
  }
})
