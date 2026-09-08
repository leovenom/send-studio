import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { getDatabaseConfig } from "./config";
import * as schema from "./schema";

const { url, authToken } = getDatabaseConfig();

const client = createClient({
  url,
  authToken,
});

export const db = drizzle(client, { schema });
