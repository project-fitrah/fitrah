"use client";

import { useEffect, useActionState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutAction, signOutInitialState } from "@/app/actions/sign-out";

type SignOutButtonProps = {
  className?: string;
};

export function SignOutButton({ className }: SignOutButtonProps) {
  const [state, formAction, isPending] = useActionState(signOutAction, signOutInitialState);

  useEffect(() => {
    if (state.success) {
      window.location.replace("/login");
    }
  }, [state.success]);

  return (
    <form action={formAction}>
      <Button type="submit" variant="outline" className={className} disabled={isPending}>
        <LogOut className="mr-2 h-4 w-4" />
        {isPending ? "Uitloggen..." : "Uitloggen"}
      </Button>
      {state.error ? <p className="sr-only">{state.error}</p> : null}
    </form>
  );
}
