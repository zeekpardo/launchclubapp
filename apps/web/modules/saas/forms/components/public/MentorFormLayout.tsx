"use client";

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import { useState } from "react";
import type { PublicFormField } from "./FormFieldRenderer";
import { FormFieldRenderer } from "./FormFieldRenderer";
import { PublicFormSubmit } from "./PublicFormSubmit";

interface Site {
	id: string;
	name: string;
}

interface MentorFormLayoutProps {
	orgSlug: string;
	formSlug: string;
	formName: string;
	formDescription?: string | null;
	fields: PublicFormField[];
	sites: Site[];
	preselectedSiteId?: string;
}

export function MentorFormLayout({
	orgSlug,
	formSlug,
	formName,
	formDescription,
	fields,
	sites,
	preselectedSiteId,
}: MentorFormLayoutProps) {
	const [values, setValues] = useState<Record<string, string>>({});
	const [selectedSiteId, setSelectedSiteId] = useState(
		preselectedSiteId ?? "",
	);
	const [submitted, setSubmitted] = useState(false);

	const hasSiteSelector = fields.some((f) => f.type === "SITE_SELECTOR");
	const visibleFields = fields.filter((f) => f.type !== "SITE_SELECTOR");

	const handleChange = (fieldId: string, value: string) => {
		setValues((prev) => ({ ...prev, [fieldId]: value }));
	};

	if (submitted) {
		return (
			<div className="flex flex-col items-center gap-4 py-16 text-center">
				<div className="rounded-full bg-green-100 p-4">
					<svg
						className="size-10 text-green-600"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M5 13l4 4L19 7"
						/>
					</svg>
				</div>
				<div>
					<p className="text-2xl font-bold">Submitted!</p>
					<p className="mt-2 text-muted-foreground max-w-sm">
						Thank you for your interest. We will be in touch soon.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>{formName}</CardTitle>
					{formDescription && (
						<p className="text-sm text-muted-foreground">
							{formDescription}
						</p>
					)}
				</CardHeader>
				<CardContent className="space-y-4">
					{hasSiteSelector &&
						!preselectedSiteId &&
						sites.length > 0 && (
							<div className="space-y-1.5">
								<label
									className="text-sm font-medium"
									htmlFor="site-selector"
								>
									Site{" "}
									<span className="text-destructive">*</span>
								</label>
								<select
									id="site-selector"
									value={selectedSiteId}
									onChange={(e) =>
										setSelectedSiteId(e.target.value)
									}
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
								>
									<option value="">Select a site…</option>
									{sites.map((site) => (
										<option key={site.id} value={site.id}>
											{site.name}
										</option>
									))}
								</select>
							</div>
						)}

					{visibleFields.map((field) => (
						<FormFieldRenderer
							key={field.id}
							field={field}
							value={values[field.id] ?? ""}
							onChange={(val) => handleChange(field.id, val)}
						/>
					))}
				</CardContent>
			</Card>

			<PublicFormSubmit
				orgSlug={orgSlug}
				formSlug={formSlug}
				fields={values}
				siteId={
					hasSiteSelector && selectedSiteId
						? selectedSiteId
						: undefined
				}
				onSuccess={() => setSubmitted(true)}
			/>
		</div>
	);
}
