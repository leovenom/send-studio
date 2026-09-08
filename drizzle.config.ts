import { defineConfig } from "drizzle-kit";
import { getDatabaseConfig } from "./src/lib/db/config";

const { url } = getDatabaseConfig();

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url,
  },
});
