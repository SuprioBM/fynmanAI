import type { ReactNode } from "react";

export default function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="bg-surface-container-low border border-surface-variant p-6 rounded-lg shadow-none w-full">
      {children}
    </div>
  );
}
