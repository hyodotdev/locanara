import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const ReactCompilerConfig = {
  target: "18",
};

console.log("\n🚀 Starting Locanara Docs [COMMUNITY]\n");

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ["babel-plugin-react-compiler", ReactCompilerConfig],
          ["module:@preact/signals-react-transform"],
        ],
      },
    }),
  ],
});
