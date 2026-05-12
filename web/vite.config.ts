import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Bind IPv4 loopback so http://127.0.0.1:5173 works (matches README + default
    // WEB_ORIGIN). Node/Vite may otherwise listen only on ::1, which refuses IPv4.
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
      },
    },
  },
});
