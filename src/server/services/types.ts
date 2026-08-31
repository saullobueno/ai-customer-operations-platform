import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type * as schema from "@/server/db/schema";

/**
 * Tipo comum entre o client real (postgres-js) e o client de teste
 * (PGlite) — ambos estendem PgDatabase. Permite injetar qualquer um dos
 * dois nas funções de serviço.
 */
export type AppDatabase = PgDatabase<PgQueryResultHKT, typeof schema>;
