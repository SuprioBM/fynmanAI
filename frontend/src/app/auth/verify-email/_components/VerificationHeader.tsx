type VerificationHeaderProps = {
	userEmail: string;
};

export function VerificationHeader({ userEmail }: VerificationHeaderProps) {
	return (
		<div className="flex flex-col items-center w-full">
			<div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-primary/20 bg-primary/10 shadow-none">
				<svg
					width="36"
					height="36"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2.0"
					strokeLinecap="round"
					strokeLinejoin="round"
					className="text-primary"
				>
					<rect width="20" height="16" x="2" y="4" rx="2" />
					<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
				</svg>
			</div>

			<h2 className="mb-3 text-headline-md font-bold tracking-tight text-on-surface text-center">
				Check your inbox
			</h2>
			<p className="mb-8 max-w-md text-center text-body-md leading-relaxed text-on-surface-variant opacity-80">
				Verification link sent to{" "}
				<span className="text-primary font-semibold">{userEmail}</span>
			</p>
		</div>
	);
}
