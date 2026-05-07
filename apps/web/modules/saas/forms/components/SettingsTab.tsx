"use client";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Textarea } from "@repo/ui/components/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@repo/ui/components/alert-dialog";
import { useAssignSites, useSoftDeleteForm, useUpdateForm } from "@saas/forms/hooks/use-forms";
import { useSites } from "@saas/sites/hooks/use-sites";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface FormSnapshot {
	name: string;
	description?: string | null;
	formSites: { siteId: string }[];
}

interface SettingsTabProps {
	formId: string;
	form: FormSnapshot;
	orgSlug: string;
}

export function SettingsTab({ formId, form, orgSlug }: SettingsTabProps) {
	const router = useRouter();
	const { data: sites = [] } = useSites();
	const updateForm = useUpdateForm(formId);
	const assignSites = useAssignSites(formId);
	const softDelete = useSoftDeleteForm();

	const [name, setName] = useState(form.name);
	const [description, setDescription] = useState(form.description ?? "");
	const [siteIds, setSiteIds] = useState<string[]>(form.formSites.map((fs) => fs.siteId));
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	// Re-sync when form reloads (e.g. after a save from another tab)
	useEffect(() => {
		setName(form.name);
		setDescription(form.description ?? "");
		setSiteIds(form.formSites.map((fs) => fs.siteId));
	}, [form]);

	const handleSave = async () => {
		try {
			await updateForm.mutateAsync({ formId, name, description: description || undefined });
			toastSuccess("Settings saved.");
		} catch {
			toastError("Failed to save settings.");
		}
	};

	const handleSiteToggle = async (siteId: string) => {
		const newIds = siteIds.includes(siteId)
			? siteIds.filter((id) => id !== siteId)
			: [...siteIds, siteId];
		setSiteIds(newIds);
		try {
			await assignSites.mutateAsync({ formId, siteIds: newIds });
		} catch {
			toastError("Failed to update site assignment.");
		}
	};

	const handleDelete = async () => {
		try {
			await softDelete.mutateAsync({ formId });
			router.push(`/app/${orgSlug}/forms`);
		} catch {
			toastError("Failed to delete form.");
		}
	};

	return (
		<div className="max-w-xl space-y-6">
			<div className="rounded-lg border bg-card p-6 space-y-4">
				<h3 className="font-semibold">General</h3>

				<div className="space-y-1.5">
					<Label htmlFor="form-name">Form Name</Label>
					<Input id="form-name" value={name} onChange={(e) => setName(e.target.value)} />
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="form-description">Description</Label>
					<Textarea
						id="form-description"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						rows={3}
						placeholder="Optional description shown on the public form"
					/>
				</div>

				<Button onClick={handleSave} disabled={updateForm.isPending}>
					{updateForm.isPending ? "Saving…" : "Save Changes"}
				</Button>
			</div>

			<div className="rounded-lg border bg-card p-6 space-y-4">
				<h3 className="font-semibold">Sites</h3>
				<p className="text-sm text-muted-foreground">Select which sites this form is assigned to.</p>
				{sites.length === 0 ? (
					<p className="text-sm text-muted-foreground">No sites available.</p>
				) : (
					<div className="space-y-2">
						{sites.map((site: { id: string; name: string }) => (
							<label
								key={site.id}
								className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-muted"
							>
								<input
									type="checkbox"
									className="size-4 rounded border-border"
									checked={siteIds.includes(site.id)}
									onChange={() => handleSiteToggle(site.id)}
								/>
								<span className="text-sm">{site.name}</span>
							</label>
						))}
					</div>
				)}
			</div>

			<div className="rounded-lg border border-destructive/40 bg-card p-6 space-y-4">
				<h3 className="font-semibold text-destructive">Danger Zone</h3>
				<p className="text-sm text-muted-foreground">Deleting a form is permanent and cannot be undone.</p>
				<Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
					Delete Form
				</Button>
			</div>

			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Form</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete "{form.name}"? This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={handleDelete}
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
