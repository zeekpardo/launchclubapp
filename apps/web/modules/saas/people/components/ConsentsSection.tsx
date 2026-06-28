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
import {
	useConsentItems,
	usePdfDownloadUrl,
} from "@saas/applications/hooks/use-consent-items";
import { useSession } from "@saas/auth/hooks/use-session";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import {
	CheckCircle2Icon,
	ChevronDownIcon,
	FileTextIcon,
	PaperclipIcon,
	PencilIcon,
	UploadIcon,
	XCircleIcon,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAcademicYears } from "../hooks/use-academic-records";
import {
	usePersonConsents,
	usePreviousYearConsents,
} from "../hooks/use-person-consents";
import { useUpsertPersonConsent } from "../hooks/use-upsert-person-consent";

interface ConsentItem {
	id: string;
	name: string;
	nameES: string | null;
	pdfKey: string | null;
	sortOrder: number;
}

interface ConsentRecord {
	id: string;
	consentItemId: string;
	consentItem: ConsentItem;
	granted: boolean;
	grantedAt: Date | string | null;
	signatureFileUrl: string | null;
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function CollapseButton({
	collapsed,
	onToggle,
}: {
	collapsed: boolean;
	onToggle: () => void;
}) {
	return (
		<Button
			size="icon"
			variant="ghost"
			className="size-7"
			onClick={onToggle}
		>
			<ChevronDownIcon
				className={`size-4 transition-transform ${collapsed ? "" : "rotate-180"}`}
			/>
		</Button>
	);
}

function ViewConsentFormButton({
	consentItem,
	organizationId,
}: {
	consentItem: ConsentItem;
	organizationId: string;
}) {
	const pdfDownloadUrl = usePdfDownloadUrl();
	if (!consentItem.pdfKey) return null;
	async function handleClick() {
		try {
			const { downloadUrl } = await pdfDownloadUrl.mutateAsync({
				id: consentItem.id,
				organizationId,
			});
			window.open(downloadUrl, "_blank", "noopener,noreferrer");
		} catch {
			toastError("Could not load consent form PDF");
		}
	}
	return (
		<button
			type="button"
			title="View consent form"
			className="text-muted-foreground hover:text-primary transition-colors"
			onClick={handleClick}
			disabled={pdfDownloadUrl.isPending}
		>
			<FileTextIcon className="size-3.5" />
		</button>
	);
}

// ---------------------------------------------------------------------------
// Display row
// ---------------------------------------------------------------------------

interface ConsentRowProps {
	label: string;
	record: ConsentRecord | undefined;
	consentItem: ConsentItem;
	organizationId: string;
}

function ConsentRow({
	label,
	record,
	consentItem,
	organizationId,
}: ConsentRowProps) {
	if (!record) {
		return (
			<div className="flex items-center gap-2 text-sm">
				<span className="text-muted-foreground">—</span>
				<span className="text-muted-foreground">{label}</span>
				<ViewConsentFormButton
					consentItem={consentItem}
					organizationId={organizationId}
				/>
				<span className="text-xs text-muted-foreground ml-auto">
					Not collected
				</span>
			</div>
		);
	}

	const granted = record.granted;
	const dateStr =
		granted && record.grantedAt
			? format(new Date(record.grantedAt), "MMM d, yyyy")
			: null;

	return (
		<div
			className={`flex items-center gap-2 text-sm ${granted ? "text-green-600" : "text-muted-foreground"}`}
		>
			{granted ? (
				<CheckCircle2Icon className="size-4 shrink-0" />
			) : (
				<XCircleIcon className="size-4 shrink-0 text-destructive" />
			)}
			<span className={granted ? "font-medium" : ""}>{label}</span>
			<ViewConsentFormButton
				consentItem={consentItem}
				organizationId={organizationId}
			/>
			{dateStr && (
				<span className="text-xs text-muted-foreground">{dateStr}</span>
			)}
			{granted && record.signatureFileUrl && (
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

// ---------------------------------------------------------------------------
// Edit row
// ---------------------------------------------------------------------------

const consentRowSchema = z.object({
	granted: z.boolean(),
	grantedAt: z.string().nullable(),
	signatureFileUrl: z.string().nullable(),
});

type ConsentRowValue = z.infer<typeof consentRowSchema>;

interface ConsentEditRowProps {
	consentItem: ConsentItem;
	organizationId: string;
	personId: string;
	value: ConsentRowValue;
	onChange: (val: ConsentRowValue) => void;
}

function ConsentEditRow({
	consentItem,
	organizationId,
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
		onChange({
			...value,
			granted: checked,
			grantedAt: checked ? new Date().toISOString().slice(0, 10) : null,
		});
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
				fileName: `${consentItem.id.toLowerCase()}-${Date.now()}-${file.name}`,
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
			toastError("Failed to upload document");
		} finally {
			setUploading(false);
		}
	}

	return (
		<div className="space-y-2 rounded-lg border p-3">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Label className="text-sm font-medium">
						{consentItem.name}
					</Label>
					<ViewConsentFormButton
						consentItem={consentItem}
						organizationId={organizationId}
					/>
				</div>
				<Switch
					checked={value.granted}
					onCheckedChange={handleToggle}
				/>
			</div>

			{value.granted && (
				<div className="space-y-2 pl-1">
					<div className="space-y-1">
						<Label
							htmlFor={`date-${consentItem.id}`}
							className="text-xs text-muted-foreground"
						>
							Date granted
						</Label>
						<Input
							id={`date-${consentItem.id}`}
							type="date"
							value={value.grantedAt ?? ""}
							onChange={handleDateChange}
							className="h-8 text-sm"
						/>
					</div>

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
								{uploading ? "Uploading..." : "Upload document"}
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
				</div>
			)}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Edit dialog
// ---------------------------------------------------------------------------

const editSchema = z.record(z.string(), consentRowSchema);
type EditValues = Record<string, ConsentRowValue>;

interface EditConsentsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	personId: string;
	organizationId: string;
	academicYearId: string;
	existingConsents: ConsentRecord[];
	consentItems: ConsentItem[];
}

function EditConsentsDialog({
	open,
	onOpenChange,
	personId,
	organizationId,
	academicYearId,
	existingConsents,
	consentItems,
}: EditConsentsDialogProps) {
	const upsertConsent = useUpsertPersonConsent();

	const defaultValues = useMemo<EditValues>(() => {
		const result: EditValues = {};
		for (const item of consentItems) {
			const r = existingConsents.find((c) => c.consentItemId === item.id);
			result[item.id] = {
				granted: r?.granted ?? false,
				grantedAt: r?.grantedAt
					? new Date(r.grantedAt).toISOString().slice(0, 10)
					: null,
				signatureFileUrl: r?.signatureFileUrl ?? null,
			};
		}
		return result;
	}, [consentItems, existingConsents]);

	const form = useForm<EditValues>({
		resolver: zodResolver(editSchema),
		defaultValues,
	});

	function handleOpenChange(nextOpen: boolean) {
		if (nextOpen) form.reset(defaultValues);
		onOpenChange(nextOpen);
	}

	async function onSubmit(values: EditValues) {
		try {
			await Promise.all(
				consentItems.map((item) =>
					upsertConsent.mutateAsync({
						personId,
						academicYearId,
						consentItemId: item.id,
						granted: values[item.id]?.granted ?? false,
						grantedAt:
							values[item.id]?.granted &&
							values[item.id]?.grantedAt
								? new Date(
										values[item.id].grantedAt!,
									).toISOString()
								: null,
						signatureFileUrl:
							values[item.id]?.signatureFileUrl ?? null,
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
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="space-y-3"
				>
					{consentItems.map((item) => (
						<ConsentEditRow
							key={item.id}
							consentItem={item}
							organizationId={organizationId}
							personId={personId}
							value={
								formValues[item.id] ?? {
									granted: false,
									grantedAt: null,
									signatureFileUrl: null,
								}
							}
							onChange={(val) => form.setValue(item.id, val)}
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
						<Button
							type="submit"
							disabled={upsertConsent.isPending}
						>
							{upsertConsent.isPending ? "Saving..." : "Save"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

// ---------------------------------------------------------------------------
// Previous year
// ---------------------------------------------------------------------------

interface PreviousYearConsentsProps {
	personId: string;
	organizationId: string;
}

function PreviousYearConsents({
	personId,
	organizationId,
}: PreviousYearConsentsProps) {
	const { data, isLoading } = usePreviousYearConsents(
		personId,
		organizationId,
	);
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
					<CollapseButton
						collapsed={collapsed}
						onToggle={() => setCollapsed((c) => !c)}
					/>
				</div>
			</CardHeader>
			{!collapsed && (
				<CardContent className="space-y-2">
					{(consents as ConsentRecord[]).map((c) => (
						<ConsentRow
							key={c.id}
							label={c.consentItem?.name ?? c.consentItemId}
							record={c}
							consentItem={c.consentItem}
							organizationId={organizationId}
						/>
					))}
				</CardContent>
			)}
		</Card>
	);
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

interface ConsentsSectionProps {
	personId: string;
	organizationId: string;
	personType: "STUDENT" | "MENTOR" | "PARENT";
}

export function ConsentsSection({
	personId,
	organizationId,
	personType,
}: ConsentsSectionProps) {
	const { user } = useSession();
	const { activeOrganization } = useActiveOrganization();
	const { data: academicYears = [] } = useAcademicYears(organizationId);
	const activeYear = academicYears.find((y) => y.isActive);
	const { data: consents = [] } = usePersonConsents(personId, activeYear?.id);

	const { data: allConsentItems = [] } = useConsentItems(organizationId);

	const consentItems = allConsentItems.filter(
		(item) => item.applicantType === personType && item.isActive,
	) as ConsentItem[];

	const [collapsed, setCollapsed] = useState(false);
	const [dialogOpen, setDialogOpen] = useState(false);

	const isAdmin = isOrganizationAdmin(activeOrganization, user);

	if (!activeYear || consentItems.length === 0) return null;

	const typedConsents = consents as ConsentRecord[];

	return (
		<>
			<Card>
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="text-base">
								Consents
							</CardTitle>
							{activeYear && (
								<p className="text-xs text-muted-foreground mt-0.5">
									{activeYear.label}
								</p>
							)}
						</div>
						<div className="flex items-center gap-1">
							{isAdmin && (
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
							<CollapseButton
								collapsed={collapsed}
								onToggle={() => setCollapsed((c) => !c)}
							/>
						</div>
					</div>
				</CardHeader>
				{!collapsed && (
					<CardContent className="space-y-2">
						{consentItems.map((item) => (
							<ConsentRow
								key={item.id}
								label={item.name}
								record={typedConsents.find(
									(c) => c.consentItemId === item.id,
								)}
								consentItem={item}
								organizationId={organizationId}
							/>
						))}
					</CardContent>
				)}
			</Card>

			<PreviousYearConsents
				personId={personId}
				organizationId={organizationId}
			/>

			<EditConsentsDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				personId={personId}
				organizationId={organizationId}
				academicYearId={activeYear.id}
				existingConsents={typedConsents}
				consentItems={consentItems}
			/>
		</>
	);
}
