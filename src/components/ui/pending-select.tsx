"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

export function PendingSelect({ className, disabled, ...props }: React.ComponentProps<"select">) {
  const { pending } = useFormStatus();

  return (
    <select
      disabled={pending || disabled}
      className={cn(className, pending && "opacity-60")}
      {...props}
    />
  );
}
