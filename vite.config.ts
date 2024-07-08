import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { resolve } from "path";

const root = resolve(__dirname, ".");
const outDir = resolve(__dirname, "dist");

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact()],
  root,
  build: {
    outDir,
    rollupOptions: {
      input: {
        main: resolve(root, "index.html"),
        "001": resolve(root, "001", "index.html"),
        "005": resolve(root, "005", "index.html"),
      },
    },
  },
});
