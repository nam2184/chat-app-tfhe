import { defineConfig } from "@kubb/core";
import { pluginZod } from "@kubb/plugin-zod";
import { pluginOas } from "@kubb/plugin-oas";
import { pluginTs } from "@kubb/plugin-ts";
import { pluginReactQuery } from "@kubb/plugin-react-query";

export default defineConfig([
  {
    root: ".",
    input: {
      path: "./schema.json",
    },
    output: {
      path: "src/lib/kubb",
      extension: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ".ts": "" as any,
      },
      clean: true,
      write: true,
    },
    plugins: [
      pluginZod(),
      pluginOas({}),
      pluginTs({}),
      pluginReactQuery({
        client: {
          importPath: "@/lib/authorized-client",
        },
        suspense: {},
      }),
    ],
  },
  {
    root: ".",
    input: {
      path: "./he-schema.json",
    },
    output: {
      path: "src/lib/kubb-he",
      extension: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ".ts": "" as any,
      },
      clean: true,
      write: true,
    },
    plugins: [
      pluginZod(),
      pluginOas({}),
      pluginTs({}),
      pluginReactQuery({
        client: {
          importPath: "@/lib/authorized-client2",
        },
        suspense: {},
      }),
    ],
  }
  ]);

