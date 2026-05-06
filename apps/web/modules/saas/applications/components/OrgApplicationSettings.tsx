"use client";

import { Button } from "@repo/ui/components/button";
import { Switch } from "@repo/ui/components/switch";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { cn } from "@repo/ui";
import {
	useOrgApplicationSettings,
	useUpdateOrgApplicationSettings,
} from "@saas/applications/hooks/use-application-settings";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { FileTextIcon, PaperclipIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";

type ConsentType = "observation" | "terms" | "photoVideo";

interface ConsentFormUploadProps {
	organizationId: string;
	consentType: ConsentType;
	currentUrl: string | null | undefined;
	onSaved: (url: string | null) => void;
}

function ConsentFormUpload({ organizationId, consentType, currentUrl, onSaved }: ConsentFormUploadProps) {
	const [uploading, setUploading] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const getUploadUrl = useMutation(orpc.applications.consentFormUploadUrl.mutationOptions());
	const getDownloadUrl = useMutation(orpc.applications.consentFormDownloadUrl.mutationOptions());
	const saveSettings = useMutation(orpc.applications.updateOrgSettings.mutationOptions());

	async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		if (file.type !== "application/pdf") {
			toastError("Only PDF files are allowed");
			return;
		}
		setUploading(true);
		try {
			const { uploadUrl, fileKey } = await getUploadUrl.mutateAsync({ organizationId, consentType });
			const res = await fetch(uploadUrl, {
				method: "PUT",
				body: file,
				headers: { "Content-Type": "application/pdf" },
			});
			if (!res.ok) throw new Error("Upload failed");
			const urlField = consentType === "observation"
				? { observationConsentFormUrl: fileKey }
				: consentType === "terms"
				? { termsConsentFormUrl: fileKey }
				: { photoVideoConsentFormUrl: fileKey };
			await saveSettings.mutateAsync({ organizationId, ...urlField });
			onSaved(fileKey);
			toastSuccess("Form PDF saved");
		} catch {
			toastError("Upload failed");
		} finally {
			setUploading(false);
			if (inputRef.current) inputRef.current.value = "";
		}
	}

	async function handleRemove() {
		const urlField = consentType === "observation"
			? { observationConsentFormUrl: null }
			: consentType === "terms"
			? { termsConsentFormUrl: null }
			: { photoVideoConsentFormUrl: null };
		try {
			await saveSettings.mutateAsync({ organizationId, ...urlField });
			onSaved(null);
			toastSuccess("Form PDF removed");
		} catch {
			toastError("Failed to remove");
		}
	}

	return (
		<div className="flex items-center gap-2">
			<input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFile} />
			{currentUrl ? (
				<>
					<button
						type="button"
						onClick={async () => {
							try {
								const { downloadUrl } = await getDownloadUrl.mutateAsync({ organizationId, consentType });
								window.open(downloadUrl, "_blank", "noopener,noreferrer");
							} catch {
								toastError("Could not load PDF");
							}
						}}
						disabled={getDownloadUrl.isPending}
						className="flex items-center gap-1.5 text-xs text-primary hover:underline disabled:opacity-50"
					>
						<FileTextIcon className="size-3.5" />
						{getDownloadUrl.isPending ? "Loading…" : "View PDF"}
					</button>
					<button
						type="button"
						onClick={handleRemove}
						className="text-muted-foreground hover:text-destructive transition-colors"
						disabled={saveSettings.isPending}
					>
						<Trash2Icon className="size-3.5" />
					</button>
					<button
						type="button"
						onClick={() => inputRef.current?.click()}
						className="text-xs text-muted-foreground hover:text-foreground transition-colors"
						disabled={uploading}
					>
						Replace
					</button>
				</>
			) : (
				<button
					type="button"
					onClick={() => inputRef.current?.click()}
					disabled={uploading}
					className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
				>
					<PaperclipIcon className="size-3.5" />
					{uploading ? "Uploading…" : "Attach form PDF"}
				</button>
			)}
		</div>
	);
}

export function OrgApplicationSettings() {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const { data: orgSettings, isLoading } = useOrgApplicationSettings();
	const updateOrgSettings = useUpdateOrgApplicationSettings();

	const [autoMigrate, setAutoMigrate] = useState(false);
	const [emailNotifications, setEmailNotifications] = useState(false);
	const [studentIdMode, setStudentIdMode] = useState<"manual" | "auto">("auto");
	const [enableConsentFileUpload, setEnableConsentFileUpload] = useState(false);
	const [showObservationConsent, setShowObservationConsent] = useState(true);
	const [showTermsConsent, setShowTermsConsent] = useState(true);
	const [showPhotoVideoConsent, setShowPhotoVideoConsent] = useState(true);
	const [observationConsentFormUrl, setObservationConsentFormUrl] = useState<string | null>(null);
	const [termsConsentFormUrl, setTermsConsentFormUrl] = useState<string | null>(null);
	const [photoVideoConsentFormUrl, setPhotoVideoConsentFormUrl] = useState<string | null>(null);

	useEffect(() => {
		if (orgSettings) {
			setAutoMigrate(orgSettings.autoMigrate);
			setEmailNotifications(orgSettings.emailNotifications);
			if (orgSettings?.studentIdMode) setStudentIdMode(orgSettings.studentIdMode as "manual" | "auto");
			setEnableConsentFileUpload(orgSettings.enableConsentFileUpload ?? false);
			setShowObservationConsent(orgSettings.showObservationConsent ?? true);
			setShowTermsConsent(orgSettings.showTermsConsent ?? true);
			setShowPhotoVideoConsent(orgSettings.showPhotoVideoConsent ?? true);
			setObservationConsentFormUrl(orgSettings.observationConsentFormUrl ?? null);
			setTermsConsentFormUrl(orgSettings.termsConsentFormUrl ?? null);
			setPhotoVideoConsentFormUrl(orgSettings.photoVideoConsentFormUrl ?? null);
		}
	}, [orgSettings]);

	async function handleSave() {
		if (!activeOrganization?.id) return;
		try {
			await updateOrgSettings.mutateAsync({
				organizationId: activeOrganization.id,
				autoMigrate,
				emailNotifications,
				studentIdMode,
				enableConsentFileUpload,
				showObservationConsent,
				showTermsConsent,
				showPhotoVideoConsent,
			});
			toastSuccess(t("launchclub.applications.settings.notifications.saved"));
		} catch {
			toastError(t("launchclub.applications.settings.notifications.error"));
		}
	}

	if (isLoading) {
		return <div className="text-sm text-muted-foreground">{t("launchclub.applications.settings.loading")}</div>;
	}

	const orgId = activeOrganization?.id ?? "";

	const consentRows = [
		{
			key: "observation" as ConsentType,
			label: "Observation sessions",
			show: showObservationConsent,
			setShow: setShowObservationConsent,
			formUrl: observationConsentFormUrl,
			setFormUrl: setObservationConsentFormUrl,
		},
		{
			key: "terms" as ConsentType,
			label: "Terms & conditions",
			show: showTermsConsent,
			setShow: setShowTermsConsent,
			formUrl: termsConsentFormUrl,
			setFormUrl: setTermsConsentFormUrl,
		},
		{
			key: "photoVideo" as ConsentType,
			label: "Photos & videos",
			show: showPhotoVideoConsent,
			setShow: setShowPhotoVideoConsent,
			formUrl: photoVideoConsentFormUrl,
			setFormUrl: setPhotoVideoConsentFormUrl,
		},
	];

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<p className="text-sm font-medium">{t("launchclub.applications.settings.autoMigrate")}</p>
					<p className="text-xs text-muted-foreground mt-0.5">{t("launchclub.applications.settings.autoMigrateDesc")}</p>
				</div>
				<Switch checked={autoMigrate} onCheckedChange={setAutoMigrate} />
			</div>

			<div className="flex items-center justify-between opacity-50">
				<div>
					<div className="flex items-center gap-2">
						<p className="text-sm font-medium">{t("launchclub.applications.settings.emailNotifications")}</p>
						<span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Coming soon</span>
					</div>
					<p className="text-xs text-muted-foreground mt-0.5">{t("launchclub.applications.settings.emailNotificationsDesc")}</p>
				</div>
				<Switch checked={false} disabled />
			</div>

			<div className="rounded-lg border p-4 space-y-4">
				<p className="text-sm font-semibold">Student IDs</p>
				<div className="flex items-center justify-between">
					<div>
						<p className="text-sm font-medium">ID Generation</p>
						<p className="text-xs text-muted-foreground mt-0.5">Automatically assign a unique 6-digit ID to each child</p>
					</div>
					<div className="flex rounded-md border overflow-hidden">
						<button
							type="button"
							onClick={() => setStudentIdMode("auto")}
							className={cn("px-3 py-1 text-sm", studentIdMode === "auto" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
						>
							Auto
						</button>
						<button
							type="button"
							onClick={() => setStudentIdMode("manual")}
							className={cn("px-3 py-1 text-sm border-l", studentIdMode === "manual" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
						>
							Manual
						</button>
					</div>
				</div>
			</div>

			<div className="rounded-lg border p-4 space-y-4">
				<div>
					<p className="text-sm font-semibold">Consents</p>
					<p className="text-xs text-muted-foreground mt-0.5">Choose which consents appear on the application form. Attach a PDF for applicants to download, sign, and return.</p>
				</div>

				{consentRows.map(({ key, label, show, setShow, formUrl, setFormUrl }) => (
					<div key={key} className="space-y-2">
						<div className="flex items-center justify-between">
							<p className="text-sm font-medium">{label}</p>
							<Switch checked={show} onCheckedChange={setShow} />
						</div>
						{show && orgId && (
							<div className="pl-0">
								<ConsentFormUpload
									organizationId={orgId}
									consentType={key}
									currentUrl={formUrl}
									onSaved={setFormUrl}
								/>
							</div>
						)}
					</div>
				))}

				<div className="flex items-center justify-between border-t pt-4">
					<div>
						<p className="text-sm font-medium">Signature file uploads</p>
						<p className="text-xs text-muted-foreground mt-0.5">Show a file upload on each enabled consent</p>
					</div>
					<Switch checked={enableConsentFileUpload} onCheckedChange={setEnableConsentFileUpload} />
				</div>
			</div>

			<div className="flex justify-end pt-2 border-t">
				<Button
					variant="primary"
					onClick={handleSave}
					loading={updateOrgSettings.isPending}
				>{t("launchclub.applications.settings.save")}</Button>
			</div>
		</div>
	);
}
