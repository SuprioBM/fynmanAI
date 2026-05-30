"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth/AuthContext";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/auth/signin");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <>{children}</>; // ← render children anyway, just don't redirect yet
  }

  if (!user) {
    return null; // ← only blank out when we KNOW they're logged out
  }

  return <>{children}</>;
}