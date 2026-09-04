import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://view1.kr",
  output: "static",
  build: {
    format: "directory",
  },
});
