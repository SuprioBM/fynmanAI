type VerificationCodeCardProps = {
	code: string[];
	onChangeDigit: (value: string, idx: number) => void;
	onKeyDownDigit: (
		event: React.KeyboardEvent<HTMLInputElement>,
		idx: number,
	) => void;
	setInputRef: (element: HTMLInputElement | null, index: number) => void;
	onSubmit: (token: string) => void;
};

export function VerificationCodeCard({
	code,
	onChangeDigit,
	onKeyDownDigit,
	setInputRef,
	onSubmit,
}: VerificationCodeCardProps) {
	return (
		<div className="w-full flex flex-col items-center">
			<p className="mb-5 text-center text-label-sm uppercase tracking-widest text-on-surface-variant opacity-70">
				Or enter code manually
			</p>

			<div className="mb-6 flex justify-center gap-2 w-full">
				{code.map((digit, index) => (
					<input
						key={index}
						ref={(element) => setInputRef(element, index)}
						type="text"
						inputMode="numeric"
						maxLength={1}
						value={digit}
						onChange={(event) => onChangeDigit(event.target.value, index)}
						onKeyDown={(event) => onKeyDownDigit(event, index)}
						className="h-14 w-12 rounded-lg text-center text-lg font-semibold text-on-surface bg-surface-container-lowest border border-outline-variant/30 focus:outline-none focus:border-primary transition-colors"
					/>
				))}
			</div>

			<button
				type="button"
				onClick={() => onSubmit(code.join(""))}
				disabled={code.some((d) => d === "")}
				className="w-full inline-flex items-center justify-center gap-2 rounded-lg text-label-md transition-all active:scale-[0.98] bg-primary-container text-on-primary-container hover:brightness-110 py-4 px-6 font-bold cursor-pointer border-0 mt-2 disabled:cursor-not-allowed disabled:opacity-60 mb-6"
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
				</svg>
				Verify Account
			</button>

			<p className="text-center text-label-md text-on-surface-variant opacity-80">
				Didn&apos;t receive the email?{" "}
				<a href="#" className="text-primary font-semibold transition-colors hover:underline no-underline ml-1">
					Resend Email
				</a>
			</p>
		</div>
	);
}
