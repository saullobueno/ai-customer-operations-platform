import { cn } from "@/lib/utils";

type Comment = {
  id: string;
  body: string;
  internal: boolean;
  createdAt: Date;
  authorUser: { name: string } | null;
  authorCustomer: { name: string } | null;
};

export function CommentThread({ comments }: { comments: Comment[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {comments.map((comment) => {
        const authorName =
          comment.authorUser?.name ?? comment.authorCustomer?.name ?? "Desconhecido";
        const isCustomer = Boolean(comment.authorCustomer);

        return (
          <li
            key={comment.id}
            className={cn(
              "rounded-lg border px-4 py-3 text-sm",
              comment.internal
                ? "border-yellow-500/40 bg-yellow-500/10"
                : isCustomer
                  ? "border-border bg-muted/50"
                  : "border-border bg-card",
            )}
          >
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                {authorName} {comment.internal && "· nota interna"}
              </span>
              <time dateTime={comment.createdAt.toISOString()}>
                {comment.createdAt.toLocaleString("pt-BR")}
              </time>
            </div>
            <p className="whitespace-pre-wrap">{comment.body}</p>
          </li>
        );
      })}
    </ul>
  );
}
