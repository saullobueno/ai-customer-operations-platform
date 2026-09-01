import { redirect } from "next/navigation";
import { getCurrentSession } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { listKnowledgeArticles } from "@/server/services/knowledge-base";
import { createKnowledgeArticleAction } from "@/server/actions/knowledge-base";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default async function KnowledgeBasePage() {
  const session = await getCurrentSession();
  if (!session?.session.activeOrganizationId) redirect("/sign-in");

  const articles = await listKnowledgeArticles(db, session.session.activeOrganizationId);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Base de conhecimento</h1>
        <p className="text-sm text-muted-foreground">
          Artigos usados pelo agente de IA para embasar respostas sugeridas (RAG via busca textual —
          ver docs/decisions/0008-rag-full-text-search.md).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Novo artigo</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createKnowledgeArticleAction} className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="content">Conteúdo</Label>
              <textarea
                id="content"
                name="content"
                required
                rows={4}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            </div>
            <Button type="submit" className="self-start">
              Adicionar
            </Button>
          </form>
        </CardContent>
      </Card>

      <ul className="flex flex-col gap-3">
        {articles.map((article) => (
          <li key={article.id}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{article.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {article.content}
                </p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
