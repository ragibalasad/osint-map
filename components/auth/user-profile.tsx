"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export function UserProfile() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="h-10 w-32 animate-pulse bg-muted rounded-full" />
    );
  }

  if (!session) {
    return (
      <Button asChild variant="default" className="rounded-full px-6 transition-all hover:scale-105 active:scale-95">
        <Link href="/auth/sign-in">Sign In</Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-4 p-1 pr-4 bg-secondary/50 rounded-full border border-border/50 backdrop-blur-sm">
      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground overflow-hidden">
        {session.user.image ? (
          <Image src={session.user.image} alt={session.user.name} width={32} height={32} className="w-full h-full object-cover" />
        ) : (
          <UserIcon className="w-4 h-4" />
        )}
      </div>

      <div className="flex flex-col">
        <span className="text-sm font-semibold truncate max-w-[120px]">
          {session.user.name}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
        onClick={() => authClient.signOut()}
      >
        <LogOut className="w-4 h-4" />
      </Button>
    </div>
  );
}
