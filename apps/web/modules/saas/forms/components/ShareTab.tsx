"use client";

import { Input } from "@repo/ui/components/input";
import { Switch } from "@repo/ui/components/switch";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { CopyButton } from "@shared/components/CopyButton";
import { useUpdateForm } from "@saas/forms/hooks/use-forms";

const origin = typeof window !== "undefined" ? window.location.origin : "";

interface AssignedSite {
	siteId: string;
	site: { id: string; name: string; slug: string };
}

interface ShareTabProps {
	formId: string;
	form: { slug: string; status: string; formSites: AssignedSite[] };
	orgSlug: string;
}

export function ShareTab({ formId, form, orgSlug }: ShareTabProps) {
	const updateForm = useUpdateForm(formId);

	const handleTogglePublish = async () => {
		const newStatus = form.status === "PUBLISHED" ? "UNPUBLISHED" : "PUBLISHED";
		try {
			await updateForm.mutateAsync({ formId, status: newStatus });
			toastSuccess(newStatus === "PUBLISHED" ? "Form published." : "Form unpublished.");
		} catch {
			toastError("Failed to update form status.");
		}
	};

	return (
		<div className="max-w-2xl space-y-6">
			<div className="rounded-lg border bg-card p-6 space-y-4">
				<h3 className="font-semibold">Publish</h3>
				<div className="flex items-center justify-between">
					<div>
						<p className="text-sm font-medium">
							{form.status === "PUBLISHED" ? "Form is published" : "Form is unpublished"}
						</p>
						<p className="text-xs text-muted-foreground mt-0.5">
							{form.status === "PUBLISHED"
								? "The form is publicly accessible."
								: "The form is not accessible to the public."}
						</p>
					</div>
					<Switch
						checked={form.status === "PUBLISHED"}
						onCheckedChange={handleTogglePublish}
						disabled={updateForm.isPending}
					/>
				</div>
			</div>

			<ShareLinksSection form={form} orgSlug={orgSlug} />
		</div>
	);
}

function ShareLinksSection({
	form,
	orgSlug,
}: {
	form: { slug: string; status: string; formSites: AssignedSite[] };
	orgSlug: string;
}) {
	const assignedSites = form.formSites;

	return (
		<div className="rounded-lg border bg-card p-6 space-y-4">
			<div>
				<h3 className="font-semibold">Share Links</h3>
				<p className="mt-1 text-sm text-muted-foreground">
					Each assigned site gets its own shareable link. Share the link for the site you want applicants to register at.
				</p>
			</div>

			{form.status === "UNPUBLISHED" && (
				<p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2">
					Publish the form first so applicants can access these links.
				</p>
			)}

			{assignedSites.length === 0 ? (
				<p className="text-sm text-muted-foreground">
					No sites assigned yet. Add sites above to generate shareable links.
				</p>
			) : (
				<div className="space-y-4">
					{assignedSites.map(({ site }) => {
						const url =
							assignedSites.length === 1
								? `${origin}/apply/${orgSlug}/forms/${form.slug}`
								: `${origin}/apply/${orgSlug}/forms/${form.slug}?site=${site.slug}`;
						return (
							<div key={site.id} className="space-y-1.5">
								<p className="text-sm font-medium">{site.name}</p>
								<div className="flex items-center gap-2">
									<Input readOnly value={url} className="font-mono text-xs" />
									<CopyButton url={url} />
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
