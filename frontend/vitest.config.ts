import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Teste pentru logica fara interfata (permisiuni, analiza proiectelor); ruleaza in Node, fara browser
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["src/**/*.test.ts"] },
});
