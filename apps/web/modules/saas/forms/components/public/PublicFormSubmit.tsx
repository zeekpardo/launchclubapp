"use client";

import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardTitle } from "@repo/ui/components/card";
import { orpcClient } from "@shared/lib/orpc-client";
import { CheckCircleIcon, LoaderIcon } from "lucide-react";
import { useState } from "react";

interface PublicFormSubmitProps {
	orgSlug: string;
	formSlug: string;
	/** For MENTOR forms: flat field values keyed by form field ID */
	fields?: Record<string, string>;
	/** For STUDENT forms: parent field values keyed by form field ID */
	parentFields?: Record<string, string>;
	/** For STUDENT forms: per-student field values keyed by form field ID */
	students?: Record<string, string>[];
	/** The selected site ID (optional — falls back to the form's first site) */
	siteId?: string;
	onSuccess?: () => void;
}

export function PublicFormSubmit({
	orgSlug,
	formSlug,
	fields,
	parentFields,
	students,
	siteId,
	onSuccess,
}: PublicFormSubmitProps) {
	const [submitting, setSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async () => {
		setSubmitting(true);
		setError(null);
		try {
			await orpcClient.forms.publicSubmit({
				orgSlug,
				formSlug,
				fields,
				parentFields,
				students,
				siteId,
			});
			setSubmitted(true);
			onSuccess?.();
		} catch (err: unknown) {
			const message = (err as { message?: string })?.message;
			setError(message ?? "Something went wrong. Please try again.");
		} finally {
			setSubmitting(false);
		}
	};

	if (submitted) {
		return (
			<Card>
				<CardContent className="flex flex-col items-center gap-4 py-16 text-center">
					<CheckCircleIcon className="size-14 text-green-500" />
					<div>
						<CardTitle className="text-2xl">Submitted!</CardTitle>
						<p className="mt-2 text-muted-foreground max-w-sm">
							Thank you for submitting. We will be in touch soon.
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-3">
			{error && (
				<p className="text-sm text-destructive text-center">{error}</p>
			)}
			<div className="flex justify-center">
				<Button
					type="button"
					size="lg"
					className="px-12"
					disabled={submitting}
					onClick={handleSubmit}
				>
					{submitting ? (
						<>
							<LoaderIcon className="mr-2 size-4 animate-spin" />
							Submitting…
						</>
					) : (
						"Submit"
					)}
				</Button>
			</div>
		</div>
	);
}
