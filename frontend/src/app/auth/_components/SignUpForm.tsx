"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { BACKEND_URL } from "@/constants/constants";
import { signUp } from "@/lib/auth/auth";

import { AuthField } from "./AuthField";
import { AuthSocialButton } from "./AuthSocialButton";
import { AuthSubmitButton } from "./AuthSubmitButton";
import BrandHeader from "./BrandHeader";
import AuthCard from "./AuthCard";
import SupportLinks from "./SupportLinks";
import SystemFooter from "./SystemFooter";
import Divider from "./Divider";

export default function SignUpForm() {
	const [state, action] = useActionState(signUp, undefined);
	const [showPassword, setShowPassword] = useState(false);

	return (
		<>
			<BrandHeader />
			<AuthCard>
				<form action={action} className="flex flex-col gap-4 w-full">
					{state?.message ? (
						<p className="rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error mb-2">
							{state.message}
						</p>
					) : null}

					<div className="flex flex-col gap-4">
						<AuthField
							id="name"
							name="name"
							label="Full Name"
							placeholder="Enter your full name"
							autoComplete="name"
							error={state?.error?.name?.[0]}
						/>

						<AuthField
							id="email"
							name="email"
							label="Email"
							placeholder="name@example.com"
							autoComplete="email"
							error={state?.error?.email?.[0]}
						/>

						<AuthField
							id="password"
							name="password"
							label="Password"
							type={showPassword ? "text" : "password"}
							placeholder="••••••••"
							autoComplete="new-password"
							trailingSlot={
								<button
									type="button"
									onClick={() => setShowPassword((prev) => !prev)}
									className="text-[#928ea1] transition-colors hover:text-white flex items-center justify-center cursor-pointer border-0 bg-transparent"
									aria-label={showPassword ? "Hide password" : "Show password"}
								>
									<svg
										width="18"
										height="18"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
										aria-hidden="true"
									>
										{showPassword ? (
											<>
												<path d="M3 3l18 18" />
												<path d="M10.58 10.58a2 2 0 1 0 2.83 2.83" />
												<path d="M9.88 5.09A10.94 10.94 0 0 1 12 5c6 0 10 7 10 7a18.15 18.15 0 0 1-3.12 3.88" />
												<path d="M6.61 6.61A17.7 17.7 0 0 0 2 12s4 7 10 7a10.9 10.9 0 0 0 5.39-1.39" />
											</>
										) : (
											<>
												<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
												<circle cx="12" cy="12" r="3" />
											</>
										)}
									</svg>
								</button>
							}
							error={state?.error?.password?.[0]}
						/>

						<AuthSubmitButton pendingLabel="Creating account...">
							Create Account
						</AuthSubmitButton>
					</div>

					<Divider label="or" />

					<AuthSocialButton
						href={`${BACKEND_URL}/api/auth/google`}
						label="Sign up with Google"
					/>
				</form>
				
				<div className="mt-6 text-center">
					<p className="text-label-md text-on-surface-variant">
						Already have an account?{" "}
						<Link
							href="/auth/signin"
							className="ml-1 font-bold text-primary transition-colors hover:underline no-underline"
						>
							Sign In
						</Link>
					</p>
				</div>

				<SupportLinks />
			</AuthCard>
			<SystemFooter />
		</>
	);
}
