"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@repo/auth/client";
import { config as authConfig } from "@repo/auth/config";
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { useAuthErrorMessages } from "@saas/auth/hooks/errors-messages";
import { sessionQueryKey } from "@saas/auth/lib/api";
import { OrganizationInvitationAlert } from "@saas/organizations/components/OrganizationInvitationAlert";
import { useQueryClient } from "@tanstack/react-query";
import {
	AlertTriangleIcon,
	ArrowRightIcon,
	EyeIcon,
	EyeOffIcon,
	MailboxIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { withQuery } from "ufo";
import { z } from "zod";
import { config } from "@/config";
import { useSession } from "@/modules/saas/auth/hooks/use-session";
import {
	type OAuthProvider,
	oAuthProviders,
} from "../constants/oauth-providers";
import { SocialSigninButton } from "./SocialSigninButton";

const formSchema = z.object({
	email: z.string().email(),
	name: z.string().min(1),
	password: z.string(),
});

export function SignupForm({ prefillEmail }: { prefillEmail?: string }) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const { user, loaded: sessionLoaded } = useSession();
	const { getAuthErrorMessage } = useAuthErrorMessages();
	const searchParams = useSearchParams();

	const [showPassword, setShowPassword] = useState(false);
	const invitationId = searchParams.get("invitationId");
	const email = searchParams.get("email");
	const redirectTo = searchParams.get("redirectTo");

	const form = useForm({
		resolver: zodResolver(formSchema),
		values: {
			name: "",
			email: prefillEmail ?? email ?? "",
			password: "",
		},
	});

	const redirectPath = invitationId
		? `/organization-invitation/${invitationId}`
		: (redirectTo ?? config.saas.redirectAfterSignIn);

	useEffect(() => {
		if (sessionLoaded && user) {
			router.replace(redirectPath);
		}
	}, [user, sessionLoaded]);

	const onSubmit = form.handleSubmit(async ({ email, password, name }) => {
		try {
			if (authConfig.enablePasswordLogin) {
				const { error: signUpError } = await authClient.signUp.email({
					email,
					password,
					name,
					callbackURL: redirectPath,
				});

				if (signUpError) {
					throw signUpError;
				}

				// Invited users: open-signup mode disables `autoSignIn`, so a
				// fresh signup has no session. Try to sign them straight in and
				// route them to the invitation page to join the org.
				//
				// In production `requireEmailVerification` blocks sign-in until
				// the email is verified — that's intentional: it proves the
				// invitee controls the inbox. The signUp call above already sent
				// a verification email whose callbackURL is this invitation page,
				// so when sign-in is blocked we simply show the "check your
				// email" state; verifying from their inbox lands them on the
				// acceptance page. We must NOT auto-verify on the inviter's
				// say-so, or anyone could create a verified account on an
				// invited address they don't own.
				if (invitationId) {
					const { error: signInError } =
						await authClient.signIn.email({ email, password });

					if (!signInError) {
						await queryClient.invalidateQueries({
							queryKey: sessionQueryKey,
						});
						router.replace(redirectPath);
					}
					// On signInError (verification required), fall through to the
					// "verify your email" success state below.
					return;
				}
			} else {
				const { error } = await authClient.signIn.magicLink({
					email,
					name,
					callbackURL: redirectPath,
				});

				if (error) {
					throw error;
				}
			}
		} catch (e) {
			form.setError("root", {
				message: getAuthErrorMessage(
					e && typeof e === "object" && "code" in e
						? (e.code as string)
						: undefined,
				),
			});
		}
	});

	return (
		<div>
			<h1 className="font-bold text-xl md:text-2xl">
				{t("auth.signup.title")}
			</h1>
			<p className="mt-1 mb-6 text-foreground/60">
				{t("auth.signup.message")}
			</p>

			{form.formState.isSubmitSuccessful ? (
				<Alert variant="success">
					<MailboxIcon />
					<AlertTitle>
						{t("auth.signup.hints.verifyEmail")}
					</AlertTitle>
				</Alert>
			) : (
				<>
					{invitationId && (
						<OrganizationInvitationAlert className="mb-6" />
					)}

					<Form {...form}>
						<form
							className="flex flex-col items-stretch gap-4"
							onSubmit={onSubmit}
						>
							{form.formState.isSubmitted &&
								form.formState.errors.root && (
									<Alert variant="error">
										<AlertTriangleIcon />
										<AlertDescription>
											{form.formState.errors.root.message}
										</AlertDescription>
									</Alert>
								)}

							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("auth.signup.name")}
										</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("auth.signup.email")}
										</FormLabel>
										<FormControl>
											<Input
												{...field}
												autoComplete="email"
												readOnly={!!prefillEmail}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{authConfig.enablePasswordLogin && (
								<FormField
									control={form.control}
									name="password"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t("auth.signup.password")}
											</FormLabel>
											<FormControl>
												<div className="relative">
													<Input
														type={
															showPassword
																? "text"
																: "password"
														}
														className="pr-10"
														{...field}
														autoComplete="new-password"
													/>
													<button
														type="button"
														onClick={() =>
															setShowPassword(
																!showPassword,
															)
														}
														className="absolute inset-y-0 right-0 flex items-center pr-4 text-primary text-xl"
													>
														{showPassword ? (
															<EyeOffIcon className="size-4" />
														) : (
															<EyeIcon className="size-4" />
														)}
													</button>
												</div>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}

							<Button
								variant="primary"
								loading={form.formState.isSubmitting}
							>
								{t("auth.signup.submit")}
							</Button>
						</form>
					</Form>

					{authConfig.enableSignup &&
						authConfig.enableSocialLogin && (
							<>
								<div className="relative my-6 h-4">
									<hr className="relative top-2" />
									<p className="-translate-x-1/2 absolute top-0 left-1/2 mx-auto inline-block h-4 bg-card px-2 text-center font-medium text-foreground/60 text-sm leading-tight">
										{t("auth.login.continueWith")}
									</p>
								</div>

								<div className="grid grid-cols-1 items-stretch gap-2 sm:grid-cols-2">
									{Object.keys(oAuthProviders).map(
										(providerId) => (
											<SocialSigninButton
												key={providerId}
												provider={
													providerId as OAuthProvider
												}
											/>
										),
									)}
								</div>
							</>
						)}
				</>
			)}

			<div className="mt-6 text-center text-sm">
				<span className="text-foreground/60">
					{t("auth.signup.alreadyHaveAccount")}{" "}
				</span>
				<Link
					href={withQuery(
						"/auth/login",
						Object.fromEntries(searchParams.entries()),
					)}
				>
					{t("auth.signup.signIn")}
					<ArrowRightIcon className="ml-1 inline size-4 align-middle" />
				</Link>
			</div>
		</div>
	);
}
