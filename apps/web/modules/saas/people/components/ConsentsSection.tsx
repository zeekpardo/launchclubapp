"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { isOrganizationAdmin } from "@repo/auth/lib/helper";
import { Button } from "@repo/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Switch } from "@repo/ui/components/switch";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { useSession } from "@saas/auth/hooks/use-session";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
	CheckCircle2Icon,
	ChevronDownIcon,
	PaperclipIcon,
	PencilIcon,
	UploadIcon,
	XCircleIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAcademicYears } from "../hooks/use-academic-records";
import {
	usePersonConsents,
	usePreviousYearConsents,
} from "../hooks/use-person-consents";
import { useUpsertPersonConsent } from "../hooks/use-upsert-person-consent";

type ConsentType = "OBSERVATION" | "TERMS_AND_CONDITIONS" | "PHOTO_VIDEO";

const CONSENT_LABELS: Record<ConsentType, string> = {
	OBSERVATION: "Observation",
	TERMS_AND_CONDITIONS: "Terms & Conditions",
	PHOTO_VIDEO: "Photo / Video",
};

const ALL_CONSENT_TYPES: ConsentType[] = [
	"OBSERVATION",
	"TERMS_AND_CONDITIONS",
	"PHOTO_VIDEO",
];

interface ConsentRecord {
	id: string;
	consentType: ConsentType;
	granted: boolean;
	grantedAt: Date | string | null;
	signatureFileUrl: string | null;
}

interface ConsentRowProps {
	label: string;
	record: ConsentRecord | undefined;
}

function ConsentRow({ label, record }: ConsentRowProps) {
	if (!record) {
		return (
			<div className="flex items-center gap-2 text-sm">
				<span className="text-muted-foreground">—</span>
				<span className="text-muted-foreground">{label}</span>
				<span className="text-xs text-muted-foreground ml-auto">Not collected</span>
			</div>
		);
	}

	if (!record.granted) {
		return (
			<div className="flex items-center gap-2 text-sm text-muted-foreground">
				<XCircleIcon className="size-4 shrink-0 text-destructive" />
				<span>{label}</span>
			</div>
		);
	}

	const dateStr = record.grantedAt
		? format(new Date(record.grantedAt), "MMM d, yyyy")
		: null;

	return (
		<div className="flex items-center gap-2 text-sm text-green-600">
			<CheckCircle2Icon className="size-4 shrink-0" />
			<span className="font-medium">{label}</span>
			{dateStr && (
				<span className="text-xs text-muted-foreground">{dateStr}</span>
			)}
			{record.signatureFileUrl && (
				<a
					href={`/image-proxy/consent-signatures/${record.signatureFileUrl}`}
					target="_blank"
					rel="noopener noreferrer"
					className="ml-auto text-muted-foreground hover:text-foreground"
					title="View signature file"
				>
					<PaperclipIcon className="size-3.5" />
				</a>
			)}
		</div>
	);
}

const consentRowSchema = z.object({
	granted: z.boolean(),
	grantedAt: z.string().nullable(),
	signatureFileUrl: z.string().nullable(),
});

const editConsentsSchema = z.object({
	OBSERVATION: consentRowSchema,
	TERMS_AND_CONDITIONS: consentRowSchema,
	PHOTO_VIDEO: consentRowSchema,
});

type EditConsentsValues = z.infer<typeof editConsentsSchema>;

interface ConsentEditRowProps {
	consentType: ConsentType;
	label: string;
	enableFileUpload: boolean;
	personId: string;
	value: EditConsentsValues[ConsentType];
	onChange: (val: EditConsentsValues[ConsentType]) => void;
}

function ConsentEditRow({
	consentType,
	label,
	enableFileUpload,
	personId,
	value,
	onChange,
}: ConsentEditRowProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [uploading, setUploading] = useState(false);
	const createUploadUrl = useMutation(
		orpc.personConsents.createSignatureUploadUrl.mutationOptions(),
	);

	function handleToggle(checked: boolean) {
		if (checked) {
			onChange({
				...value,
				granted: true,
				grantedAt: new Date().toISOString().slice(0, 10),
			});
		} else {
			onChange({
				...value,
				granted: false,
				grantedAt: null,
			});
		}
	}

	function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
		onChange({ ...value, grantedAt: e.target.value || null });
	}

	async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		e.target.value = "";
		setUploading(true);
		try {
			const { uploadUrl, fileUrl } = await createUploadUrl.mutateAsync({
				personId,
				fileName: `${consentType.toLowerCase()}-${Date.now()}-${file.name}`,
				contentType: file.type,
			});
			const resp = await fetch(uploadUrl, {
				method: "PUT",
				body: file,
				headers: { "Content-Type": file.type },
			});
			if (!resp.ok) throw new Error("Upload failed");
			onChange({ ...value, signatureFileUrl: fileUrl });
		} catch {
			toastError("Failed to upload signature file");
		} finally {
			setUploading(false);
		}
	}

	return (
		<div className="space-y-2 rounded-lg border p-3">
			<div className="flex items-center justify-between">
				<Label className="text-sm font-medium">{label}</Label>
				<Switch checked={value.granted} onCheckedChange={handleToggle} />
			</div>

			{value.granted && (
				<div className="space-y-2 pl-1">
					<div className="space-y-1">
						<Label htmlFor={`date-${consentType}`} className="text-xs text-muted-foreground">
							Date granted
						</Label>
						<Input
							id={`date-${consentType}`}
							type="date"
							value={value.grantedAt ?? ""}
							onChange={handleDateChange}
							className="h-8 text-sm"
						/>
					</div>

					{enableFileUpload && (
						<div>
							<input
								ref={fileInputRef}
								type="file"
								accept="image/*,.pdf"
								className="hidden"
								onChange={handleFileChange}
							/>
							<div className="flex items-center gap-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="h-7 gap-1 text-xs"
									disabled={uploading}
									onClick={() => fileInputRef.current?.click()}
								>
									<UploadIcon className="size-3" />
									{uploading ? "Uploading..." : "Upload signature"}
								</Button>
								{value.signatureFileUrl && (
									<a
										href={`/image-proxy/consent-signatures/${value.signatureFileUrl}`}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
									>
										<PaperclipIcon className="size-3" />
										View file
									</a>
								)}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

interface EditConsentsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	personId: string;
	academicYearId: string;
	existingConsents: ConsentRecord[];
	enableFileUpload: boolean;
}

function EditConsentsDialog({
	open,
	onOpenChange,
	personId,
	academicYearId,
	existingConsents,
	enableFileUpload,
}: EditConsentsDialogProps) {
	const upsertConsent = useUpsertPersonConsent();

	function buildDefaultValues(): EditConsentsValues {
		const get = (type: ConsentType) => {
			const r = existingConsents.find((c) => c.consentType === type);
			return {
				granted: r?.granted ?? false,
				grantedAt: r?.grantedAt
					? new Date(r.grantedAt).toISOString().slice(0, 10)
					: null,
				signatureFileUrl: r?.signatureFileUrl ?? null,
			};
		};
		return {
			OBSERVATION: get("OBSERVATION"),
			TERMS_AND_CONDITIONS: get("TERMS_AND_CONDITIONS"),
			PHOTO_VIDEO: get("PHOTO_VIDEO"),
		};
	}

	const form = useForm<EditConsentsValues>({
		resolver: zodResolver(editConsentsSchema),
		defaultValues: buildDefaultValues(),
	});

	function handleOpenChange(nextOpen: boolean) {
		if (nextOpen) {
			form.reset(buildDefaultValues());
		}
		onOpenChange(nextOpen);
	}

	async function onSubmit(values: EditConsentsValues) {
		try {
			await Promise.all(
				ALL_CONSENT_TYPES.map((type) =>
					upsertConsent.mutateAsync({
						personId,
						academicYearId,
						consentType: type,
						granted: values[type].granted,
						grantedAt: values[type].granted && values[type].grantedAt
							? new Date(values[type].grantedAt).toISOString()
							: null,
						signatureFileUrl: values[type].signatureFileUrl,
					}),
				),
			);
			toastSuccess("Consents saved");
			onOpenChange(false);
		} catch {
			toastError("Failed to save consents");
		}
	}

	const formValues = form.watch();

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Consents</DialogTitle>
				</DialogHeader>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
					{ALL_CONSENT_TYPES.map((type) => (
						<ConsentEditRow
							key={type}
							consentType={type}
							label={CONSENT_LABELS[type]}
							enableFileUpload={enableFileUpload}
							personId={personId}
							value={formValues[type]}
							onChange={(val) => form.setValue(type, val)}
						/>
					))}
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={upsertConsent.isPending}>
							{upsertConsent.isPending ? "Saving..." : "Save"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

interface PreviousYearConsentsProps {
	personId: string;
	organizationId: string;
}

function PreviousYearConsents({ personId, organizationId }: PreviousYearConsentsProps) {
	const { data, isLoading } = usePreviousYearConsents(personId, organizationId);
	const [collapsed, setCollapsed] = useState(true);

	if (isLoading || !data) return null;

	const { academicYear, consents } = data;

	return (
		<Card>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="text-sm text-muted-foreground">
						{academicYear.label} (Previous Year)
					</CardTitle>
					<Button
						size="icon"
						variant="ghost"
						className="size-7"
						onClick={() => setCollapsed((c) => !c)}
					>
						<ChevronDownIcon
							className={`size-4 transition-transform ${collapsed ? "" : "rotate-180"}`}
						/>
					</Button>
				</div>
			</CardHeader>
			{!collapsed && (
				<CardContent className="space-y-2">
					{ALL_CONSENT_TYPES.map((type) => (
						<ConsentRow
							key={type}
							label={CONSENT_LABELS[type]}
							record={consents.find((c) => c.consentType === type) as ConsentRecord | undefined}
						/>
					))}
				</CardContent>
			)}
		</Card>
	);
}

interface ConsentsSectionProps {
	personId: string;
	organizationId: string;
}

export function ConsentsSection({ personId, organizationId }: ConsentsSectionProps) {
	const { user } = useSession();
	const { activeOrganization } = useActiveOrganization();
	const { data: academicYears = [] } = useAcademicYears(organizationId);
	const activeYear = academicYears.find((y) => y.isActive);
	const { data: consents = [] } = usePersonConsents(personId, activeYear?.id);

	const { data: orgSettings } = useQuery(
		orpc.applications.getOrgSettings.queryOptions({
			input: { organizationId },
			enabled: !!organizationId,
		}),
	);

	const [collapsed, setCollapsed] = useState(false);
	const [dialogOpen, setDialogOpen] = useState(false);

	const isAdmin = isOrganizationAdmin(activeOrganization, user);
	const enableFileUpload = orgSettings?.enableConsentFileUpload ?? false;

	if (!activeYear) return null;

	return (
		<>
			<Card>
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="text-base">Consents</CardTitle>
							{activeYear && (
								<p className="text-xs text-muted-foreground mt-0.5">
									{activeYear.label}
								</p>
							)}
						</div>
						<div className="flex items-center gap-1">
							{isAdmin && !collapsed && (
								<Button
									size="sm"
									variant="ghost"
									className="h-7 gap-1 text-xs"
									onClick={() => setDialogOpen(true)}
								>
									<PencilIcon className="size-3" />
									Edit
								</Button>
							)}
							<Button
								size="icon"
								variant="ghost"
								className="size-7"
								onClick={() => setCollapsed((c) => !c)}
							>
								<ChevronDownIcon
									className={`size-4 transition-transform ${collapsed ? "" : "rotate-180"}`}
								/>
							</Button>
						</div>
					</div>
				</CardHeader>
				{!collapsed && (
					<CardContent className="space-y-2">
						{ALL_CONSENT_TYPES.map((type) => (
							<ConsentRow
								key={type}
								label={CONSENT_LABELS[type]}
								record={consents.find((c) => c.consentType === type) as ConsentRecord | undefined}
							/>
						))}
					</CardContent>
				)}
			</Card>

			<PreviousYearConsents personId={personId} organizationId={organizationId} />

			<EditConsentsDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				personId={personId}
				academicYearId={activeYear.id}
				existingConsents={consents as ConsentRecord[]}
				enableFileUpload={enableFileUpload}
			/>
		</>
	);
}
