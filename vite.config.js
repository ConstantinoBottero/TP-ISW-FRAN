import { defineConfig } from "vite";

export default defineConfig({
  server: {
    proxy: {
      "/resend": {
        target: "https://api.resend.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/resend/, ""),
      },
    },
  },
});
