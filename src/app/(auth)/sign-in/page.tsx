import Link from "next/link";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
          <CardDescription>
            Acesse sua organização na AI Customer Operations Platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <SignInForm />
          <p className="text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link href="/sign-up" className="text-foreground underline underline-offset-4">
              Criar conta
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
