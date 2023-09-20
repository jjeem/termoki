import electron from "vite-plugin-electron";
import { notBundle } from "vite-plugin-electron/plugin";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { UserConfig } from "vite";

const config: UserConfig = {
  plugins: [
    electron([
      {
        entry: "src/main/index.ts",
        vite: {
          build: {
            outDir: "dist",
            rollupOptions: {
              plugins: [nodeResolve()],
              external: [/node_modules/],
              output: {
                entryFileNames: "index.js",
              },
            },
          },
          plugins: [notBundle({})],
        },
      },
      {
        entry: "src/preload/index.ts",
        vite: {
          build: {
            outDir: "dist",
            rollupOptions: {
              output: {
                entryFileNames: "preload.js",
              },
            },
          },
        },
      },
    ]),
  ],
};

export default config;
