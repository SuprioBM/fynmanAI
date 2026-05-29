"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

type AuthSubmitButtonProps = {
	children: string;
	className?: string;
	pendingLabel?: string;
};

export function AuthSubmitButton({
	children,
	className,
	pendingLabel,
}: AuthSubmitButtonProps) {
	const { pending } = useFormStatus();

	return (
		<button
			type="submit"
			disabled={pending}
			className={cn(
				"w-full inline-flex items-center justify-center gap-2 rounded-lg text-label-md transition-all active:scale-[0.98] bg-primary-container text-on-primary-container hover:brightness-110 py-4 px-6 font-bold disabled:cursor-not-allowed disabled:opacity-70 mt-2 cursor-pointer",
				className,
			)}
		>
			{pending ? (pendingLabel ?? "Creating account...") : children}
		</button>
	);
}
