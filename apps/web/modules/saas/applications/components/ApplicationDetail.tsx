"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { toastError } from "@repo/ui/components/toast";
import { ApplicationStatusActions } from "@saas/applications/components/ApplicationActions";
import { ApplicationEditDialog } from "@saas/applications/components/ApplicationEditDialog";
import { useApplication } from "@saas/applications/hooks/use-applications";
import { orpcClient } from "@shared/lib/orpc-client";
import {
	ArrowLeftIcon,
	CheckCircle2Icon,
	FileIcon,
	PencilIcon,
	XCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useState } from "react";

interface ApplicationDetailProps {
	applicationId: string;
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ApplicationDetail({ applicationId }: ApplicationDetailProps) {
	const t = useTranslations();
	const { data: application, isLoading } = useApplication(applicationId);
	const [editOpen, setEditOpen] = useState(false);

	if (isLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-6 w-24" />
				<Card>
					<CardContent className="pt-6 space-y-4">
						{Array.from({ length: 6 }).map((_, i) => (
							<div key={i} className="space-y-1">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-5 w-48" />
							</div>
						))}
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!application) {
		return (
			<div className="text-muted-foreground">Application not found.</div>
		);
	}

	const statusBadge = () => {
		if (application.status === "APPROVED") {
			return (
				<Badge status="success">
					{t("launchclub.applications.status.APPROVED")}
				</Badge>
			);
		}
		if (application.status === "REJECTED") {
			return (
				<Badge status="error">
					{t("launchclub.applications.status.REJECTED")}
				</Badge>
			);
		}
		return (
			<Badge status="warning">
				{t("launchclub.applications.status.PENDING")}
			</Badge>
		);
	};

	const childNames = (application.children ?? [])
		.map((c) => `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim())
		.filter(Boolean);
	const applicantTitle = childNames.length
		? childNames.join(", ")
		: `${application.parentFirstName ?? ""} ${application.parentLastName ?? ""}`.trim();

	return (
		<div className="space-y-6">
			<Link
				href="../applications"
				className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
			>
				<ArrowLeftIcon className="size-4" />
				{t("launchclub.applications.viewAll")}
			</Link>

			<Card>
				<CardHeader className="flex flex-row items-start justify-between">
					<div className="space-y-0.5">
						<CardTitle>{applicantTitle}</CardTitle>
						<p className="text-sm text-muted-foreground">
							Parent / Guardian:{" "}
							<span className="text-foreground">
								{application.parentFirstName}{" "}
								{application.parentLastName}
							</span>
						</p>
					</div>
					<div className="flex items-center gap-2">
						{statusBadge()}
						<Button
							variant="outline"
							size="sm"
							onClick={() => setEditOpen(true)}
						>
							<PencilIcon className="mr-1.5 size-4" />
							Edit
						</Button>
						<ApplicationStatusActions
							applicationId={applicationId}
							siteId={application.siteId}
							siteName={application.site?.name}
							currentStatus={application.status}
							children={application.children ?? []}
						/>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					{application.children &&
						application.children.length > 0 && (
							<div className="pt-2 border-t space-y-3">
								<p className="text-sm font-medium text-muted-foreground">
									Children
								</p>
								{application.children.map((child) => (
									<div
										key={child.id}
										className="rounded-lg border bg-muted/30 p-3 space-y-3"
									>
										{/* Name + grade */}
										<div className="flex items-center justify-between gap-2">
											<p className="text-sm font-medium">
												{child.firstName}{" "}
												{child.lastName}
											</p>
											{child.grade && (
												<Badge className="text-xs">
													{child.grade}
												</Badge>
											)}
										</div>

										{/* Core fields */}
										<div className="grid grid-cols-2 gap-x-4 gap-y-2">
											{child.birthday && (
												<DetailRow
													label="Date of Birth"
													value={new Date(
														child.birthday,
													).toLocaleDateString()}
												/>
											)}
											<DetailRow
												label="Part of Church"
												value={
													child.isPartOfChurch
														? "Yes"
														: "No"
												}
											/>
										</div>

										{/* Emergency contact */}
										{(child.emergencyContactName ||
											child.emergencyContactPhone) && (
											<div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t">
												<p className="col-span-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
													Emergency Contact
												</p>
												{child.emergencyContactName && (
													<DetailRow
														label="Name"
														value={
															child.emergencyContactName
														}
													/>
												)}
												{child.emergencyContactPhone && (
													<DetailRow
														label="Phone"
														value={
															child.emergencyContactPhone
														}
													/>
												)}
												{child.emergencyContactEmail && (
													<DetailRow
														label="Email"
														value={
															child.emergencyContactEmail
														}
													/>
												)}
											</div>
										)}

										{/* Consents */}
										<div className="pt-2 border-t">
											<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
												Consents
											</p>
											<div className="flex flex-wrap gap-3">
												<ConsentBadge
													label="Observation"
													granted={
														child.observationConsent
													}
												/>
												<ConsentBadge
													label="Terms & Conditions"
													granted={child.termsConsent}
												/>
												<ConsentBadge
													label="Photo / Video"
													granted={
														child.photoVideoConsent
													}
												/>
											</div>
										</div>

										{/* Profile field values */}
										{child.profileFieldValues &&
											child.profileFieldValues.length >
												0 && (
												<div className="pt-2 border-t grid grid-cols-2 gap-x-4 gap-y-2">
													<p className="col-span-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
														Profile Fields
													</p>
													{child.profileFieldValues.map(
														(pfv) => (
															<DetailRow
																key={pfv.id}
																label={
																	pfv
																		.customField
																		.name
																}
																value={
																	pfv.value ??
																	"—"
																}
															/>
														),
													)}
												</div>
											)}

										{/* Custom form field values */}
										{child.formFieldValues &&
											child.formFieldValues.length >
												0 && (
												<div className="pt-2 border-t grid grid-cols-2 gap-x-4 gap-y-2">
													<p className="col-span-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
														Form Responses
													</p>
													{child.formFieldValues
														.filter(
															(ffv) =>
																ffv.formField
																	.type !==
																"HEADER",
														)
														.map((ffv) =>
															ffv.formField
																.type ===
															"FILE" ? (
																<FileFieldRow
																	key={ffv.id}
																	applicationId={
																		applicationId
																	}
																	label={
																		ffv
																			.formField
																			.label
																	}
																	path={
																		ffv.value
																	}
																/>
															) : (
																<DetailRow
																	key={ffv.id}
																	label={
																		ffv
																			.formField
																			.label
																	}
																	value={
																		ffv.value
																	}
																/>
															),
														)}
												</div>
											)}
									</div>
								))}
							</div>
						)}
					{/* Parent / Guardian (primary contact) */}
					<div className="space-y-3 border-t pt-3">
						<p className="text-sm font-medium text-muted-foreground">
							Parent / Guardian (primary contact)
						</p>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<DetailRow
								label={t(
									"launchclub.applications.columns.email",
								)}
								value={application.parentEmail ?? "—"}
							/>
							<DetailRow
								label={t(
									"launchclub.applications.columns.phone",
								)}
								value={application.parentPhone ?? "—"}
							/>
							<DetailRow
								label={t(
									"launchclub.applications.columns.site",
								)}
								value={application.site?.name ?? "—"}
							/>
							<DetailRow
								label="Area"
								value={application.site?.area?.name ?? "—"}
							/>
							<DetailRow
								label={t(
									"launchclub.applications.columns.submitted",
								)}
								value={new Date(
									application.createdAt,
								).toLocaleDateString()}
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			<ApplicationEditDialog
				applicationId={applicationId}
				open={editOpen}
				onOpenChange={setEditOpen}
				initial={{
					parentFirstName: application.parentFirstName ?? "",
					parentLastName: application.parentLastName ?? "",
					parentEmail: application.parentEmail ?? "",
					parentPhone: application.parentPhone ?? "",
					children: (application.children ?? []).map((c) => ({
						id: c.id,
						firstName: c.firstName ?? "",
						lastName: c.lastName ?? "",
						grade: c.grade ?? "",
					})),
				}}
			/>
		</div>
	);
}

function FileFieldRow({
	applicationId,
	label,
	path,
}: {
	applicationId: string;
	label: string;
	path: string;
}) {
	const [loading, setLoading] = useState(false);

	if (!path) {
		return <DetailRow label={label} value="—" />;
	}

	const openFile = async () => {
		setLoading(true);
		try {
			const { downloadUrl } =
				await orpcClient.applications.fileFieldDownloadUrl({
					applicationId,
					path,
				});
			window.open(downloadUrl, "_blank", "noopener,noreferrer");
		} catch {
			toastError("Could not open the file. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div>
			<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
				{label}
			</p>
			<button
				type="button"
				onClick={openFile}
				disabled={loading}
				className="mt-1 inline-flex items-center gap-1.5 text-sm text-primary hover:underline disabled:opacity-50"
			>
				<FileIcon className="size-3.5" />
				{loading ? "Opening…" : "View file"}
			</button>
		</div>
	);
}

function ConsentBadge({ label, granted }: { label: string; granted: boolean }) {
	return (
		<div
			className={`flex items-center gap-1.5 text-xs font-medium ${granted ? "text-green-600" : "text-destructive"}`}
		>
			{granted ? (
				<CheckCircle2Icon className="size-3.5 shrink-0" />
			) : (
				<XCircleIcon className="size-3.5 shrink-0" />
			)}
			{label}
		</div>
	);
}

function DetailRow({
	label,
	value,
}: {
	label: string;
	value: string | ReactNode;
}) {
	return (
		<div>
			<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
				{label}
			</p>
			<div className="mt-1 text-sm">{value}</div>
		</div>
	);
}
