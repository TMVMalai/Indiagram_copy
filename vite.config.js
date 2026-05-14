import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/users": "http://localhost:3000",
      "/posts": "http://localhost:3000",
      "/stories": "http://localhost:3000",
      "/reels": "http://localhost:3000",
      "/conversations": "http://localhost:3000",
      "/notifications": "http://localhost:3000",
      "/reposts": "http://localhost:3000",
      "/suggestions": "http://localhost:3000"
    }
  }
});