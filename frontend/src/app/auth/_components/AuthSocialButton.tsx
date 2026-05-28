import Image from "next/image";

type AuthSocialButtonProps = {
	href: string;
	label: string;
};

const googleIconUrl =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCmZqKjXF7KvRqvZ-mxe1gKoQjnXqT7ySrBiTKxfn4hYmpvxJcLjl65b47sq-V20LMaYrU5HYt9VFVx-ZIHzKRAgHpYyKA-tPCTtSXDOayLuZKSUo3LBWvoNPsbal5LQ6XvUbn3Hs4FWoiCODDdiiPCAc_ietShdIEqayd3jr7sQeVybbfJV037OxGvDKVNpNIWVQVQnrFaoKgr3ZfGKC4LyHs5NVV_mwK8Q177G2zpRC6oyfIOzmHIFMH7oVJrPr4oKw9CCaMr33bQ";

export function AuthSocialButton({ href, label }: AuthSocialButtonProps) {
	return (
		<a
			href={href}
			className="w-full inline-flex items-center justify-center gap-2 rounded-lg text-label-md transition-all active:scale-[0.98] border border-outline-variant text-on-surface-variant hover:border-primary hover:text-on-surface py-4 px-6 no-underline"
		>
			<Image
				src={googleIconUrl}
				alt="Google Logo"
				width={16}
				height={16}
				className="w-4 h-4 grayscale opacity-70"
			/>
			{label}
		</a>
	);
}
