import type { ReactNode } from "react";

type AuthPageShellProps = {
	children: ReactNode;
};

export function AuthPageShell({ children }: AuthPageShellProps) {
	return (
		<div className="w-full flex flex-col items-center justify-center">
			{children}
		</div>
	);
}
