import { defineConfig, splitVendorChunkPlugin } from 'vite'
import path from "path";
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
      react(),
      splitVendorChunkPlugin(),
      tsconfigPaths(),
    ],
  define: {
    global: "globalThis",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
})
