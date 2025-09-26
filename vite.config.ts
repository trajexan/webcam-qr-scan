import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  //plugins: [react()],
  base: "/webcam-qr-scan",
  //base: command === "build" ? "/webcam-qr-scan" : "/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Conditional base: empty for dev, "/webcam-qr-scan" for build
  //base: command === "build" ? "/webcam-qr-scan" : "/",
}));