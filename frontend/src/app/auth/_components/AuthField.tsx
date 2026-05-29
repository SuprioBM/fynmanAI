"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AuthFieldProps = {
	id: string;
	name: string;
	label: string;
	type?: React.HTMLInputTypeAttribute;
	placeholder?: string;
	autoComplete?: string;
	error?: string;
	leadingIcon?: ReactNode;
	actionSlot?: ReactNode;
	trailingSlot?: ReactNode;
	inputClassName?: string;
};

export function AuthField({
	id,
	name,
	label,
	type = "text",
	placeholder,
	autoComplete,
	error,
	actionSlot,
	trailingSlot,
	inputClassName,
}: AuthFieldProps) {
	return (
		<div className="flex flex-col gap-1 w-full">
			<div className="flex items-center justify-between gap-3 ml-1 mb-1">
				<label
					htmlFor={id}
					className="text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold"
				>
					{label}
				</label>
				{actionSlot ? <div className="shrink-0">{actionSlot}</div> : null}
			</div>
			<div className="relative w-full">
				<input
					id={id}
					name={name}
					type={type}
					placeholder={placeholder}
					autoComplete={autoComplete}
					className={cn(
						"w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface px-4 py-4 rounded-lg focus:outline-none focus:border-primary transition-colors text-body-md placeholder:opacity-50",
						trailingSlot ? "pr-12" : "",
						inputClassName,
					)}
				/>
				{trailingSlot ? (
					<div className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-70 hover:opacity-100 transition-opacity flex items-center justify-center">
						{trailingSlot}
					</div>
				) : null}
			</div>
			{error ? <p className="text-sm text-error mt-1 ml-1">{error}</p> : null}
		</div>
	);
}
