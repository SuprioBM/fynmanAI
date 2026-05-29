import Link from "next/link";
import type { FormEvent } from "react";
import BrandHeader from "../../_components/BrandHeader";
import AuthCard from "../../_components/AuthCard";
import SupportLinks from "../../_components/SupportLinks";
import SystemFooter from "../../_components/SystemFooter";

type ForgotPasswordCardProps = {
	email: string;
	onEmailChange: (value: string) => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ForgotPasswordCard({
	email,
	onEmailChange,
	onSubmit,
}: ForgotPasswordCardProps) {
	return (
		<>
			<BrandHeader />
			<AuthCard>
				<div className="mb-6 inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-label-sm font-semibold uppercase tracking-[0.2em] text-primary w-fit mx-auto self-center">
					Password Recovery
				</div>

				<h2 className="mb-3 text-headline-md font-bold tracking-tight text-on-surface text-center">
					Forgot Password
				</h2>
				<p className="mb-6 text-body-md leading-relaxed text-on-surface-variant text-center opacity-70">
					Enter your email and we&apos;ll send you a link to reset your password.
				</p>

				<form className="flex flex-col gap-4 w-full" onSubmit={onSubmit}>
					<div className="flex flex-col gap-1 w-full">
						<label
							htmlFor="email"
							className="text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold ml-1 mb-1"
						>
							Email Address
						</label>
						<input
							id="email"
							type="email"
							required
							value={email}
							onChange={(event) => onEmailChange(event.target.value)}
							placeholder="alex@example.com"
							className="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface px-4 py-4 rounded-lg focus:outline-none focus:border-primary transition-colors text-body-md placeholder:opacity-50"
						/>
					</div>

					<button
						type="submit"
						className="w-full inline-flex items-center justify-center gap-2 rounded-lg text-label-md transition-all active:scale-[0.98] bg-primary-container text-on-primary-container hover:brightness-110 py-4 px-6 font-bold cursor-pointer border-0 mt-2"
					>
						Send Reset Link
					</button>
				</form>

				<Link
					href="/auth/signin"
					className="w-full inline-flex items-center justify-center gap-2 rounded-lg text-label-md transition-all active:scale-[0.98] border border-outline-variant text-on-surface-variant hover:border-primary hover:text-on-surface py-4 px-6 no-underline mt-4 cursor-pointer"
				>
					Back to Sign In
				</Link>

				<SupportLinks />
			</AuthCard>
			<SystemFooter />
		</>
	);
}
