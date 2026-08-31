export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 px-6 text-center dark:bg-black">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        AI Customer Operations Platform
      </h1>
      <p className="max-w-md text-balance text-zinc-600 dark:text-zinc-400">
        Plataforma de atendimento B2B multi-tenant com classificação de tickets, busca semântica e
        um agente de IA orquestrando o fluxo de suporte. Em construção.
      </p>
    </div>
  );
}
