import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { resolve } from "path";
import glsl from "vite-plugin-glsl";

const root = resolve(__dirname, ".");
const outDir = resolve(__dirname, "dist");

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact(), glsl()],
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
