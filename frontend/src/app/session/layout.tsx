import type { ReactNode } from "react";

import SessionShellClient from "@/app/session/_components/SessionShellClient";

export default function SessionLayout({ children }: { children: ReactNode }) {
  return <SessionShellClient>{children}</SessionShellClient>;
}
