import IORedis from "ioredis";
import { env } from "@/lib/env";

/**
 * `lazyConnect: true` — importar este módulo não abre conexão nenhuma.
 * Só conecta no primeiro comando real (enqueue ou o worker iniciando).
 * Isso evita que build/testes que nunca usam fila precisem de Redis de pé
 * (mesmo raciocínio do PGlite para Postgres — ver ADR 0003).
 */
export function createQueueConnection() {
  return new IORedis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: null,
  });
}
