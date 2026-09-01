import Link from "next/link";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Criar conta</CardTitle>
          <CardDescription>Comece a atender seus clientes em minutos.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <SignUpForm />
          <p className="text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link href="/sign-in" className="text-foreground underline underline-offset-4">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
