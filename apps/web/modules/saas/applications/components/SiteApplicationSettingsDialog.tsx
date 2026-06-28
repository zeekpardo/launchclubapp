"use client";

import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Switch } from "@repo/ui/components/switch";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { useUpdateSiteApplicationSettings } from "@saas/applications/hooks/use-application-settings";
import { CopyButton } from "@shared/components/CopyButton";
import { useEffect, useState } from "react";

interface SiteApplicationSettingsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	site: {
		id: string;
		name: string;
		slug: string;
		acceptApplications: boolean;
		applicationDeadline?: string | null;
	};
}

export function SiteApplicationSettingsDialog({
	open,
	onOpenChange,
	site,
}: SiteApplicationSettingsDialogProps) {
	const updateSite = useUpdateSiteApplicationSettings();

	const [acceptApplications, setAcceptApplications] = useState(
		site.acceptApplications,
	);
	const [deadline, setDeadline] = useState(
		site.applicationDeadline ? site.applicationDeadline.slice(0, 10) : "",
	);

	const appUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/apply/${site.slug}`;

	useEffect(() => {
		setAcceptApplications(site.acceptApplications);
		setDeadline(
			site.applicationDeadline
				? site.applicationDeadline.slice(0, 10)
				: "",
		);
	}, [site]);

	async function handleSave() {
		try {
			await updateSite.mutateAsync({
				id: site.id,
				acceptApplications,
				applicationDeadline: deadline
					? new Date(deadline).toISOString()
					: null,
			});
			toastSuccess("Site application settings saved.");
		} catch {
			toastError("Failed to save settings.");
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>
						Application Settings — {site.name}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-5 pt-1">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium">
								Accept applications
							</p>
							<p className="text-xs text-muted-foreground">
								Allow new applications to be submitted for this
								site
							</p>
						</div>
						<Switch
							checked={acceptApplications}
							onCheckedChange={setAcceptApplications}
						/>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="deadline">Application deadline</Label>
						<Input
							id="deadline"
							type="date"
							value={deadline}
							onChange={(e) => setDeadline(e.target.value)}
						/>
						<p className="text-xs text-muted-foreground">
							Leave blank for no deadline
						</p>
					</div>

					<div className="space-y-1.5">
						<Label>Application URL</Label>
						<div className="flex items-center gap-2">
							<div className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm font-mono overflow-x-auto whitespace-nowrap">
								{appUrl}
							</div>
							<CopyButton
								url={appUrl}
								title="Copy application URL"
							/>
						</div>
						<p className="text-xs text-muted-foreground">
							Share this URL with parents to accept applications
							for this site
						</p>
					</div>

					<div className="flex justify-end pt-1 border-t">
						<Button
							variant="primary"
							onClick={handleSave}
							loading={updateSite.isPending}
						>
							Save
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
