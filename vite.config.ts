import { defineConfig } from "vite"
import solid from "vite-plugin-solid"
import tailwindcss from "@tailwindcss/vite"
import { existsSync, readFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, resolve } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const certPath = resolve(__dirname, "localhost-cert.pem")
const keyPath = resolve(__dirname, "localhost-key.pem")

const httpsConfig =
  existsSync(certPath) && existsSync(keyPath)
    ? {
        key: readFileSync(keyPath),
        cert: readFileSync(certPath)
      }
    : undefined

export default defineConfig({
  plugins: [solid(), tailwindcss()],
  server: {
    port: 3000,
    https: httpsConfig
  },
  build: {
    target: "esnext"
  }
})
