type PasswordRequirementItemProps = {
	met: boolean;
	text: string;
};

export function PasswordRequirementItem({
	met,
	text,
}: PasswordRequirementItemProps) {
	return (
		<div className="flex items-center gap-2 text-label-sm text-on-surface-variant opacity-80">
			<span
				className={`flex h-4 w-4 items-center justify-center rounded-full border transition-all ${
					met
						? "border-primary bg-primary/20 text-primary"
						: "border-outline-variant/30 text-on-surface-variant/30"
				}`}
			>
				{met && (
					<svg
						width="10"
						height="10"
						viewBox="0 0 16 16"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M3.5 8.5L6.5 11.5L12.5 5.5"
							stroke="currentColor"
							strokeWidth="2.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				)}
			</span>
			{text}
		</div>
	);
}
