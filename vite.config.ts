import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // allow both localhost and your ngrok tunnel
    allowedHosts: ["localhost", "127.0.0.1", "52a1-188-163-49-155.ngrok-free.app"],
    // (optional) if you need to expose vite on a specific port/IP:
    // host: true,          // listen on all interfaces
    // port: 5173,          // or any port you like
  },
});